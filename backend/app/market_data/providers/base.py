"""Abstract base class for market data providers."""

from abc import ABC, abstractmethod

from app.market_data.schemas import OHLCVCandle


class MarketDataProvider(ABC):
    @abstractmethod
    async def fetch_historical(
        self,
        symbol: str,
        interval: str,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int = 500,
    ) -> list[OHLCVCandle]:
        """Fetch historical OHLCV candles from the provider."""
        ...

    @abstractmethod
    async def get_available_symbols(self) -> list[str]:
        """Return list of available trading symbols."""
        ...
