---
phase: 03-market-data-service
plan: 03
subsystem: market-data
tags: [websocket, real-time, streaming, REST, relay, fan-out]
dependency_graph:
  requires: [03-01]
  provides: [backend-ws-relay, market-data-rest-api]
  affects: [03-04, frontend-chart-integration]
tech_stack:
  added: [websockets (Binance upstream)]
  patterns: [WebSocket relay, fan-out pub-sub, exponential backoff with jitter, REST polling for forex, module-level singletons]
key_files:
  created:
    - backend/app/market_data/connection_manager.py
    - backend/app/market_data/stream_manager.py
    - backend/app/market_data/router.py
  modified:
    - backend/app/main.py
decisions:
  - Module-level singletons for ConnectionManager and StreamManager in router module -- persist across requests
  - REST polling (30s) for forex instead of Twelve Data WS ticks -- avoids complex tick-to-candle aggregation
  - Exponential backoff (1s initial, 30s max crypto, 120s max forex) with jitter for upstream reconnection
  - Fan-out removes dead clients inline and stops orphaned upstream streams
  - Lifespan sets _running flag on startup, calls shutdown() on app teardown
metrics:
  duration: 3min
  completed: 2026-02-22
  tasks: 2/2
  files: 4
requirements: [DATA-01, DATA-02, DATA-03, DATA-04]
---

# Phase 03 Plan 03: Backend WebSocket Relay + REST Endpoints Summary

Backend WebSocket relay connecting Binance WS (crypto) and Twelve Data REST polling (forex) to frontend clients via fan-out pub-sub, plus REST endpoints for historical candles and symbol listings.

## What Was Built

### ConnectionManager (`connection_manager.py`)
Tracks frontend WebSocket connections with bidirectional maps for efficient subscription management:
- `_connections`: WebSocket -> set of subscribed keys ("symbol@interval")
- `_subscriptions`: key -> set of WebSocket connections (reverse lookup)
- `subscribe()` / `unsubscribe()` return boolean indicating first/last subscriber status
- `disconnect()` cleans up all subscriptions and returns orphaned keys
- `remove_dead_client()` handles inline cleanup during fan-out failures

### StreamManager (`stream_manager.py`)
Manages upstream provider connections and fans out price updates:
- **Crypto**: Connects to `wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}` via `websockets` library. Parses kline messages, builds PriceUpdate with OHLCV + is_closed flag, fans out to all subscribers.
- **Forex**: Polls TwelveDataProvider.fetch_historical() every 30 seconds. Compares with last known candle, detects new candle timestamps (marks previous as closed), sends updates on price changes.
- Exponential backoff with jitter on disconnect/error (crypto: 1-30s, forex: 1-120s)
- Clean shutdown cancels all upstream tasks

### Router (`router.py`)
- **WebSocket** `GET /api/v1/market-data/ws`: Accepts connections, processes subscribe/unsubscribe messages, triggers stream start/stop, handles disconnect cleanup
- **REST** `GET /api/v1/market-data/history`: Cache-first historical candles via MarketDataService
- **REST** `GET /api/v1/market-data/symbols`: Available symbols by asset class (crypto/forex)

### App Integration (`main.py`)
- Market data router registered via `app.include_router(market_data_router)`
- Lifespan startup sets `stream_manager._running = True`
- Lifespan shutdown calls `stream_manager.shutdown()` for clean teardown

## Commits

| Task | Commit  | Description                                            |
|------|---------|--------------------------------------------------------|
| 1    | f93130f | Stream manager + connection manager for WS relay       |
| 2    | a6a0adf | WebSocket + REST endpoints, router registered in app   |

## Verification Results

- `ConnectionManager` subscribe/unsubscribe returns correct first/last subscriber booleans (unit tested)
- `StreamManager` and `ConnectionManager` import without errors
- Router prefix confirmed as `/api/v1/market-data`
- All 3 endpoints registered in FastAPI app: `/api/v1/market-data/ws`, `/api/v1/market-data/history`, `/api/v1/market-data/symbols`
- `websockets` 16.0 already installed in backend venv

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Module-level singletons**: ConnectionManager and StreamManager instantiated at module level in `router.py` so they persist across requests and share state.
2. **REST polling for forex**: 30-second polling interval with TwelveDataProvider.fetch_historical() instead of WebSocket tick aggregation. Rate limit budget allows ~2880 calls/day for one active pair.
3. **Dead client removal during fan-out**: When send_json fails, client is removed inline and orphaned upstream streams are stopped immediately.
4. **Lifespan integration**: Stream manager _running flag set in startup, shutdown() called in teardown for graceful cleanup.

## Self-Check: PASSED

- FOUND: backend/app/market_data/connection_manager.py
- FOUND: backend/app/market_data/stream_manager.py
- FOUND: backend/app/market_data/router.py
- FOUND: backend/app/main.py (modified)
- FOUND: commit f93130f (Task 1)
- FOUND: commit a6a0adf (Task 2)
