"""Twelve Data market data provider for forex OHLCV candles."""

from datetime import datetime, timezone

import httpx
import structlog

from app.config import settings
from app.market_data.providers.base import MarketDataProvider
from app.market_data.schemas import TWELVEDATA_INTERVALS, OHLCVCandle

logger = structlog.get_logger()

# Major and minor forex pairs supported
FOREX_PAIRS: list[str] = [
    # Majors
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "USD/CHF",
    "AUD/USD",
    "NZD/USD",
    "USD/CAD",
    # Minors
    "EUR/GBP",
    "EUR/JPY",
    "GBP/JPY",
    "AUD/JPY",
    "EUR/AUD",
    "GBP/AUD",
    "EUR/CAD",
    "GBP/CAD",
    "AUD/NZD",
    "EUR/NZD",
    "CHF/JPY",
    "CAD/JPY",
    "NZD/JPY",
    "EUR/CHF",
    "GBP/CHF",
    "AUD/CAD",
    "NZD/CAD",
    "GBP/NZD",
]


def _unix_to_datestr(ts: int, daily_or_above: bool = False) -> str:
    """Convert Unix seconds to a date string for Twelve Data API."""
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    if daily_or_above:
        return dt.strftime("%Y-%m-%d")
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _datestr_to_unix(datestr: str) -> int:
    """Convert Twelve Data datetime string to Unix seconds."""
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(datestr, fmt).replace(tzinfo=timezone.utc)
            return int(dt.timestamp())
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: {datestr}")


class TwelveDataProvider(MarketDataProvider):
    """Fetch forex market data from Twelve Data REST API."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or settings.TWELVE_DATA_API_KEY
        self._base_url = settings.TWELVE_DATA_REST_URL

    async def fetch_historical(
        self,
        symbol: str,
        interval: str,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int = 500,
    ) -> list[OHLCVCandle]:
        """Fetch historical time series from Twelve Data.

        Response values array contains objects with datetime, open, high, low,
        close, and optionally volume. For forex, volume may be absent (default 0).
        """
        td_interval = TWELVEDATA_INTERVALS.get(interval, interval)
        daily_or_above = td_interval in ("1day", "1week", "1month")

        params: dict = {
            "symbol": symbol,
            "interval": td_interval,
            "outputsize": min(limit, 5000),
            "apikey": self._api_key,
            "format": "JSON",
            "order": "asc",
        }
        if start_time is not None:
            params["start_date"] = _unix_to_datestr(start_time, daily_or_above)
        if end_time is not None:
            params["end_date"] = _unix_to_datestr(end_time, daily_or_above)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self._base_url}/time_series",
                params=params,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

        # Check for API-level errors
        if data.get("status") == "error":
            error_msg = data.get("message", "Unknown Twelve Data error")
            logger.error("twelve_data_api_error", message=error_msg, symbol=symbol)
            raise RuntimeError(f"Twelve Data API error: {error_msg}")

        values = data.get("values", [])
        candles: list[OHLCVCandle] = []
        for row in values:
            candles.append(
                OHLCVCandle(
                    time=_datestr_to_unix(row["datetime"]),
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=float(row.get("volume", 0)),
                )
            )

        logger.info(
            "twelve_data_fetch_historical",
            symbol=symbol,
            interval=interval,
            candles=len(candles),
        )
        return candles

    async def get_available_symbols(self) -> list[str]:
        """Return hardcoded list of supported major and minor forex pairs."""
        return FOREX_PAIRS.copy()
