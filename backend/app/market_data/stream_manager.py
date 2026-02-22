"""Upstream provider WebSocket connection management and fan-out.

StreamManager connects to external market data providers (Binance WS for crypto,
Twelve Data REST polling for forex) and fans out price updates to all subscribed
frontend clients via ConnectionManager.
"""

import asyncio
import json
import random

import structlog
import websockets

from app.config import settings
from app.market_data.connection_manager import ConnectionManager
from app.market_data.providers.twelve_data import TwelveDataProvider
from app.market_data.schemas import (
    BINANCE_INTERVALS,
    OHLCVCandle,
    PriceUpdate,
    detect_asset_class,
    AssetClass,
)

logger = structlog.get_logger()


class StreamManager:
    """Manage upstream provider connections and fan out to frontend clients.

    For crypto: connects to Binance WebSocket stream for real-time kline data.
    For forex: polls Twelve Data REST API (WS sends ticks, not candles).
    """

    def __init__(self, connection_manager: ConnectionManager) -> None:
        self._conn_mgr = connection_manager
        self._upstream_tasks: dict[str, asyncio.Task] = {}
        self._running: bool = False
        self._twelve_data = TwelveDataProvider(api_key=settings.TWELVE_DATA_API_KEY)

    def start_stream(self, symbol: str, interval: str) -> None:
        """Start an upstream stream for the given symbol@interval.

        Detects asset class and launches the appropriate async task.
        """
        key = f"{symbol}@{interval}"

        if key in self._upstream_tasks and not self._upstream_tasks[key].done():
            logger.debug("stream_already_running", key=key)
            return

        asset_class = detect_asset_class(symbol)

        if asset_class == AssetClass.CRYPTO:
            task = asyncio.create_task(
                self._run_crypto_stream(symbol, interval),
                name=f"crypto-stream-{key}",
            )
        else:
            task = asyncio.create_task(
                self._run_forex_stream(symbol, interval),
                name=f"forex-stream-{key}",
            )

        self._upstream_tasks[key] = task
        logger.info("stream_started", key=key, asset_class=asset_class.value)

    def stop_stream(self, symbol: str, interval: str) -> None:
        """Stop the upstream stream for the given symbol@interval."""
        key = f"{symbol}@{interval}"
        task = self._upstream_tasks.pop(key, None)
        if task is not None and not task.done():
            task.cancel()
            logger.info("stream_stopped", key=key)

    async def _run_crypto_stream(self, symbol: str, interval: str) -> None:
        """Connect to Binance WebSocket and relay kline data to subscribers.

        Reconnects with exponential backoff (1s initial, 30s max, with jitter)
        on disconnect or error.
        """
        key = f"{symbol}@{interval}"
        binance_interval = BINANCE_INTERVALS.get(interval, interval.lower())
        ws_url = (
            f"{settings.BINANCE_WS_URL}/ws/"
            f"{symbol.lower()}@kline_{binance_interval}"
        )

        backoff = 1.0
        max_backoff = 30.0

        while self._running:
            try:
                logger.info("binance_ws_connecting", key=key, url=ws_url)
                async with websockets.connect(
                    ws_url,
                    ping_interval=20,
                    ping_timeout=10,
                ) as ws:
                    backoff = 1.0  # Reset on successful connection
                    logger.info("binance_ws_connected", key=key)

                    async for raw_msg in ws:
                        if not self._running:
                            break

                        try:
                            msg = json.loads(raw_msg)
                            k = msg.get("k")
                            if k is None:
                                continue

                            candle = OHLCVCandle(
                                time=int(k["t"]) // 1000,
                                open=float(k["o"]),
                                high=float(k["h"]),
                                low=float(k["l"]),
                                close=float(k["c"]),
                                volume=float(k["v"]),
                            )
                            update = PriceUpdate(
                                symbol=symbol,
                                interval=interval,
                                candle=candle,
                                is_closed=bool(k["x"]),
                            )

                            await self._fan_out(key, update)

                        except (KeyError, ValueError, TypeError) as e:
                            logger.warning(
                                "binance_ws_parse_error",
                                key=key,
                                error=str(e),
                            )

            except asyncio.CancelledError:
                logger.info("binance_ws_cancelled", key=key)
                return
            except Exception as e:
                if not self._running:
                    return
                jitter = random.uniform(0, backoff * 0.3)
                wait = min(backoff + jitter, max_backoff)
                logger.warning(
                    "binance_ws_disconnected",
                    key=key,
                    error=str(e),
                    reconnect_in=round(wait, 1),
                )
                await asyncio.sleep(wait)
                backoff = min(backoff * 2, max_backoff)

    async def _run_forex_stream(self, symbol: str, interval: str) -> None:
        """Poll Twelve Data REST for the latest forex candle and fan out changes.

        Twelve Data WS sends ticks, not candles. Tick-to-candle aggregation is
        complex and deferred. Instead, we poll the REST API every 30 seconds for
        the latest candle and fan out price updates when the candle changes.

        Rate limit budget: 800 calls/day free tier = ~33/hour. With 30s polling
        for one active forex pair, that is ~2880 calls/day. We limit to only
        the actively viewed pair.
        """
        key = f"{symbol}@{interval}"
        poll_interval = 30.0  # seconds
        last_candle_time: int | None = None
        last_candle: OHLCVCandle | None = None
        backoff = 1.0
        max_backoff = 120.0

        while self._running:
            try:
                candles = await self._twelve_data.fetch_historical(
                    symbol=symbol,
                    interval=interval,
                    limit=2,  # Only need the latest candle (and previous for comparison)
                )

                if candles:
                    latest = candles[-1]

                    # New candle timestamp appeared -- previous candle is closed
                    if (
                        last_candle is not None
                        and last_candle_time is not None
                        and latest.time != last_candle_time
                    ):
                        closed_update = PriceUpdate(
                            symbol=symbol,
                            interval=interval,
                            candle=last_candle,
                            is_closed=True,
                        )
                        await self._fan_out(key, closed_update)

                    # Send the current (possibly still forming) candle
                    if last_candle is None or latest != last_candle:
                        update = PriceUpdate(
                            symbol=symbol,
                            interval=interval,
                            candle=latest,
                            is_closed=False,
                        )
                        await self._fan_out(key, update)

                    last_candle_time = latest.time
                    last_candle = latest

                backoff = 1.0  # Reset on success

            except asyncio.CancelledError:
                logger.info("forex_poll_cancelled", key=key)
                return
            except Exception as e:
                if not self._running:
                    return
                jitter = random.uniform(0, backoff * 0.3)
                wait = min(backoff + jitter, max_backoff)
                logger.warning(
                    "forex_poll_error",
                    key=key,
                    error=str(e),
                    retry_in=round(wait, 1),
                )
                await asyncio.sleep(wait)
                backoff = min(backoff * 2, max_backoff)
                continue

            # Normal poll delay
            await asyncio.sleep(poll_interval)

    async def _fan_out(self, key: str, update: PriceUpdate) -> None:
        """Send a PriceUpdate to all subscribers of the given key.

        Removes dead clients that fail to receive the message.
        """
        subscribers = self._conn_mgr.get_subscribers(key)
        if not subscribers:
            return

        payload = update.model_dump()
        dead_clients = []

        for ws in subscribers:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_clients.append(ws)

        for ws in dead_clients:
            orphaned = self._conn_mgr.remove_dead_client(ws)
            for orphaned_key in orphaned:
                self.stop_stream(
                    *orphaned_key.split("@", 1)
                )

    async def shutdown(self) -> None:
        """Cleanly shut down all upstream streams."""
        self._running = False
        tasks = list(self._upstream_tasks.values())
        self._upstream_tasks.clear()

        for task in tasks:
            task.cancel()

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

        logger.info("stream_manager_shutdown", cancelled_tasks=len(tasks))
