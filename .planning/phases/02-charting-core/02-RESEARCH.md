# Phase 2: Charting Core - Research

**Researched:** 2026-02-19
**Domain:** Financial charting (HTML5 Canvas), React integration, symbol/watchlist management
**Confidence:** HIGH

## Summary

Phase 2 delivers the charting experience that is the product's core interaction surface. The technology choice is clear: TradingView's **lightweight-charts v5.1.0** is the industry standard open-source financial charting library. At 35kB gzipped, it provides candlestick/bar/line/area series out of the box, multi-pane support (v5 feature for volume), crosshair events, logarithmic price scale, and zoom/pan -- covering nearly all CHART requirements natively. Heikin-Ashi is not a built-in chart type but is trivially implemented as a data transformation feeding into the standard CandlestickSeries.

The React integration approach should be a **custom thin wrapper** using `useRef`/`useEffect`/`useLayoutEffect` following the official TradingView React tutorial pattern, NOT a third-party wrapper library. The third-party wrappers (`lightweight-charts-react-wrapper` v2.1.1 last updated 2+ years ago, `lightweight-charts-react-components` v1.4.0 recently updated but adds unnecessary abstraction) add indirection and lag behind the core library. The official docs provide a clean React component pattern that gives full API access.

For the backend, watchlists need a new `watchlists` and `watchlist_items` table pair following the existing SQLAlchemy async pattern, with Alembic migration. Mock OHLC data should be generated client-side with a deterministic seed per symbol, producing realistic price action across all timeframes. The phase boundary explicitly states mock/static data only -- real market data is Phase 3.

