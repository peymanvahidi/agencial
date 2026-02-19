---
phase: 02-charting-core
plan: 05
subsystem: ui
tags: [zustand, watchlist, symbol-search, sidebar, react, optimistic-update]

# Dependency graph
requires:
  - phase: 02-charting-core
    plan: 01
    provides: "CRYPTO_SYMBOLS type definitions, mock data generator (getMockDataForSymbol), chart-store (useChartStore with setSymbol)"
  - phase: 02-charting-core
    plan: 02
    provides: "ChartContainer rendering on dashboard, chart-store activeSymbol for highlight sync"
  - phase: 02-charting-core
    plan: 04
    provides: "Watchlist backend API (6 endpoints under /api/v1/watchlists), WatchlistResponse schema"
provides:
  - "useWatchlistStore Zustand store with backend API sync, optimistic updates, and rollback"
  - "WatchlistPanel container component for left sidebar"
  - "WatchlistItem row component with symbol, price, change %, hover-remove"
  - "SymbolSearch dropdown with CRYPTO_SYMBOLS filtering, add-to-watchlist, and chart switching"
  - "Left sidebar integration with nav items above, watchlist below, collapse-aware"
affects: [03-realtime, frontend-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-api-sync-with-optimistic-rollback, derived-state-via-getActiveItems, mock-price-from-deterministic-data]

key-files:
  created:
    - frontend/src/stores/watchlist-store.ts
    - frontend/src/components/watchlist/watchlist-panel.tsx
    - frontend/src/components/watchlist/watchlist-item.tsx
    - frontend/src/components/watchlist/symbol-search.tsx
  modified:
    - frontend/src/components/layout/left-sidebar.tsx

key-decisions:
  - "Zustand store without persist middleware -- watchlist data lives on backend, not localStorage"
  - "Optimistic updates with rollback for addSymbol/removeSymbol to keep UI responsive"
  - "Mock price and 24h change derived from getMockDataForSymbol(symbol, '1D') last two candles"
  - "Symbol formatting: split BTCUSDT into BTC/USDT at the USDT suffix boundary"

patterns-established:
  - "API-synced Zustand store: no persist, fetchWatchlists on mount, optimistic add/remove with rollback"
  - "Derived state via method: getActiveItems() filters active watchlist items from state"
  - "Sidebar layout composition: nav items (static height) + separator + WatchlistPanel (flex-1 overflow) + collapse toggle"

requirements-completed: [CHART-09, CHART-10]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 02 Plan 05: Watchlist Frontend Summary

**Watchlist UI with Zustand API-synced store, symbol search dropdown, price/change display from mock data, and left sidebar integration with click-to-switch-chart**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T08:27:08Z
- **Completed:** 2026-02-19T08:30:25Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built Zustand watchlist-store syncing with backend API (GET/POST/DELETE), using optimistic updates with rollback on error
- Created WatchlistPanel container with header, SymbolSearch, separator, scrollable items list, loading/empty/error states
- Created WatchlistItem displaying formatted symbol pair (BTC/USDT), mock last price, 24h change %, hover-reveal remove button
- Created SymbolSearch with CRYPTO_SYMBOLS filtering, dropdown results showing added/not-added indicator, click to add and switch chart
- Integrated WatchlistPanel into left sidebar below navigation items, hidden when sidebar collapsed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create watchlist store and watchlist components** - `b2b8f0d` (feat)
2. **Task 2: Integrate watchlist panel into left sidebar and wire symbol switching** - `5dbdc08` (feat)

## Files Created/Modified
- `frontend/src/stores/watchlist-store.ts` - Zustand store with fetchWatchlists, addSymbol (optimistic), removeSymbol (optimistic), getActiveItems derived state
- `frontend/src/components/watchlist/watchlist-panel.tsx` - Container rendering SymbolSearch + WatchlistItem list, calls fetchWatchlists on mount
- `frontend/src/components/watchlist/watchlist-item.tsx` - Row component with formatted symbol, mock price (formatPrice), 24h change %, hover X button
- `frontend/src/components/watchlist/symbol-search.tsx` - Search input filtering CRYPTO_SYMBOLS, dropdown with add/check icons, adds to watchlist and switches chart
- `frontend/src/components/layout/left-sidebar.tsx` - Updated: nav at top (Chart enabled), separator, WatchlistPanel (flex-1), collapse toggle

## Decisions Made
- Used Zustand without persist middleware since watchlist data lives on the backend API -- no need for localStorage duplication
- Optimistic updates with rollback pattern for add/remove operations to maintain responsive UI even with network latency
- Derived mock prices from getMockDataForSymbol using the last two candles of the 1D timeframe data -- provides deterministic but realistic-looking prices
- Symbol display formatting splits at USDT suffix (e.g., BTCUSDT becomes BTC/USDT) for readability
- Enabled Chart nav item by changing href from "#" to "/" and removing disabled flag since the chart is now rendered on the dashboard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Watchlist frontend complete -- connects backend API (Plan 04) to chart (Plan 02) via symbol switching
- When real-time data replaces mock data (Phase 03), WatchlistItem price/change will need to read from a live data source instead of getMockDataForSymbol
- Left sidebar layout established: nav + watchlist + collapse toggle -- future sidebar additions slot into this structure

---
*Phase: 02-charting-core*
*Completed: 2026-02-19*

## Self-Check: PASSED

- All 4 created files verified on disk (watchlist-store.ts, watchlist-panel.tsx, watchlist-item.tsx, symbol-search.tsx)
- Modified file verified on disk (left-sidebar.tsx)
- Task 1 commit (b2b8f0d) verified in git log
- Task 2 commit (5dbdc08) verified in git log
- TypeScript compilation clean (no errors)
