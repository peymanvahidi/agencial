---
phase: 02-charting-core
plan: 06
subsystem: ui
tags: [lightweight-charts, measurement-tool, watchlist, sidebar, timeframes, api]

# Dependency graph
requires:
  - phase: 02-charting-core
    provides: "Chart toolbar, measurement tool, watchlist panel, sidebar layout from plans 01-05"
provides:
  - "Sorted favorite timeframes in toolbar"
  - "4-state measurement tool cycle (idle/pointA/finalized/cleared)"
  - "204 No Content handling in API layer"
  - "Bottom-pinned sidebar collapse toggle"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Array.sort with findIndex for canonical ordering"
    - "Ref-based state machine for multi-click tool interactions"
    - "HTTP status-aware response parsing (204/205 no-body handling)"

key-files:
  created: []
  modified:
    - frontend/src/components/chart/chart-toolbar.tsx
    - frontend/src/components/chart/chart-container.tsx
    - frontend/src/lib/api.ts
    - frontend/src/components/layout/left-sidebar.tsx

key-decisions:
  - "Sort favorites via TIMEFRAMES.findIndex() -- O(n*m) but n and m are both < 20, no perf concern"
  - "4-state cycle uses two refs (finalized + cleared) rather than enum to minimize diff from existing code"
  - "Return undefined as T for 204 -- safe because DELETE callers don't use return value"
  - "mt-auto on collapse toggle wrapper -- leverages existing flex-col parent, single-class fix"

patterns-established:
  - "Ref-based state machine: use multiple boolean refs for multi-phase interaction cycles"

requirements-completed: [CHART-05, CHART-06, CHART-08, CHART-09]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 02 Plan 06: UAT Gap Closure Summary

**4 targeted UAT fixes: sorted favorite timeframes, 4-state measurement cycle, 204 No Content API handling, and bottom-pinned sidebar toggle**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T12:52:01Z
- **Completed:** 2026-02-22T12:53:57Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Favorite timeframes now render sorted from lowest to highest timeframe regardless of selection order
- Measurement tool follows correct 4-click cycle: set A, finalize B, clear overlay, start new measurement
- Watchlist symbol removal persists permanently (no rollback from JSON parse error on 204 response)
- Sidebar collapse toggle stays pinned to bottom in both expanded and collapsed states

## Task Commits

Each task was committed atomically:

1. **Task 1: Sort favorite timeframes by canonical order** - `8a5b634` (fix)
2. **Task 2: Fix measurement tool 4-state cycle** - `7f8fc71` (fix)
3. **Task 3: Handle 204 No Content in API handleResponse** - `458e264` (fix)
4. **Task 4: Pin sidebar collapse toggle to bottom** - `c3db222` (fix)

## Files Created/Modified
- `frontend/src/components/chart/chart-toolbar.tsx` - Sort favoriteTimeframes by TIMEFRAMES index before rendering
- `frontend/src/components/chart/chart-container.tsx` - Add measureClearedRef for 4-state measurement cycle
- `frontend/src/lib/api.ts` - Return undefined for 204/205 before calling response.json()
- `frontend/src/components/layout/left-sidebar.tsx` - Add mt-auto to collapse toggle wrapper

## Decisions Made
- Sort favorites via TIMEFRAMES.findIndex() -- O(n*m) but both arrays are tiny, no performance concern
- 4-state cycle uses two boolean refs (finalized + cleared) rather than a state enum to minimize diff from existing code
- Return `undefined as T` for 204 -- safe because DELETE callers don't use the return value
- Single `mt-auto` class leverages existing flex-col parent for bottom pinning

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 02 UAT gaps are now closed
- Phase 02 (Charting Core) is fully complete with all 6 plans executed
- Ready to proceed to Phase 03

## Self-Check: PASSED

- All 4 modified files exist on disk
- All 4 task commits verified in git log (8a5b634, 7f8fc71, 458e264, c3db222)
- Must-have artifacts confirmed: TIMEFRAMES.findIndex in toolbar, measureClearedRef in container, 204 handling in api.ts, mt-auto in sidebar
- TypeScript compiles with zero errors
- Production build succeeds

---
*Phase: 02-charting-core*
*Completed: 2026-02-22*
