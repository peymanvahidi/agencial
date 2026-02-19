---
phase: 02-charting-core
plan: 03
subsystem: ui
tags: [toolbar, sidebar, timeframe-switcher, chart-type-toggle, scale-toggle, crosshair, zoom, measurement, radix-dropdown]

# Dependency graph
requires:
  - phase: 02-charting-core
    plan: 01
    provides: "Chart types (ChartType, Timeframe, TIMEFRAMES), chart-store (setTimeframe, setChartType, toggleScaleMode, toggleFavoriteTimeframe, favoriteTimeframes)"
  - phase: 02-charting-core
    plan: 02
    provides: "ChartContainer, useChart hook (chartRef), series-manager, OHLCLegend, keyboard shortcuts"
provides:
  - "ChartToolbar component: symbol display, favorite timeframe buttons, timeframe dropdown, chart type icon dropdown, scale toggle"
  - "ChartToolsSidebar component: crosshair toggle, zoom in/out/reset, measurement tool"
  - "Measurement overlay with price diff (abs + %) and time diff between two clicked points"
  - "Integrated dual-toolbar chart layout: toolbar (top) + sidebar (left) + canvas (fill)"
affects: [02-05, 04-drawing-tools]

# Tech tracking
tech-stack:
  added: []
  patterns: [callback-prop-pattern-for-chart-tool-actions, measurement-overlay-with-coordinate-conversion]

key-files:
  created:
    - frontend/src/components/chart/chart-toolbar.tsx
    - frontend/src/components/chart/chart-tools-sidebar.tsx
  modified:
    - frontend/src/components/chart/chart-container.tsx

key-decisions:
  - "Star icon in timeframe dropdown to toggle favorites (click star without closing dropdown)"
  - "Crosshair toggle uses CrosshairMode.Normal/Hidden from lightweight-charts API"
  - "Measurement tool uses series.coordinateToPrice() and timeScale.coordinateToTime() for pixel-to-value conversion"
  - "Measurement overlay renders as positioned div with dashed border and green/red shading based on direction"

patterns-established:
  - "Tool sidebar uses callback props from ChartContainer to access chart API methods"
  - "Measurement state machine: no points -> point A -> point A+B -> restart (third click clears)"
  - "ToolButton reusable component with active state highlighting matching brand color pattern"

requirements-completed: [CHART-02, CHART-05, CHART-06]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 02 Plan 03: Chart Toolbar and Sidebar Tools Summary

**Dual-toolbar chart layout with timeframe switcher (favorites + dropdown), chart type icon dropdown, Lin/Log scale toggle, crosshair/zoom/measurement sidebar tools, and interactive measurement overlay**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T08:27:22Z
- **Completed:** 2026-02-19T08:30:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Built top toolbar with symbol display, favorite timeframe quick-access buttons, full timeframe dropdown with star-toggle favorites, chart type icon dropdown (5 types), and Lin/Log scale toggle
- Built left sidebar tools panel with crosshair toggle, zoom in/out/reset buttons, and measurement tool
- Implemented measurement tool: click two chart points to see price difference (absolute + percentage) and time difference as an overlay with green/red directional shading
- Restructured ChartContainer layout to integrate toolbar (top) + sidebar (left) + canvas (fill) while preserving all existing keyboard shortcuts and OHLC legend

## Task Commits

Each task was committed atomically:

1. **Task 1: Build chart top toolbar with timeframe, chart type, and scale controls** - `d1ea15c` (feat)
2. **Task 2: Add left sidebar tools and integrate toolbar + sidebar into chart layout** - `bdd76e1` (feat)

## Files Created/Modified
- `frontend/src/components/chart/chart-toolbar.tsx` - Top toolbar: symbol name, favorite TF buttons, TF dropdown with star-toggle, chart type icon dropdown, scale toggle
- `frontend/src/components/chart/chart-tools-sidebar.tsx` - Left sidebar: crosshair toggle, zoom in/out/reset, measurement tool; reusable ToolButton component
- `frontend/src/components/chart/chart-container.tsx` - Restructured to flex column (toolbar + flex row (sidebar + canvas)), added crosshair/zoom/measure callbacks and measurement overlay

## Decisions Made
- Star icon in the timeframe dropdown allows toggling favorites without closing the menu (e.stopPropagation on star click)
- Crosshair toggle uses lightweight-charts CrosshairMode enum (Normal for visible, Hidden for off) applied via chart.applyOptions
- Measurement tool converts pixel coordinates to price/time using series.coordinateToPrice() and timeScale.coordinateToTime(), rendering an HTML overlay div
- Measurement overlay uses green (#26a69a) for upward and red (#ef5350) for downward price movement, matching the candlestick color scheme
- Tool sidebar is 40px wide, inside the chart component (not the app's left sidebar panel), ready for Phase 4 drawing tools

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All chart controls functional -- Plan 05 (symbol search/watchlist) can add symbol switching
- Left sidebar ready for Phase 4 drawing tool additions (ToolButton pattern reusable)
- Measurement tool coordinate conversion pattern established for future overlay tools
- Chart type dropdown supports all 5 types matching series-manager's switchSeries

---
*Phase: 02-charting-core*
*Completed: 2026-02-19*

## Self-Check: PASSED

- All 2 created files exist on disk (chart-toolbar.tsx, chart-tools-sidebar.tsx)
- Modified file exists (chart-container.tsx)
- Task 1 commit (d1ea15c) verified in git log
- Task 2 commit (bdd76e1) verified in git log
- TypeScript compilation clean (no errors)
- Next.js production build succeeds