**Primary recommendation:** Use `lightweight-charts@5.1.0` directly with a custom React wrapper (no third-party React wrapper). Build Heikin-Ashi as a data transform. Generate mock OHLC data client-side. Store watchlists server-side via FastAPI + PostgreSQL.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- TradingView-like aesthetic -- dark background, clean grid lines, industry-standard look traders expect
- Classic green/red candle colors -- green for bullish, red for bearish
- Always solid candle bodies -- both bullish and bearish fully filled (no hollow candles)
- TradingView default dark background (#131722) -- familiar to traders, not matched to app's #13131f
- Dual toolbar layout: top bar for chart controls + left sidebar for tools
- Top toolbar: timeframe switcher, chart type toggle, scale toggle, settings
- Timeframe switcher: compact dropdown showing all timeframes (1m, 5m, 15m, 1H, 4H, 1D, 1W, 1M), with user-pinned favorites visible as quick-access buttons
- Chart type switcher: icon dropdown -- small icon showing current chart type, click to see all options with icons
- Left sidebar in Phase 2: include basic tools (crosshair toggle, zoom controls, measurement tool) -- drawing tools fill it in Phase 4
- Watchlist lives in the left sidebar section (part of the existing 3-panel layout from Phase 1)
- Each watchlist item shows: symbol name, last price, 24h percentage change -- compact and essential
- Search bar at the top of the watchlist panel -- type to search, click to add/switch symbol
- Phase 2 symbols: crypto only (BTC, ETH, SOL, major alts) with mock OHLC data -- forex added with Phase 3
- Zoom: scroll wheel to zoom in/out centered on cursor position -- standard TradingView behavior
- Crosshair: full crosshair lines -- horizontal + vertical dashed lines spanning full chart, with price/time labels at the axes
- OHLC legend: top-left overlay on the chart, updating O/H/L/C values as crosshair moves -- TradingView standard
- Pan: left-click and drag to pan chart horizontally through history

### Claude's Discretion
- Grid line style and opacity
- Axis typography and formatting
- Volume bar colors and placement
- Keyboard shortcuts
- Right-click context menu design
- Exact toolbar button spacing and icon selection
- Loading/error states for chart data
- Auto-scroll behavior when new candles arrive

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHART-01 | User can view candlestick charts (standard, Heikin-Ashi) with OHLC data | `lightweight-charts` CandlestickSeries with upColor/downColor/wickColor options. Heikin-Ashi via data transformation function applied before setData(). See Architecture Pattern 2. |
| CHART-02 | User can switch between timeframes (1m, 5m, 15m, 30m, 1H, 4H, D, W, M) | Zustand chart store holds active timeframe. Switching triggers mock data regeneration for new interval and calls series.setData() + timeScale.fitContent(). |
| CHART-03 | User can zoom and pan through chart history smoothly | Native lightweight-charts behavior: scroll wheel zooms, left-drag pans. Configurable via handleScroll/handleScale chart options. See Code Examples. |
| CHART-04 | User can see crosshair with price/time and OHLC legend | chart.subscribeCrosshairMove() callback + HTML overlay div for OHLC legend. Crosshair configured with CrosshairMode.Normal, dashed line style. See Code Examples. |
| CHART-05 | User can toggle between linear and logarithmic price scale | priceScale.applyOptions({ mode: 0 }) for normal, mode: 1 for logarithmic. Single toggle button in top toolbar. |
| CHART-06 | User can view chart types: candlestick, OHLC bar, line, area | CandlestickSeries, BarSeries, LineSeries, AreaSeries -- all native. Switching requires removing old series and adding new one with same data. |
| CHART-07 | User sees real-time price updates via WebSocket streaming | **DEFERRED to Phase 3 per phase boundary.** Phase 2 uses mock/static data only. The chart architecture will support series.update() for future real-time integration. |
| CHART-08 | User can load historical data (3+ years crypto, 5+ years forex) | **PARTIAL in Phase 2.** Mock data generator produces configurable date ranges. Real historical data loads in Phase 3. Architecture supports lazy loading via timeScale.subscribeVisibleLogicalRangeChange(). |
| CHART-09 | User can search and switch between symbols quickly | Symbol search component with filtered list of supported crypto symbols. Switching updates chart store, triggers data reload, updates OHLC legend header. |
| CHART-10 | User can manage watchlists of tracked instruments | Backend: watchlists + watchlist_items tables, CRUD API endpoints. Frontend: Zustand watchlist store, watchlist panel in left sidebar with add/remove/reorder. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lightweight-charts | 5.1.0 | Financial HTML5 canvas charting | Official TradingView open-source library. 35kB gzipped. Used by TradingView itself. Supports candlestick, bar, line, area, histogram series natively. Multi-pane support in v5. |
| zustand | 5.0.11 (already installed) | Chart state management | Already in project. Perfect for chart state (active symbol, timeframe, chart type, scale mode) with persist middleware for user preferences. |
| lucide-react | 0.574.0 (already installed) | Toolbar icons | Already in project. Has chart-related icons (CandlestickChart, BarChart, LineChart, etc.). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| radix-ui | 1.4.3 (already installed) | Dropdown menus, tooltips, popovers | Already in project. Use for timeframe dropdown, chart type picker, symbol search popover. |
| react-resizable-panels | 4.6.4 (already installed) | Panel layout | Already in project. Existing 3-panel layout hosts the chart in the main content area and watchlist in the left sidebar. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| lightweight-charts (custom React wrapper) | lightweight-charts-react-components v1.4.0 | Third-party wrapper adds abstraction over raw API. Released Oct 2025, supports panes, but hides imperative API access needed for crosshair subscription, OHLC legend, and future drawing tools (Phase 4). Custom wrapper is ~100 lines and gives full control. |
| lightweight-charts | react-financial-charts | More features built in but much heavier (~200kB), less maintained, different rendering approach (SVG/React reconciliation vs Canvas). |
| Client-side mock data | Static JSON files | JSON files are simpler but can't generate different timeframes dynamically. A seed-based generator is more flexible and produces consistent data across sessions. |

**Installation:**
```bash
cd frontend && npm install lightweight-charts@5.1.0
```

No other new dependencies needed -- the project already has Zustand, Radix UI, Lucide, and react-resizable-panels.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── chart/
│   │   ├── chart-container.tsx        # Main chart wrapper (creates LW chart instance)
│   │   ├── chart-toolbar.tsx          # Top toolbar (timeframe, chart type, scale)
│   │   ├── chart-tools-sidebar.tsx    # Left sidebar tools (crosshair, zoom, measure)
│   │   ├── ohlc-legend.tsx            # OHLC overlay (top-left of chart)
│   │   ├── series-manager.ts          # Adds/removes series by chart type
│   │   └── hooks/
│   │       ├── use-chart.ts           # Chart instance lifecycle hook
│   │       └── use-crosshair.ts       # Crosshair subscription hook
│   ├── watchlist/
│   │   ├── watchlist-panel.tsx         # Watchlist container in left sidebar
│   │   ├── watchlist-item.tsx          # Single watchlist row
│   │   └── symbol-search.tsx           # Search/add symbols
│   └── layout/
│       ├── left-sidebar.tsx            # MODIFIED: adds watchlist section below nav
│       └── top-nav.tsx                 # MODIFIED: may add symbol display
├── stores/
│   ├── chart-store.ts                 # Active symbol, timeframe, chart type, scale
│   └── watchlist-store.ts             # Watchlist items, selected watchlist
├── lib/
│   ├── mock-data.ts                   # Deterministic OHLCV generator
│   ├── heikin-ashi.ts                 # HA data transformation
│   └── chart-config.ts               # Default chart/series options (colors, grid, etc.)
└── types/
    └── chart.ts                       # Shared chart type definitions
```

Backend additions:
```
backend/app/
├── watchlists/
│   ├── __init__.py
│   ├── models.py                      # Watchlist, WatchlistItem SQLAlchemy models
│   ├── schemas.py                     # Pydantic schemas
│   ├── router.py                      # CRUD endpoints
│   └── service.py                     # Business logic
└── alembic/versions/
    └── 002_add_watchlists.py          # Migration
```

### Pattern 1: Custom React Chart Wrapper
**What:** A React component that manages the lightweight-charts instance lifecycle using refs and effects.
**When to use:** Always -- this is the single chart component used throughout the app.
**Example:**
```typescript
// Source: Official TradingView React tutorial pattern
// https://tradingview.github.io/lightweight-charts/tutorials/react/advanced

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

interface ChartContainerProps {
  data: CandlestickData[];
  chartOptions?: DeepPartial<ChartOptions>;
  seriesOptions?: DeepPartial<CandlestickSeriesOptions>;
  onCrosshairMove?: (param: MouseEventParams) => void;
}

export function ChartContainer({ data, chartOptions, seriesOptions, onCrosshairMove }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Create chart instance (runs once)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      ...chartOptions,
    });

    chartRef.current = chart;

    // ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove(); // Critical: prevents memory leak
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Empty deps -- chart instance created once

  // Update data when it changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old series if exists
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    const series = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      ...seriesOptions,
    });

    series.setData(data);
    chartRef.current.timeScale().fitContent();
    seriesRef.current = series;
  }, [data, seriesOptions]);

  // Subscribe to crosshair events
  useEffect(() => {
    if (!chartRef.current || !onCrosshairMove) return;
    chartRef.current.subscribeCrosshairMove(onCrosshairMove);
    return () => {
      chartRef.current?.unsubscribeCrosshairMove(onCrosshairMove);
    };
  }, [onCrosshairMove]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
```

### Pattern 2: Heikin-Ashi Data Transformation
**What:** Pure function that transforms standard OHLC data into Heikin-Ashi OHLC data. Fed into the same CandlestickSeries.
**When to use:** When chart type is set to Heikin-Ashi.
**Example:**
```typescript
// Source: Standard Heikin-Ashi formula
// HA_Close = (O + H + L + C) / 4
// HA_Open  = (prev_HA_Open + prev_HA_Close) / 2
// HA_High  = max(H, HA_Open, HA_Close)
// HA_Low   = min(L, HA_Open, HA_Close)

interface OHLCData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function toHeikinAshi(data: OHLCData[]): OHLCData[] {
  if (data.length === 0) return [];

  const result: OHLCData[] = [];
  let prevHaOpen = data[0].open;
  let prevHaClose = (data[0].open + data[0].high + data[0].low + data[0].close) / 4;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const haClose = (d.open + d.high + d.low + d.close) / 4;
    const haOpen = i === 0 ? d.open : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(d.high, haOpen, haClose);
    const haLow = Math.min(d.low, haOpen, haClose);

    result.push({
      time: d.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });

    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }

  return result;
}
```

### Pattern 3: Chart Type Switching
**What:** Remove current series, create new series type with same data.
**When to use:** When user switches between candlestick/OHLC bar/line/area.
**Example:**
```typescript
// Source: lightweight-charts docs -- series cannot change type, must remove and re-add
// https://github.com/tradingview/lightweight-charts/blob/master/website/versioned_docs/version-5.1/intro.mdx

