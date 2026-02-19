import uuid

import structlog
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.exceptions import ConflictError, NotFoundError
from app.watchlists.models import Watchlist, WatchlistItem

logger = structlog.get_logger()

# Default symbols pre-populated for new users
DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]


class WatchlistService:
    """Service for watchlist CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_watchlist_owned_by(
        self, watchlist_id: uuid.UUID, user_id: str
    ) -> Watchlist:
        """Get a watchlist by ID, verifying ownership. Raises 404 if not found or not owned."""
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(
                Watchlist.id == watchlist_id,
                Watchlist.user_id == uuid.UUID(user_id),
            )
        )
        watchlist = result.scalar_one_or_none()
        if not watchlist:
            raise NotFoundError("Watchlist not found")
        return watchlist

    async def get_or_create_default(self, user_id: str) -> list[Watchlist]:
        """Get user's watchlists. If none exist, create a default with popular symbols."""
        uid = uuid.UUID(user_id)
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.user_id == uid)
            .order_by(Watchlist.created_at)
        )
        watchlists = list(result.scalars().all())

        if watchlists:
            return watchlists

        logger.info("creating_default_watchlist", user_id=user_id)
        watchlist = Watchlist(user_id=uid, name="My Watchlist")
        self.db.add(watchlist)
        await self.db.flush()

        for i, symbol in enumerate(DEFAULT_SYMBOLS):
            item = WatchlistItem(
                watchlist_id=watchlist.id,
                symbol=symbol,
                sort_order=i,
            )
            self.db.add(item)

        await self.db.flush()

        # Re-fetch with items loaded
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.id == watchlist.id)
        )
        watchlist = result.scalar_one()
        return [watchlist]

    async def list_watchlists(self, user_id: str) -> list[Watchlist]:
        """Get all watchlists for user with items eager-loaded.

        If no watchlists exist, creates a default one first.
        """
        uid = uuid.UUID(user_id)
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.user_id == uid)
            .order_by(Watchlist.created_at)
        )
        watchlists = list(result.scalars().all())

        if not watchlists:
            watchlists = await self.get_or_create_default(user_id)

        return watchlists

    async def create_watchlist(self, user_id: str, name: str) -> Watchlist:
        """Create a new empty watchlist for the user."""
        watchlist = Watchlist(user_id=uuid.UUID(user_id), name=name)
        self.db.add(watchlist)
        await self.db.flush()

        # Re-fetch with items relationship loaded (empty list)
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.id == watchlist.id)
        )
        return result.scalar_one()

    async def delete_watchlist(
        self, user_id: str, watchlist_id: uuid.UUID
    ) -> None:
        """Delete a watchlist owned by the user. Raises 404 if not found or not owned."""
        watchlist = await self._get_watchlist_owned_by(watchlist_id, user_id)
        await self.db.delete(watchlist)
        await self.db.flush()

    async def add_symbol(
        self, user_id: str, watchlist_id: uuid.UUID, symbol: str
    ) -> WatchlistItem:
        """Add a symbol to a watchlist. Auto-assigns sort_order.

        Raises 404 if watchlist not found or not owned.
        Raises 409 if symbol already exists in the watchlist.
        """
        # Verify ownership first
        await self._get_watchlist_owned_by(watchlist_id, user_id)

        # Check for duplicate via direct DB query (more reliable than in-memory)
        existing = await self.db.execute(
            select(WatchlistItem).where(
                WatchlistItem.watchlist_id == watchlist_id,
                WatchlistItem.symbol == symbol,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                f"Symbol '{symbol}' already exists in this watchlist"
            )

        # Calculate next sort_order
        max_order_result = await self.db.execute(
            select(sa_func.coalesce(sa_func.max(WatchlistItem.sort_order), -1))
            .where(WatchlistItem.watchlist_id == watchlist_id)
        )
        max_order = max_order_result.scalar()
        next_order = (max_order or 0) + 1

        item = WatchlistItem(
            watchlist_id=watchlist_id,
            symbol=symbol,
            sort_order=next_order,
        )
        self.db.add(item)
        await self.db.flush()
        return item

    async def remove_symbol(
        self, user_id: str, watchlist_id: uuid.UUID, symbol: str
    ) -> None:
        """Remove a symbol from a watchlist.

        Raises 404 if watchlist not found/not owned or symbol not in watchlist.
        """
        # Verify ownership
        await self._get_watchlist_owned_by(watchlist_id, user_id)

        # Find the item via direct DB query (avoids stale relationship cache)
        result = await self.db.execute(
            select(WatchlistItem).where(
                WatchlistItem.watchlist_id == watchlist_id,
                WatchlistItem.symbol == symbol,
            )
        )
        target_item = result.scalar_one_or_none()

        if not target_item:
            raise NotFoundError(
                f"Symbol '{symbol}' not found in this watchlist"
            )

        await self.db.delete(target_item)
        await self.db.flush()

    async def reorder_items(
        self,
        user_id: str,
        watchlist_id: uuid.UUID,
        items: list[dict],
    ) -> Watchlist:
        """Update sort_order for items in a watchlist.

        Raises 404 if watchlist not found or not owned.
        """
        watchlist = await self._get_watchlist_owned_by(watchlist_id, user_id)

        # Build a lookup of symbol -> new sort_order
        order_map = {item["symbol"]: item["sort_order"] for item in items}

        for wl_item in watchlist.items:
            if wl_item.symbol in order_map:
                wl_item.sort_order = order_map[wl_item.symbol]

        await self.db.flush()

        # Re-fetch with updated ordering
        result = await self.db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.id == watchlist_id)
        )
        return result.scalar_one()
