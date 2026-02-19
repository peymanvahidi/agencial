import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WatchlistItemResponse(BaseModel):
    """Response schema for a single watchlist item."""

    symbol: str
    sort_order: int
    added_at: datetime

    model_config = {"from_attributes": True}


class WatchlistResponse(BaseModel):
    """Response schema for a watchlist with its items."""

    id: uuid.UUID
    name: str
    items: list[WatchlistItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class WatchlistCreate(BaseModel):
    """Request schema for creating a new watchlist."""

    name: str = Field(default="My Watchlist", min_length=1, max_length=100)


class AddSymbolRequest(BaseModel):
    """Request schema for adding a symbol to a watchlist."""

    symbol: str = Field(min_length=1, max_length=20)


class ReorderItem(BaseModel):
    """A single item's new sort order."""

    symbol: str
    sort_order: int


class ReorderItemsRequest(BaseModel):
    """Request schema for reordering items within a watchlist."""

    items: list[ReorderItem]