import {
  CandlestickSeries, BarSeries, LineSeries, AreaSeries,
  IChartApi, ISeriesApi
} from 'lightweight-charts';

type ChartType = 'candlestick' | 'heikin-ashi' | 'ohlc' | 'line' | 'area';

const SERIES_CONSTRUCTORS = {
  candlestick: CandlestickSeries,
  'heikin-ashi': CandlestickSeries, // Same renderer, different data
  ohlc: BarSeries,
  line: LineSeries,
  area: AreaSeries,
} as const;

function switchChartType(
  chart: IChartApi,
  currentSeries: ISeriesApi<any> | null,
  chartType: ChartType,
  data: OHLCData[],
): ISeriesApi<any> {
  if (currentSeries) {
    chart.removeSeries(currentSeries);
  }

  const SeriesType = SERIES_CONSTRUCTORS[chartType];
  const displayData = chartType === 'heikin-ashi' ? toHeikinAshi(data) : data;

  // Line and area need {time, value} not {time, open, high, low, close}
  const seriesData = (chartType === 'line' || chartType === 'area')
    ? displayData.map(d => ({ time: d.time, value: d.close }))
    : displayData;

  const series = chart.addSeries(SeriesType, getSeriesOptions(chartType));
  series.setData(seriesData);

  return series;
}
```

### Pattern 4: Volume Overlay with Price Scale
**What:** Volume histogram rendered as overlay on the main chart pane using a separate overlay price scale positioned at the bottom.
**When to use:** Always -- volume bars are standard on financial charts.
**Example:**
```typescript
// Source: lightweight-charts docs on overlay price scales
// https://context7.com/tradingview/lightweight-charts/llms.txt

