---
phase: 03-market-data-service
plan: 04
subsystem: ui
tags: [real-time-data, websocket, infinite-scroll, skeleton-candles, live-prices, forex, chart-integration]

# Dependency graph
requires:
  - phase: 03-market-data-service/02
    provides: WebSocket hook, market data store, REST API helpers, market data types
  - phase: 02-charting-core
    provides: chart-container, series-manager, chart-store, watchlist components
provides:
  - Real-time chart data loading from backend API with WebSocket live updates
  - Infinite scroll with skeleton candle placeholders during history fetch
  - Connection status banner overlay on chart
  - Live watchlist prices from WebSocket stream
  - Combined crypto + forex symbol search
  - DataSource toggle for mock/live fallback
affects: [04-backtesting-engine, 06-ai-co-pilot]

# Tech tracking
tech-stack:
  added: []
  patterns: [skeleton-candle-loading, series-update-animation, infinite-scroll-with-placeholders, live-mock-fallback]

key-files:
  created:
    - frontend/src/components/chart/connection-banner.tsx
  modified:
    - frontend/src/components/chart/series-manager.ts
    - frontend/src/components/chart/chart-container.tsx
    - frontend/src/stores/chart-store.ts
    - frontend/src/components/watchlist/watchlist-item.tsx
    - frontend/src/components/watchlist/symbol-search.tsx

key-decisions:
  - "series.update() for real-time candle animation -- single-bar update without full setData rebuild"
  - "Skeleton candles use flat OHLC (lastKnownPrice) with _skeleton flag for identification and replacement"
  - "DataSource toggle (mock/live) in chart store for graceful backend fallback"
  - "Live prices in watchlist via useMarketDataStore selector with mock data fallback"
  - "Combined symbol search merges CRYPTO_SYMBOLS + FOREX_SYMBOLS into single searchable list"

patterns-established:
  - "Skeleton loading: generate placeholders immediately, replace with real data on fetch completion"
  - "Visible range preservation: save/restore chart timeScale range across data operations"
  - "Live-mock fallback: try fetchHistoricalCandles, catch to getMockDataForSymbol"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 03 Plan 04: UI Data Integration Summary

**Chart wired to live market data with WebSocket streaming, infinite scroll with skeleton candle placeholders, connection status banner, live watchlist prices, and combined crypto/forex symbol search**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T17:48:42Z
- **Completed:** 2026-02-22T17:54:55Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Extended series-manager with 4 new functions: updateCandle (real-time single-bar animation), prependHistory (infinite scroll data prepend), generateSkeletonCandles (loading placeholders), and replaceSkeletonWithReal (swap placeholders with fetched data)
- Created ConnectionBanner component with 3 visual states (connecting/amber, reconnecting/orange, disconnected/red) positioned as absolute overlay at top of chart area
- Added dataSource (mock/live) toggle to chart store enabling graceful fallback when backend is unreachable
- Rewrote ChartContainer data loading to: fetch initial 500 candles from backend API, subscribe to WebSocket for live updates, fall back to mock data on fetch failure, preserve visible time range on timeframe switch, and implement infinite scroll with skeleton candle placeholders
- Updated WatchlistItem to display live prices from market data store with intra-candle change percentage, falling back to mock data when no live data available
- Expanded SymbolSearch to search across combined crypto (10) + forex (25) = 35 symbols in unified dropdown
- Updated formatSymbol to handle both crypto (BTCUSDT -> BTC/USDT) and forex (EUR/USD -> EUR/USD) formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Add series-manager real-time update functions, connection banner, and chart store** - `1819628` (feat)
2. **Task 2: Wire chart-container to real data with infinite scroll and live updates** - `6b0de4f` (feat)
3. **Task 3: Update watchlist and symbol search for live prices and multi-asset support** - `9476e46` (feat)

## Files Created/Modified

- `frontend/src/components/chart/series-manager.ts` - Added updateCandle, prependHistory, generateSkeletonCandles, replaceSkeletonWithReal, SkeletonCandle type
- `frontend/src/components/chart/connection-banner.tsx` - Connection status banner with colored states (NEW)
- `frontend/src/stores/chart-store.ts` - Added DataSource type and dataSource/setDataSource state
- `frontend/src/components/chart/chart-container.tsx` - Complete data loading rewrite with live WS, infinite scroll, skeleton candles, connection banner, mock fallback
- `frontend/src/components/watchlist/watchlist-item.tsx` - Live prices from market data store with mock fallback, forex-aware formatSymbol
- `frontend/src/components/watchlist/symbol-search.tsx` - Combined crypto + forex symbol search (ALL_SYMBOLS)

## Decisions Made

- **series.update() for animation:** Using lightweight-charts series.update() for real-time candle updates instead of full setData() rebuilds -- provides smooth OHLC animation on each tick
- **Skeleton candle strategy:** Flat candles (OHLC = lastKnownPrice, volume = 0) with `_skeleton: true` flag render as thin horizontal lines that are visually distinct from real data, immediately filling the scroll space while history loads
- **DataSource toggle:** Chart store holds mock/live preference; when live fetch fails, automatically falls back to mock data and logs a warning rather than showing an empty chart
- **Intra-candle change in watchlist:** When live data is available, WatchlistItem uses close vs open of the current candle for change percentage -- the best approximation available from a single streaming candle update
- **Combined symbol search:** Single searchable list of 35 symbols (10 crypto + 25 forex) rather than separate tabs or categories -- simpler UX for the current symbol count

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

- Backend WebSocket endpoint and REST API (plan 03-03) must be running for live data to flow
- Without backend, the chart gracefully falls back to mock data -- no user action needed

## Next Phase Readiness

- All frontend market data integration is complete
- Chart renders live data when backend is available, mock data when not
- Watchlist shows live prices when WebSocket streams are active
- Forex symbols are searchable and selectable in the watchlist
- Phase 03 frontend layer is ready for end-to-end testing once backend relay (plan 03-03) is complete

## Self-Check: PASSED

All files verified present. All commit hashes confirmed in git log.

---
*Phase: 03-market-data-service*
*Completed: 2026-02-22*
