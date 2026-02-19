---
phase: 02-charting-core
plan: 01
subsystem: ui
tags: [lightweight-charts, zustand, typescript, mock-data, heikin-ashi, ohlcv]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Zustand store pattern (ui-store.ts, user-store.ts), Next.js project structure, Tailwind dark theme"
provides:
  - "OHLCVData, ChartType, Timeframe, ScaleMode type definitions"
  - "Deterministic mock OHLCV data generator for 10 crypto symbols"
  - "Heikin-Ashi pure transform function"
  - "TradingView dark theme chart configuration constants"
  - "Zustand chart-store with localStorage persistence"
  - "lightweight-charts@5.1.0 installed"
affects: [02-02, 02-03, 02-04, 02-05, 03-realtime]

# Tech tracking
tech-stack:
  added: [lightweight-charts@5.1.0]
  patterns: [seeded-prng-for-deterministic-mock-data, pure-function-transforms, zustand-persist-store]

key-files:
  created:
    - frontend/src/types/chart.ts
    - frontend/src/lib/mock-data.ts
    - frontend/src/lib/heikin-ashi.ts
    - frontend/src/lib/chart-config.ts
    - frontend/src/stores/chart-store.ts
  modified:
    - frontend/package.json
    - frontend/package-lock.json

key-decisions:
  - "Used Math.imul for seeded PRNG to ensure correct 32-bit integer multiplication across platforms"
  - "Unix timestamps (number) for time values to match lightweight-charts v5 UTCTimestamp type"
  - "toPrecision(8) for price rounding to maintain realistic decimal precision across all price ranges"
  - "Volume price scale overlay (priceScaleId: '') with scaleMargins top 0.8 for bottom 20% placement"

patterns-established:
  - "Seeded PRNG: hashString(symbol+timeframe) -> seededRandom(seed) for deterministic mock data"
  - "Pure data transforms: toHeikinAshi returns new array, no mutations"
  - "Chart store follows same Zustand persist pattern as ui-store.ts"
  - "Chart config exports separate constants per series type + getSeriesOptions() dispatcher"

requirements-completed: [CHART-01, CHART-02, CHART-08]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 02 Plan 01: Chart Foundation Summary

**Deterministic mock OHLCV generator, Heikin-Ashi transform, TradingView dark theme config, and Zustand chart state store with lightweight-charts@5.1.0**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T08:10:48Z
- **Completed:** 2026-02-19T08:14:38Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed lightweight-charts@5.1.0 and defined all shared chart types (OHLCVData, ChartType, Timeframe, ScaleMode, CryptoSymbol)
- Built deterministic seeded PRNG mock data generator producing consistent OHLCV arrays across page reloads for all 10 crypto symbols
- Implemented pure Heikin-Ashi transform function with correct HA formula
- Created TradingView dark theme chart configuration (#131722 background, green/red solid candles, dashed crosshair)
- Built Zustand chart store persisting symbol/timeframe/chartType/scaleMode/favoriteTimeframes to localStorage

## Task Commits

Each task was committed atomically:

1. **Task 1: Install lightweight-charts and create chart type definitions** - `699e733` (feat)
2. **Task 2: Create mock data generator, Heikin-Ashi transform, chart config, and chart store** - `8cd2052` (feat)

## Files Created/Modified
- `frontend/src/types/chart.ts` - Shared chart type definitions (OHLCData, OHLCVData, ChartType, Timeframe, ScaleMode, CryptoSymbol, all constants)
- `frontend/src/lib/mock-data.ts` - Deterministic seeded PRNG mock OHLCV generator with per-symbol basePrice/volatility
- `frontend/src/lib/heikin-ashi.ts` - Pure function Heikin-Ashi OHLC transform
- `frontend/src/lib/chart-config.ts` - TradingView dark theme defaults, series options (candlestick/bar/line/area/volume), getSeriesOptions dispatcher
- `frontend/src/stores/chart-store.ts` - Zustand store with persist middleware for chart state (localStorage key: 'chart-store')
- `frontend/package.json` - Added lightweight-charts@5.1.0 dependency
- `frontend/package-lock.json` - Updated lockfile

## Decisions Made
- Used `Math.imul` in seeded PRNG to ensure correct 32-bit integer multiplication across JavaScript engines
- Time values stored as Unix timestamps (numbers) matching lightweight-charts v5 UTCTimestamp type
- Price values rounded with `toPrecision(8)` to maintain realistic decimal precision for assets ranging from $0.08 (DOGE) to $67,000 (BTC)
- Volume histogram uses overlay price scale (`priceScaleId: ''`) with `scaleMargins.top: 0.8` to occupy bottom 20% of chart

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All chart types and data generators ready for Plan 02 (chart component rendering)
- Chart store provides state management for Plan 03 (toolbar controls)
- Mock data generator supports all 10 symbols for Plan 05 (symbol switching)
- lightweight-charts installed and importable for chart rendering

---
*Phase: 02-charting-core*
*Completed: 2026-02-19*

## Self-Check: PASSED

- All 5 created files exist on disk
- Both task commits (699e733, 8cd2052) verified in git log
- TypeScript compilation clean (no errors)
- Mock data verified: 1095 bars, ascending timestamps, deterministic output
- Heikin-Ashi verified: empty input returns empty, single bar formula correct
- Chart store verified: all defaults match specification