import { HistogramSeries } from 'lightweight-charts';

// Volume as overlay on the same pane (not a separate pane)
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceFormat: { type: 'volume' },
  priceScaleId: '', // Empty string = overlay (separate from left/right price scale)
});

// Position volume at bottom 20% of chart
volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.8,   // Volume starts at 80% from top
    bottom: 0,  // Extends to bottom
  },
});

// Color volume bars by candle direction (green for up, red for down)
const volumeData = ohlcData.map(d => ({
  time: d.time,
  value: d.volume,
  color: d.close >= d.open
    ? 'rgba(38, 166, 154, 0.5)' // Green semi-transparent
    : 'rgba(239, 83, 80, 0.5)', // Red semi-transparent
}));
volumeSeries.setData(volumeData);
```

### Pattern 5: Crosshair + OHLC Legend
**What:** Subscribe to crosshair move events and render OHLC values in an HTML overlay positioned on top of the chart canvas.
**When to use:** Always -- core requirement for CHART-04.
**Example:**
```typescript
// Source: lightweight-charts crosshair tutorial
// https://github.com/tradingview/lightweight-charts/blob/master/website/tutorials/how_to/legends.mdx

chart.subscribeCrosshairMove((param) => {
  if (!param.time || !param.seriesData.size) {
    // Mouse left chart area -- show last bar data or clear
    return;
  }

  const candleData = param.seriesData.get(candlestickSeries);
  if (candleData && 'open' in candleData) {
    // Update OHLC legend with: O, H, L, C values
    setLegend({
      open: candleData.open,
      high: candleData.high,
      low: candleData.low,
      close: candleData.close,
      time: param.time,
    });
  }
});
```

### Pattern 6: Mock OHLC Data Generator
**What:** Deterministic pseudo-random OHLC generator that produces realistic price action from a seed value per symbol.
**When to use:** Phase 2 only -- replaced by real data in Phase 3.
**Example:**
```typescript
// Deterministic seed-based random for consistent data across sessions
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

