"""WebSocket endpoint + REST endpoints for market data.

WebSocket at /ws accepts subscribe/unsubscribe messages and relays real-time
price updates from upstream providers. REST endpoints serve historical candle
data and available symbol listings.
"""

from typing import Annotated

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.market_data.connection_manager import ConnectionManager
from app.market_data.schemas import (
    AssetClass,
    ConnectionStatus,
    HistoricalResponse,
    OHLCVCandle,
    SubscribeMessage,
)
from app.market_data.service import MarketDataService
from app.market_data.stream_manager import StreamManager

logger = structlog.get_logger()

router = APIRouter(prefix="/api/v1/market-data", tags=["market-data"])

# Module-level singletons persisted across requests
connection_manager = ConnectionManager()
stream_manager = StreamManager(connection_manager)


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    """WebSocket endpoint for real-time market data streaming.

    Protocol:
    1. Server sends ConnectionStatus with status="connected" on connect
    2. Client sends SubscribeMessage to subscribe/unsubscribe
    3. Server sends SubscriptionConfirm + streams PriceUpdate messages
    4. On disconnect, all client subscriptions are cleaned up
    """
    await connection_manager.connect(ws)

    try:
        # Send initial connection status
        status_msg = ConnectionStatus(
            status="connected",
            message="Connected to market data stream",
        )
        await ws.send_json(status_msg.model_dump())

        while True:
            data = await ws.receive_json()

            try:
                msg = SubscribeMessage(**data)
            except Exception as e:
                logger.warning("invalid_ws_message", error=str(e), data=data)
                await ws.send_json(
                    {"error": "Invalid message format", "detail": str(e)}
                )
                continue

            if msg.action == "subscribe":
                is_first = connection_manager.subscribe(
                    ws, msg.symbol, msg.interval
                )
                if is_first:
                    stream_manager.start_stream(msg.symbol, msg.interval)

                await ws.send_json(
                    {
                        "type": "subscribed",
                        "symbol": msg.symbol,
                        "interval": msg.interval,
                    }
                )

            elif msg.action == "unsubscribe":
                is_last = connection_manager.unsubscribe(
                    ws, msg.symbol, msg.interval
                )
                if is_last:
                    stream_manager.stop_stream(msg.symbol, msg.interval)

                await ws.send_json(
                    {
                        "type": "unsubscribed",
                        "symbol": msg.symbol,
                        "interval": msg.interval,
                    }
                )

    except WebSocketDisconnect:
        orphaned_keys = connection_manager.disconnect(ws)
        for key in orphaned_keys:
            parts = key.split("@", 1)
            if len(parts) == 2:
                stream_manager.stop_stream(parts[0], parts[1])
        logger.info("ws_client_disconnected_cleanly")

    except Exception as e:
        logger.error("ws_client_error", error=str(e))
        orphaned_keys = connection_manager.disconnect(ws)
        for key in orphaned_keys:
            parts = key.split("@", 1)
            if len(parts) == 2:
                stream_manager.stop_stream(parts[0], parts[1])


@router.get("/history", response_model=HistoricalResponse)
async def get_history(
    symbol: Annotated[str, Query(description="Trading symbol (e.g. BTCUSDT, EUR/USD)")],
    interval: Annotated[str, Query(description="Timeframe interval (e.g. 1m, 1H, 1D)")],
    db: Annotated[AsyncSession, Depends(get_db)],
    start_time: Annotated[int | None, Query(description="Start time Unix seconds")] = None,
    end_time: Annotated[int | None, Query(description="End time Unix seconds")] = None,
    limit: Annotated[int, Query(ge=1, le=5000, description="Max candles to return")] = 500,
) -> HistoricalResponse:
    """Fetch historical OHLCV candles for a symbol.

    Uses cache-first strategy: checks DB cache, fetches from provider on miss.
    """
    service = MarketDataService(db)
    try:
        candles: list[OHLCVCandle] = await service.get_historical_candles(
            symbol=symbol,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
        )
    except httpx.HTTPStatusError as e:
        logger.error(
            "provider_http_error",
            symbol=symbol,
            status=e.response.status_code,
            url=str(e.request.url),
        )
        raise HTTPException(
            status_code=502,
            detail=f"Market data provider returned {e.response.status_code}",
        )
    except httpx.RequestError as e:
        logger.error("provider_connection_error", symbol=symbol, error=str(e))
        raise HTTPException(
            status_code=502,
            detail="Could not reach market data provider",
        )
    return HistoricalResponse(
        symbol=symbol,
        interval=interval,
        candles=candles,
    )


@router.get("/symbols", response_model=list[str])
async def get_symbols(
    asset_class: Annotated[str, Query(description="Asset class: 'crypto' or 'forex'")],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[str]:
    """Return available trading symbols for the given asset class."""
    ac = AssetClass(asset_class)
    service = MarketDataService(db)
    return await service.get_available_symbols(ac)
