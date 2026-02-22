"""Market data service: cache-first historical data fetching."""

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
        2. If enough cached rows exist, return them
        3. Otherwise fetch from provider, cache the result, and return
        """
        # Step 1: Try cache
        query = (
            select(OHLCVCache)
            .where(
                OHLCVCache.symbol == symbol,
                OHLCVCache.interval == interval,
            )
            .order_by(OHLCVCache.open_time.asc())
        )

        if start_time is not None:
            query = query.where(OHLCVCache.open_time >= start_time)
        if end_time is not None:
            query = query.where(OHLCVCache.open_time <= end_time)

        query = query.limit(limit)

        result = await self.db.execute(query)
        cached_rows = result.scalars().all()

        # Step 2: Return cached data if we have enough
        if cached_rows and len(cached_rows) >= limit:
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
        stmt = stmt.on_conflict_do_nothing(
            constraint="uq_ohlcv_candle",
        )

        await self.db.execute(stmt)
        await self.db.flush()

        logger.info(
            "candles_cached",
            symbol=symbol,
            interval=interval,
            count=len(candles),
        )
