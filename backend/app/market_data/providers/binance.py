"""Binance market data provider for crypto OHLCV candles."""

import httpx
import structlog

from app.config import settings
from app.market_data.providers.base import MarketDataProvider
from app.market_data.schemas import BINANCE_INTERVALS, OHLCVCandle

logger = structlog.get_logger()


class BinanceProvider(MarketDataProvider):
    """Fetch crypto market data from Binance REST API (no auth required)."""

    def __init__(self) -> None:
        self._base_url = settings.BINANCE_REST_URL

    async def fetch_historical(
        self,
        symbol: str,
        interval: str,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int = 500,
    ) -> list[OHLCVCandle]:
        """Fetch historical klines from Binance.

        Binance returns arrays: [open_time_ms, open, high, low, close, volume, ...].
        We convert open_time from ms to seconds.
        """
        binance_interval = BINANCE_INTERVALS.get(interval, interval)
        params: dict = {
            "symbol": symbol,
            "interval": binance_interval,
            "limit": min(limit, 1000),  # Binance max is 1000
        }
        if start_time is not None:
            params["startTime"] = start_time * 1000  # Convert s to ms
        if end_time is not None:
            params["endTime"] = end_time * 1000

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/api/v3/klines",
                params=params,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        candles: list[OHLCVCandle] = []
        for row in data:
            candles.append(
                OHLCVCandle(
                    time=int(row[0]) // 1000,  # open_time ms -> seconds
                    open=float(row[1]),
                    high=float(row[2]),
                    low=float(row[3]),
                    close=float(row[4]),
                    volume=float(row[5]),
                )
            )

        logger.info(
            "binance_fetch_historical",
            symbol=symbol,
            interval=interval,
            candles=len(candles),
        )
        return candles

    async def get_available_symbols(self) -> list[str]:
        """Fetch trading symbols from Binance exchangeInfo.

        Filters for TRADING status and USDT/BUSD/BTC quote assets.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/api/v3/exchangeInfo",
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        allowed_quotes = {"USDT", "BUSD", "BTC"}
        symbols: list[str] = []
        for sym_info in data.get("symbols", []):
            if (
                sym_info.get("status") == "TRADING"
                and sym_info.get("quoteAsset") in allowed_quotes
            ):
                symbols.append(sym_info["symbol"])

        symbols.sort()
        logger.info("binance_available_symbols", count=len(symbols))
        return symbols
