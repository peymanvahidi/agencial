"""Pydantic schemas for market data: OHLCV candles, WS messages, timeframe mappings."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel


class AssetClass(str, Enum):
    CRYPTO = "crypto"
    FOREX = "forex"


def detect_asset_class(symbol: str) -> AssetClass:
    """Return FOREX if symbol contains '/' (e.g. EUR/USD), else CRYPTO."""
    return AssetClass.FOREX if "/" in symbol else AssetClass.CRYPTO


class OHLCVCandle(BaseModel):
    time: int  # Unix seconds
    open: float
    high: float
    low: float
    close: float
    volume: float


class HistoricalRequest(BaseModel):
    symbol: str
    interval: str
    start_time: int | None = None
    end_time: int | None = None
    limit: int = 500


class HistoricalResponse(BaseModel):
    symbol: str
    interval: str
    candles: list[OHLCVCandle]


class SubscribeMessage(BaseModel):
    action: Literal["subscribe", "unsubscribe"]
    symbol: str
    interval: str


class PriceUpdate(BaseModel):
    symbol: str
    interval: str
    candle: OHLCVCandle
    is_closed: bool


class ConnectionStatus(BaseModel):
    status: Literal["connected", "reconnecting", "error"]
    message: str | None = None


# Timeframe mapping: app format -> Binance format
BINANCE_INTERVALS: dict[str, str] = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w",
    "1M": "1M",
}

# Timeframe mapping: app format -> Twelve Data format
TWELVEDATA_INTERVALS: dict[str, str] = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1H": "1h",
    "4H": "4h",
    "1D": "1day",
    "1W": "1week",
    "1M": "1month",
}