interface MockDataConfig {
  symbol: string;
  timeframe: string;
  basePrice: number;
  volatility: number; // e.g. 0.02 for 2%
  barCount: number;
}

function generateMockOHLCV(config: MockDataConfig): OHLCVData[] {
  const rng = seededRandom(hashString(config.symbol + config.timeframe));
  const bars: OHLCVData[] = [];
  let price = config.basePrice;
  let startTime = getStartTime(config.timeframe, config.barCount);

  for (let i = 0; i < config.barCount; i++) {
    const change = (rng() - 0.48) * config.volatility * price; // slight upward bias
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + rng() * config.volatility * price * 0.5;
    const low = Math.min(open, close) - rng() * config.volatility * price * 0.5;
    const volume = Math.floor(rng() * 1000000 + 100000);

    bars.push({
      time: startTime + i * getIntervalSeconds(config.timeframe),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });

    price = close;
  }

  return bars;
}
```

### Anti-Patterns to Avoid
- **Re-creating the chart on every data change:** The chart instance should be created once and reused. Only the series/data should be updated. Creating a new chart on every render causes flicker, memory leaks, and performance issues.
- **Using React state for the chart instance:** Store chart and series refs in `useRef`, NOT `useState`. The chart instance is imperative and should not trigger React re-renders.
- **Embedding chart colors in the chart component:** Chart visual config (colors, grid, etc.) should be centralized in a config file, not scattered across components. This makes TradingView-style theming consistent.
- **Synchronous chart creation in useEffect:** Use `useLayoutEffect` for chart creation to prevent visual flash. `useEffect` runs after paint; `useLayoutEffect` runs before, so the chart is visible immediately.
- **Not calling chart.remove() on cleanup:** This is a canvas-based library. Failing to call `chart.remove()` on unmount leaks the canvas element, event listeners, and animation frames.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Financial chart rendering | Custom Canvas/SVG chart | lightweight-charts v5.1.0 | Candlestick rendering, price scales, time axis, zoom/pan, crosshair, axis labels -- months of work to build, battle-tested in lightweight-charts |
| Responsive chart sizing | Manual window.onresize handler | ResizeObserver API | ResizeObserver detects container size changes (not just window), works with react-resizable-panels when user drags divider |
| OHLC data types | Ad-hoc interfaces | lightweight-charts built-in types | CandlestickData, BarData, LineData, AreaData, HistogramData -- already typed in the library |
| Heikin-Ashi chart type | Custom series renderer | Data transformation + CandlestickSeries | HA is just a math transform on OHLC data. Feed transformed data into standard CandlestickSeries. No custom rendering needed. |
| Dropdown menus/popovers | Custom dropdown components | Radix UI (already installed) | Accessible, keyboard-navigable, composable. Already used in the project. |
| Icon set | Custom SVGs | lucide-react (already installed) | Has CandlestickChart, BarChart, LineChart, TrendingUp, Search, Plus, Star, X icons needed for chart toolbars. |

**Key insight:** lightweight-charts handles the hardest problems (canvas rendering, price scale computation, time axis formatting, smooth zoom/pan, crosshair tracking). The application layer only needs to manage state (which symbol, which timeframe, which chart type) and wire up the UI controls.

## Common Pitfalls

### Pitfall 1: Chart Instance Memory Leak
**What goes wrong:** Chart never cleaned up on component unmount, leaking canvas elements and event listeners.
**Why it happens:** Developers forget to call `chart.remove()` in the cleanup function, or the cleanup runs but the ref is already null.
**How to avoid:** Always call `chart.remove()` in `useLayoutEffect` cleanup. Store chart ref and set to null after removal. Guard with `if (chartRef.current)`.
**Warning signs:** Browser memory growing on repeated route navigation, slow chart after many symbol switches.

### Pitfall 2: Series Type Cannot Be Changed In-Place
**What goes wrong:** Developer tries to change a CandlestickSeries into a LineSeries using applyOptions.
**Why it happens:** Other charting libraries support type switching. lightweight-charts explicitly does not: "a series cannot be transferred from one type to another, since different series types require different data and options types."
**How to avoid:** Remove the old series with `chart.removeSeries(series)`, then `chart.addSeries(NewSeriesType, options)` with the same data (transformed if needed for line/area).
**Warning signs:** TypeScript errors on series options, chart showing wrong visualization.

### Pitfall 3: Time Data Must Be Sorted and Ascending
**What goes wrong:** Chart throws error or renders incorrectly.
**Why it happens:** lightweight-charts requires data to be sorted by time in ascending order. Duplicates or out-of-order timestamps cause silent rendering bugs.
**How to avoid:** Always sort data by time before calling `series.setData()`. Mock data generator should produce pre-sorted output.
**Warning signs:** Candles appearing in wrong positions, chart not rendering, console errors about time ordering.

### Pitfall 4: ResizeObserver vs Window Resize
**What goes wrong:** Chart doesn't resize when the resizable panel divider is dragged (only resizes on window resize).
**Why it happens:** `window.addEventListener('resize')` only fires on window size change. When the user drags the react-resizable-panels divider, the container changes size but the window doesn't.
**How to avoid:** Use `ResizeObserver` on the chart container div. This detects any container size change, including from panel resizing.
**Warning signs:** Chart maintains old dimensions after dragging sidebar wider/narrower.

### Pitfall 5: Crosshair Event Returns Map, Not Direct Object
**What goes wrong:** Developer accesses `param.close` directly, gets undefined.
**Why it happens:** The `subscribeCrosshairMove` callback receives a `MouseEventParams` where series data is in a `Map<ISeriesApi, SeriesDataItemTypeMap>`. Must use `param.seriesData.get(seriesRef)`.
**How to avoid:** Always use `.get(seriesRef)` on the seriesData Map, and type-narrow the result to check for OHLC fields.
**Warning signs:** OHLC legend showing undefined values, TypeScript errors.

### Pitfall 6: lightweight-charts v5 is ESM-Only
**What goes wrong:** Build errors when importing lightweight-charts.
**Why it happens:** v5.0 dropped CommonJS support and uses ES2020 syntax. The project's tsconfig target is ES2017, and Next.js bundler handles ESM fine, but if backend SSR tried to import it, it would fail.
**How to avoid:** lightweight-charts must only be imported in client components (`"use client"`). Never import it in server components or API routes. Next.js Turbopack handles ESM-to-CJS bridging automatically for client bundles.
**Warning signs:** Build errors about `require()` on ESM-only package, "ERR_REQUIRE_ESM".

### Pitfall 7: Chart Background vs App Background Mismatch
**What goes wrong:** Visible seam between chart area (#131722) and app background (#13131f).
**Why it happens:** User decided chart uses TradingView's dark background, not the app's dark background. These are close but different.
**How to avoid:** Use a subtle border or 1px separator between chart and surrounding UI. The slight color difference is intentional and expected by traders familiar with TradingView.
**Warning signs:** Jarring visual transition between chart and sidebar.

## Code Examples

Verified patterns from official sources:

### Chart Initialization with TradingView Dark Theme
```typescript
// Source: lightweight-charts docs + user decision (TradingView #131722 background)
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';

