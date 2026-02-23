"""Market data service: cache-first historical data fetching."""

import time as _time

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.config import settings
from app.market_data.models import OHLCVCache
from app.market_data.providers.base import MarketDataProvider
from app.market_data.providers.binance import BinanceProvider
from app.market_data.providers.twelve_data import TwelveDataProvider
from app.market_data.schemas import AssetClass, OHLCVCandle, detect_asset_class

logger = structlog.get_logger()

# Interval durations in seconds, used for cache staleness checks.
_INTERVAL_SECONDS: dict[str, int] = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1H": 3600,
    "4H": 14400,
    "1D": 86400,
    "1W": 604800,
    "1M": 2592000,
}


class MarketDataService:
    """Cache-first service for fetching and serving OHLCV candle data.

    Checks the PostgreSQL ohlcv_cache table first. On cache miss, fetches
    from the appropriate external provider and caches the result.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._binance = BinanceProvider()
        self._twelve_data = TwelveDataProvider(api_key=settings.TWELVE_DATA_API_KEY)

    def _get_provider(self, symbol: str) -> tuple[MarketDataProvider, str]:
        """Return (provider, provider_name) based on asset class."""
        asset_class = detect_asset_class(symbol)
        if asset_class == AssetClass.FOREX:
            return self._twelve_data, "twelvedata"
        return self._binance, "binance"

    async def get_historical_candles(
        self,
        symbol: str,
        interval: str,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int = 500,
    ) -> list[OHLCVCandle]:
        """Fetch historical candles with cache-first strategy.

        1. Query ohlcv_cache for matching symbol + interval in time range
        2. If enough cached rows exist AND they are fresh enough, return them
        3. Otherwise fetch from provider, cache the result, and return

        When no time range is provided (initial chart load), the query fetches
        the *newest* cached rows (ORDER BY DESC) to avoid returning stale data
        from the bottom of the cache.
        """
        # Determine whether this is a "latest data" request (no time bounds).
        is_latest_request = start_time is None and end_time is None

        # Step 1: Try cache
        query = select(OHLCVCache).where(
            OHLCVCache.symbol == symbol,
            OHLCVCache.interval == interval,
        )

        if start_time is not None:
            query = query.where(OHLCVCache.open_time >= start_time)
        if end_time is not None:
            query = query.where(OHLCVCache.open_time <= end_time)

        if is_latest_request:
            # Fetch the newest rows first so LIMIT grabs the tail, not the head.
            query = query.order_by(OHLCVCache.open_time.desc()).limit(limit)
        else:
            query = query.order_by(OHLCVCache.open_time.asc()).limit(limit)

        result = await self.db.execute(query)
        cached_rows = list(result.scalars().all())

        # When fetched DESC we need to reverse back to chronological order.
        if is_latest_request and cached_rows:
            cached_rows.reverse()

        # Step 2: Check cache validity
        cache_is_valid = False
        if cached_rows and len(cached_rows) >= limit:
            if is_latest_request:
                # For "latest" requests, verify the newest cached candle is
                # reasonably recent (within 2 interval periods of now).
                interval_sec = _INTERVAL_SECONDS.get(interval, 60)
                newest_time = cached_rows[-1].open_time
                staleness = int(_time.time()) - newest_time
                if staleness <= interval_sec * 2:
                    cache_is_valid = True
                else:
                    logger.info(
                        "cache_stale",
                        symbol=symbol,
                        interval=interval,
                        newest_time=newest_time,
                        staleness_sec=staleness,
                    )
            else:
                # For ranged requests (infinite scroll), row count is sufficient.
                cache_is_valid = True

        if cache_is_valid:
            logger.info(
                "cache_hit",
                symbol=symbol,
                interval=interval,
                count=len(cached_rows),
            )
            return [
                OHLCVCandle(
                    time=row.open_time,
                    open=row.open,
                    high=row.high,
                    low=row.low,
                    close=row.close,
                    volume=row.volume,
                )
                for row in cached_rows
            ]

        # Step 3: Fetch from provider
        provider, provider_name = self._get_provider(symbol)
        logger.info(
            "cache_miss_fetching",
            symbol=symbol,
            interval=interval,
            provider=provider_name,
        )

        candles = await provider.fetch_historical(
            symbol=symbol,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )

        # Step 4: Cache the fetched candles
        if candles:
            await self._cache_candles(candles, symbol, interval, provider_name)

        return candles

    async def get_available_symbols(self, asset_class: AssetClass) -> list[str]:
        """Delegate to the appropriate provider for symbol listings."""
        if asset_class == AssetClass.FOREX:
            return await self._twelve_data.get_available_symbols()
        return await self._binance.get_available_symbols()

    async def _cache_candles(
        self,
        candles: list[OHLCVCandle],
        symbol: str,
        interval: str,
        provider: str,
    ) -> None:
        """Bulk insert candles into ohlcv_cache, skipping duplicates."""
        if not candles:
            return

        values = [
            {
                "symbol": symbol,
                "interval": interval,
                "provider": provider,
                "open_time": c.time,
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
            }
            for c in candles
        ]

        stmt = pg_insert(OHLCVCache).values(values)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_ohlcv_candle",
            set_={
                "open": stmt.excluded.open,
                "high": stmt.excluded.high,
                "low": stmt.excluded.low,
                "close": stmt.excluded.close,
                "volume": stmt.excluded.volume,
            },
        )

        await self.db.execute(stmt)
        await self.db.flush()

        logger.info(
            "candles_cached",
            symbol=symbol,
            interval=interval,
            count=len(candles),
        )
