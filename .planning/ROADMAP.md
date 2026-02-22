# Roadmap: Agencial

## Overview

Agencial delivers an AI-powered trading platform by building up from infrastructure through interactive charting, market data, drawing tools, indicators, backtesting, analytics, and finally the AI co-pilot. Each phase delivers a coherent, verifiable capability that unblocks the next. The dependency chain is strict: users must exist before personalized data; charts must work before drawing on them; historical data must flow before backtesting replays it; backtests must accumulate before the AI can analyze them. The eight phases follow this natural build order, with the AI co-pilot as the capstone that ties everything together.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Authentication** - Project scaffolding, database schema, user accounts, and deployment infrastructure
- [ ] **Phase 2: Charting Core** - Interactive candlestick charts with timeframes, zoom/pan, crosshair, symbol search, and watchlists
- [ ] **Phase 3: Market Data Service** - Real-time and historical price data for crypto and forex via WebSocket streaming
- [ ] **Phase 4: Drawing Tools** - Trendlines, Fibonacci, support/resistance, channels, annotations, and persistent drawings
- [ ] **Phase 5: Technical Indicators** - Classic and advanced indicators with configurable parameters, multi-pane layout, and Web Worker computation
- [ ] **Phase 6: Backtesting and Trade Journal** - Click-to-trade on chart, automatic P&L, screenshots, comments, tags, and journal management
- [ ] **Phase 7: Analytics Dashboard** - Win rate, risk metrics, equity curve, pattern analysis, and per-pair performance breakdowns
- [ ] **Phase 8: AI Co-Pilot** - Chat side panel with streaming Claude responses, chart context awareness, and backtest history analysis

## Phase Details

### Phase 1: Foundation and Authentication
**Goal**: Users can create accounts, log in, and have their preferences and data persist across sessions on a properly scaffolded platform
**Depends on**: Nothing (first phase)
**Requirements**: USER-01, USER-02, USER-03, USER-04, USER-05
**Success Criteria** (what must be TRUE):
  1. User can create an account with email/password and log in to see a personalized dashboard
  2. User can log in with Google OAuth and land in the same authenticated experience
  3. User can set preferences (default timeframe, timezone, theme) and see them preserved after logging out and back in
  4. Platform displays in dark theme by default with a working light theme toggle
  5. Backend API, database, and frontend are deployed and accessible via a public URL
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md -- Scaffold project infrastructure: Next.js frontend with Tailwind v4 theme system, FastAPI backend with Docker Compose, PostgreSQL + Redis, and Alembic migrations for all Phase 1 tables
- [ ] 01-02-PLAN.md -- Complete authentication system: FastAPI auth endpoints (register, login, verify-email, forgot/reset-password), Auth.js v5 with Google OAuth + Credentials, split-screen auth UI, route protection middleware
- [ ] 01-03-PLAN.md -- Dashboard shell and user preferences: three-panel resizable layout, top nav with avatar dropdown, collapsible sidebars, settings page with Account/Appearance/Trading Defaults, preferences API with persistence
- [ ] 01-04-PLAN.md -- [Gap closure] Deployment: Vercel (frontend) + Railway (backend) deployment configs, production-ready Dockerfile, and deployment guide

### Phase 2: Charting Core
**Goal**: Users can view and interact with professional-quality candlestick charts across multiple timeframes and chart types
**Depends on**: Phase 1
**Requirements**: CHART-01, CHART-02, CHART-03, CHART-04, CHART-05, CHART-06, CHART-07, CHART-08, CHART-09, CHART-10
**Success Criteria** (what must be TRUE):
  1. User can view candlestick and Heikin-Ashi charts with correct OHLC data and switch between candlestick, OHLC bar, line, and area chart types
  2. User can switch between all timeframes (1m through Monthly) and the chart re-renders with correct data for the selected timeframe
  3. User can zoom in/out and pan through chart history smoothly, with crosshair showing price/time and OHLC legend updating in real time
  4. User can toggle between linear and logarithmic price scales and see the chart rescale correctly
  5. User can search for symbols, switch between them instantly, and manage a persistent watchlist of tracked instruments
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md -- Chart foundation: types, mock OHLCV data generator, Heikin-Ashi transform, chart config, Zustand chart store, install lightweight-charts
- [ ] 02-02-PLAN.md -- Chart rendering core: React wrapper for lightweight-charts, series manager, crosshair + OHLC legend, volume overlay, wired to dashboard page
- [ ] 02-03-PLAN.md -- Chart toolbar and tools: top bar (timeframe switcher, chart type toggle, scale toggle), left sidebar tools (crosshair, zoom, measurement)
- [ ] 02-04-PLAN.md -- Watchlist backend: SQLAlchemy models, Alembic migration, Pydantic schemas, CRUD API endpoints with auto-created default watchlist
- [ ] 02-05-PLAN.md -- Watchlist frontend and symbol management: Zustand store with backend sync, watchlist panel in left sidebar, symbol search, click-to-switch chart
- [ ] 02-06-PLAN.md -- [Gap closure] UAT fixes: favorite timeframes sort order, measurement tool 3rd-click behavior, watchlist remove rollback, sidebar toggle positioning