const chart = createChart(container, {
  width: container.clientWidth,
  height: container.clientHeight,
  layout: {
    background: { type: ColorType.Solid, color: '#131722' },
    textColor: '#d1d4dc',
    fontSize: 12,
  },
  grid: {
    vertLines: { color: 'rgba(42, 46, 57, 0.6)', style: LineStyle.Solid },
    horzLines: { color: 'rgba(42, 46, 57, 0.6)', style: LineStyle.Solid },
  },
  crosshair: {
    mode: CrosshairMode.Normal, // Free-moving, not snapping
    vertLine: {
      width: 1,
      color: 'rgba(224, 227, 235, 0.4)',
      style: LineStyle.Dashed,
      labelBackgroundColor: '#2a2e39',
    },
    horzLine: {
      width: 1,
      color: 'rgba(224, 227, 235, 0.4)',
      style: LineStyle.Dashed,
      labelBackgroundColor: '#2a2e39',
    },
  },
  rightPriceScale: {
    borderVisible: false,
    scaleMargins: { top: 0.1, bottom: 0.2 },
  },
  timeScale: {
    borderVisible: false,
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 5,
    barSpacing: 8,
  },
  handleScroll: { mouseWheel: true, pressedMouseMove: true },
  handleScale: { mouseWheel: true, pinch: true },
});
```

### Candlestick Series with Locked Decision Colors
```typescript
// Source: User decision -- green bullish, red bearish, always solid (no hollow)
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',        // Green (TradingView standard green)
  downColor: '#ef5350',      // Red (TradingView standard red)
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  borderVisible: false,      // No border = solid fill appearance
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
});
```

### Logarithmic Price Scale Toggle
```typescript
// Source: lightweight-charts price scale API
// https://context7.com/tradingview/lightweight-charts/llms.txt
// mode: 0 = Normal, 1 = Logarithmic, 2 = Percentage, 3 = IndexedTo100

