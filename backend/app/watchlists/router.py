import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.watchlists.schemas import (
    AddSymbolRequest,
    ReorderItemsRequest,
    WatchlistCreate,
    WatchlistItemResponse,
    WatchlistResponse,
)
from app.watchlists.service import WatchlistService

router = APIRouter(prefix="/api/v1/watchlists", tags=["watchlists"])


def get_watchlist_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WatchlistService:
    """Dependency to create WatchlistService instance."""
    return WatchlistService(db)


@router.get("", response_model=list[WatchlistResponse])
async def list_watchlists(
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> list[WatchlistResponse]:
    """List all watchlists for the authenticated user.

    Creates a default watchlist with BTC, ETH, SOL, BNB if none exist.
    """
    watchlists = await service.list_watchlists(current_user["user_id"])
    return [
        WatchlistResponse(
            id=wl.id,
            name=wl.name,
            items=[
                WatchlistItemResponse(
                    symbol=item.symbol,
                    sort_order=item.sort_order,
                    added_at=item.added_at,
                )
                for item in wl.items
            ],
            created_at=wl.created_at,
        )
        for wl in watchlists
    ]


@router.post(
    "",
    response_model=WatchlistResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_watchlist(
    data: WatchlistCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> WatchlistResponse:
    """Create a new watchlist."""
    watchlist = await service.create_watchlist(
        current_user["user_id"], data.name
    )
    return WatchlistResponse(
        id=watchlist.id,
        name=watchlist.name,
        items=[
            WatchlistItemResponse(
                symbol=item.symbol,
                sort_order=item.sort_order,
                added_at=item.added_at,
            )
            for item in watchlist.items
        ],
        created_at=watchlist.created_at,
    )


@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watchlist(
    watchlist_id: uuid.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> Response:
    """Delete a watchlist owned by the authenticated user."""
    await service.delete_watchlist(current_user["user_id"], watchlist_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{watchlist_id}/items",
    response_model=WatchlistItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_symbol(
    watchlist_id: uuid.UUID,
    data: AddSymbolRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> WatchlistItemResponse:
    """Add a symbol to a watchlist."""
    item = await service.add_symbol(
        current_user["user_id"], watchlist_id, data.symbol
    )
    return WatchlistItemResponse(
        symbol=item.symbol,
        sort_order=item.sort_order,
        added_at=item.added_at,
    )


@router.delete(
    "/{watchlist_id}/items/{symbol}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_symbol(
    watchlist_id: uuid.UUID,
    symbol: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> Response:
    """Remove a symbol from a watchlist."""
    await service.remove_symbol(
        current_user["user_id"], watchlist_id, symbol
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{watchlist_id}/items/reorder",
    response_model=WatchlistResponse,
)
async def reorder_items(
    watchlist_id: uuid.UUID,
    data: ReorderItemsRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[WatchlistService, Depends(get_watchlist_service)],
) -> WatchlistResponse:
    """Reorder items within a watchlist."""
    watchlist = await service.reorder_items(
        current_user["user_id"],
        watchlist_id,
        [{"symbol": item.symbol, "sort_order": item.sort_order} for item in data.items],
    )
    return WatchlistResponse(
        id=watchlist.id,
        name=watchlist.name,
        items=[
            WatchlistItemResponse(
                symbol=item.symbol,
                sort_order=item.sort_order,
                added_at=item.added_at,
            )
            for item in watchlist.items
        ],
        created_at=watchlist.created_at,
    )