### Phase 3: Market Data Service
**Goal**: Users see live, streaming price data on their charts and can load years of historical data for analysis and backtesting
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. User can view real-time crypto prices (BTC, ETH, major altcoins) updating on the chart without page refresh
  2. User can view real-time forex prices (major and minor pairs) updating on the chart without page refresh
  3. User can scroll back through 3+ years of crypto history and 5+ years of forex history with OHLCV candles loading seamlessly
  4. Price updates arrive via WebSocket with sub-second latency, and the UI shows a visible staleness indicator if the connection drops
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Drawing Tools
**Goal**: Users can annotate charts with professional drawing tools that persist across sessions
**Depends on**: Phase 2
**Requirements**: DRAW-01, DRAW-02, DRAW-03, DRAW-04, DRAW-05, DRAW-06, DRAW-07, DRAW-08, DRAW-09, DRAW-10
**Success Criteria** (what must be TRUE):
  1. User can draw trendlines with snap-to-candle and extension, and place horizontal support/resistance lines with visible price labels
  2. User can draw Fibonacci retracement with standard levels and Fibonacci extension for profit targets
  3. User can draw rectangles/zones with semi-transparent fill, text annotations, channels (parallel, regression), and pitchfork (Andrew's)
  4. User can undo and redo drawing actions, and all drawings persist after logging out and back in
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Technical Indicators
**Goal**: Users can overlay classic and advanced technical indicators on their charts with full configurability
**Depends on**: Phase 2
**Requirements**: INDI-01, INDI-02, INDI-03, INDI-04, INDI-05, INDI-06, INDI-07, INDI-08, INDI-09, INDI-10, INDI-11, INDI-12
**Success Criteria** (what must be TRUE):
  1. User can add any of the classic indicators (SMA, EMA, WMA, RSI, MACD, Bollinger Bands, Volume, Stochastic, ATR) and see them render correctly on the chart
  2. User can add advanced indicators (Ichimoku Cloud with all 5 components, Pivot Points in Classic/Fibonacci/Woodie modes, and VWAP session/anchored) and see them render correctly
  3. User can overlay multiple indicators simultaneously, with oscillators displayed in separate panes below the main chart
  4. User can configure parameters, colors, and line styles for each indicator independently, and changes reflect immediately on the chart
  5. Chart performance remains smooth (no visible lag) with 5+ indicators active on 5000+ candles
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Backtesting and Trade Journal
**Goal**: Users can manually backtest trades by clicking on the chart and build a rich, queryable trade journal
**Depends on**: Phase 2, Phase 3
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06, BACK-07, BACK-08
**Success Criteria** (what must be TRUE):
  1. User can click on the chart to set entry price, stop loss, and take profit, and the system records the trade with pair, timeframe, and direction
  2. System automatically calculates P&L and outcome (win/loss/breakeven) by walking forward through historical data to determine which level was hit first
  3. System auto-captures a chart screenshot at the time of trade entry, and the screenshot is viewable from the journal
  4. User can add free-text comments explaining trade reasoning and tag trades with labels (strategy name, pattern type, confidence level)
  5. User can view, filter, edit, and delete entries in their trade journal history
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Analytics Dashboard
**Goal**: Users can see comprehensive performance metrics that reveal strengths, weaknesses, and patterns in their trading
**Depends on**: Phase 6
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06, ANAL-07, ANAL-08
**Success Criteria** (what must be TRUE):
  1. User can view overall win rate and per-strategy win rate, with the numbers updating as new backtests are added
  2. User can view risk:reward ratio (planned vs actual), expectancy per trade, and maximum drawdown
  3. User can view an equity curve showing cumulative P&L over time
  4. User can view performance broken down by time-of-day, day-of-week, and trading session
  5. User can view pattern performance analysis (which patterns work best) and per-pair performance analysis
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: AI Co-Pilot
**Goal**: Users can converse with an AI assistant that understands their current chart context and backtest history
**Depends on**: Phase 2, Phase 6
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06
**Success Criteria** (what must be TRUE):
  1. User can open a side panel next to the chart and chat with the AI assistant in natural language
  2. AI responses stream in real-time (tokens appear progressively, not all at once) via WebSocket
  3. AI can reference the current chart context (symbol, timeframe, visible indicators) in its responses without the user having to describe it
  4. AI can query and reference the user's backtest history, surfacing patterns and performance insights in conversation
  5. User can view past conversation history and start new conversations
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD
- [ ] 08-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
Note: Phases 3, 4, and 5 all depend on Phase 2 but not on each other. However, Phase 6 depends on Phase 3 (historical data for backtesting), so the recommended order keeps 3 before 6.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Authentication | 3/4 | Gap closure pending | - |
| 2. Charting Core | 0/5 | Not started | - |
| 3. Market Data Service | 0/2 | Not started | - |
| 4. Drawing Tools | 0/3 | Not started | - |
| 5. Technical Indicators | 0/3 | Not started | - |
| 6. Backtesting and Trade Journal | 0/3 | Not started | - |
| 7. Analytics Dashboard | 0/2 | Not started | - |
| 8. AI Co-Pilot | 0/3 | Not started | - |