function togglePriceScale(chart: IChartApi, logarithmic: boolean) {
  chart.priceScale('right').applyOptions({
    mode: logarithmic ? 1 : 0,
  });
}
```

### Keyboard Shortcuts for Chart Navigation
```typescript
// Source: lightweight-charts accessibility tutorial
// https://github.com/tradingview/lightweight-charts/blob/master/website/tutorials/a11y/keyboard.mdx

function setupKeyboardShortcuts(chartContainer: HTMLDivElement, chart: IChartApi) {
  chartContainer.tabIndex = 0; // Make focusable

  chartContainer.addEventListener('keydown', (event) => {
    const timeScale = chart.timeScale();
    const logicalRange = timeScale.getVisibleLogicalRange();
    if (!logicalRange) return;

    switch (event.key) {
      case 'ArrowLeft':
        timeScale.scrollToPosition(timeScale.scrollPosition() - 10, false);
        break;
      case 'ArrowRight':
        timeScale.scrollToPosition(timeScale.scrollPosition() + 10, false);
        break;
      case 'ArrowUp': {
        // Zoom in
        const bars = logicalRange.to - logicalRange.from;
        const newBars = bars * 0.875; // 12.5% zoom
        timeScale.setVisibleLogicalRange({
          from: logicalRange.to - newBars,
          to: logicalRange.to,
        });
        break;
      }
      case 'ArrowDown': {
        // Zoom out
        const bars2 = logicalRange.to - logicalRange.from;
        const newBars2 = bars2 * 1.125;
        timeScale.setVisibleLogicalRange({
          from: logicalRange.to - newBars2,
          to: logicalRange.to,
        });
        break;
      }
    }
  });
}
```

### Watchlist API Pattern (FastAPI)
```python
# Source: Project's existing auth/users pattern (backend/app/users/router.py)
# Following the established project convention: router.py + service.py + models.py + schemas.py

