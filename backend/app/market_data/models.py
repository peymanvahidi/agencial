"""SQLAlchemy model for OHLCV candle cache."""

from sqlalchemy import Column, String, Float, BigInteger, UniqueConstraint, Index

from app.database import Base


class OHLCVCache(Base):
    """Cached OHLCV candle data from external market data providers."""

    __tablename__ = "ohlcv_cache"
    __table_args__ = (
        UniqueConstraint("symbol", "interval", "open_time", name="uq_ohlcv_candle"),
        Index("ix_ohlcv_lookup", "symbol", "interval", "open_time"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    symbol = Column(String(30), nullable=False)
    interval = Column(String(10), nullable=False)
    provider = Column(String(20), nullable=False)
    open_time = Column(BigInteger, nullable=False)  # Unix timestamp seconds
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False, default=0)