# models.py
class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False, server_default="My Watchlist")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["WatchlistItem"]] = relationship(back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    __table_args__ = (UniqueConstraint("watchlist_id", "symbol", name="uq_watchlist_symbol"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    watchlist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "BTCUSDT"
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    watchlist: Mapped["Watchlist"] = relationship(back_populates="items")

# router.py endpoints:
# GET    /api/v1/watchlists           -> list user's watchlists
# POST   /api/v1/watchlists           -> create watchlist
# DELETE /api/v1/watchlists/{id}      -> delete watchlist
# POST   /api/v1/watchlists/{id}/items -> add symbol to watchlist
# DELETE /api/v1/watchlists/{id}/items/{symbol} -> remove symbol
# PATCH  /api/v1/watchlists/{id}/items/reorder  -> update sort order
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| lightweight-charts v4 (single pane) | v5 multi-pane support | Jan 2024 (v5.0.0) | Volume can now be in separate pane. Phase 2 uses overlay approach (simpler), but multi-pane is available for Phase 5 indicators. |
| CommonJS support | ESM-only (ES2020) | v5.0.0 | Must use client-side imports only. Next.js Turbopack handles this. |
| Manual resize handling | v5.1 data conflation | Dec 2024 (v5.1.0) | Auto-merges data points when zoomed out, improving performance for large datasets. |
| Third-party React wrappers | Official React tutorial pattern | 2024 | TradingView now provides official React integration tutorials. Custom wrapper following official pattern is preferred over third-party packages. |
| Series markers in core | Series markers as plugins | v5.0.0 | Markers moved to plugin system. Relevant for future phases (trade entry/exit markers in Phase 6). |

**Deprecated/outdated:**
- `lightweight-charts-react-wrapper` v2.1.1: Last updated Oct 2023, pre-v5. Does not support panes or v5 API changes.
- `kaktana-react-lightweight-charts`: Last published 5 years ago. Dead project.
- CommonJS imports of lightweight-charts: No longer supported in v5+.

## Open Questions

1. **Measurement Tool Implementation**
   - What we know: User wants a measurement tool in the left sidebar for Phase 2. lightweight-charts has no built-in measurement tool.
   - What's unclear: The exact UX -- is this a ruler between two points on the chart showing price difference and bar count? Or something simpler?
   - Recommendation: Implement as a simple "click point A, click point B" overlay that shows price difference (absolute + percentage) and time difference. Use chart coordinate conversion APIs (`timeToCoordinate`, `coordinateToTime`) with an HTML/CSS overlay.

2. **Timeframe Favorites Persistence**
   - What we know: User wants pinned favorite timeframes as quick-access buttons. This is a user preference.
   - What's unclear: Store in existing user preferences (backend) or local-only (Zustand persist)?
   - Recommendation: Store in Zustand with persist middleware (localStorage). Lightweight preference, no backend round-trip needed. Can migrate to backend preferences later if needed.

3. **CHART-07 and CHART-08 Scope in Phase 2**
   - What we know: CHART-07 (WebSocket real-time) and CHART-08 (3+ years historical) are listed in Phase 2 requirements, but the CONTEXT.md phase boundary explicitly states "Market data comes from mock/static sources -- real-time data is Phase 3."
   - What's unclear: Whether these requirements should be marked as partially fulfilled or deferred.
   - Recommendation: Phase 2 builds the **architecture** that supports real-time updates (series.update() API) and historical loading (timeScale.subscribeVisibleLogicalRangeChange for lazy loading). But actual WebSocket and historical data APIs are Phase 3 scope. Mock data simulates the experience.

## Sources

### Primary (HIGH confidence)
- `/tradingview/lightweight-charts` via Context7 -- series types, crosshair API, price scale modes, time scale control, pane management
- [TradingView Lightweight Charts official docs](https://tradingview.github.io/lightweight-charts/) -- React tutorials (basic + advanced), crosshair configuration, pane API
- [GitHub releases](https://github.com/tradingview/lightweight-charts/releases) -- v5.1.0 (Dec 2024), v5.0.0 (Jan 2024) release notes
- Existing codebase analysis -- Phase 1 layout, Zustand stores, backend patterns, Tailwind CSS variables

### Secondary (MEDIUM confidence)
- [lightweight-charts-react-components](https://github.com/ukorvl/lightweight-charts-react-components) -- v1.4.0, confirmed pane support, but decision is custom wrapper
- [TradingView blog: Lightweight Charts v5 announcement](https://www.tradingview.com/blog/en/tradingview-lightweight-charts-version-5-50837/) -- multi-pane support, 16% size reduction, data conflation

### Tertiary (LOW confidence)
- Heikin-Ashi implementation details -- based on standard formula, not verified against a lightweight-charts-specific implementation (but the formula is well-established math, not library-specific)
- Mock data generator pattern -- custom design, no external source. Needs validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- lightweight-charts is the clear industry choice; verified via Context7, official docs, and npm
- Architecture: HIGH -- React wrapper pattern from official TradingView tutorials; backend pattern matches existing codebase conventions
- Pitfalls: HIGH -- documented from official issues, Context7 examples, and known Canvas lifecycle gotchas
- Mock data: MEDIUM -- custom generator pattern is standard approach but specific implementation needs testing
- Measurement tool: LOW -- no built-in support in lightweight-charts, implementation approach is a best guess

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (lightweight-charts is stable; v5.1.0 is latest, unlikely to change within 30 days)
