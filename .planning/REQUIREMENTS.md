# Requirements: Agencial

**Defined:** 2026-02-17
**Core Value:** The AI learning loop: users backtest manually, the AI learns their strategy, and gradually becomes a personalized co-pilot that makes their trading more consistent and profitable.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Charting

- [ ] **CHART-01**: User can view candlestick charts (standard, Heikin-Ashi) with OHLC data
- [ ] **CHART-02**: User can switch between timeframes (1m, 5m, 15m, 30m, 1H, 4H, D, W, M)
- [ ] **CHART-03**: User can zoom and pan through chart history smoothly
- [ ] **CHART-04**: User can see crosshair with price/time and OHLC legend
- [x] **CHART-05**: User can toggle between linear and logarithmic price scale
- [x] **CHART-06**: User can view chart types: candlestick, OHLC bar, line, area
- [ ] **CHART-07**: User sees real-time price updates via WebSocket streaming
- [x] **CHART-08**: User can load historical data (3+ years crypto, 5+ years forex)
- [x] **CHART-09**: User can search and switch between symbols quickly
- [ ] **CHART-10**: User can manage watchlists of tracked instruments

### Drawing Tools

- [ ] **DRAW-01**: User can draw trendlines with snap-to-candle and extension
- [ ] **DRAW-02**: User can place horizontal support/resistance lines with price labels
- [ ] **DRAW-03**: User can draw Fibonacci retracement with standard levels
- [ ] **DRAW-04**: User can draw Fibonacci extension for profit targets
- [ ] **DRAW-05**: User can draw rectangles/zones with semi-transparent fill
- [ ] **DRAW-06**: User can add text annotations on the chart
- [ ] **DRAW-07**: User can draw channels (parallel, regression)
- [ ] **DRAW-08**: User can draw pitchfork (Andrew's)
- [ ] **DRAW-09**: User can undo/redo drawing actions
- [ ] **DRAW-10**: User's drawings persist across sessions (server-side storage)

### Indicators

- [ ] **INDI-01**: User can add Moving Averages (SMA, EMA, WMA) with configurable periods
- [ ] **INDI-02**: User can add RSI with configurable period and OB/OS levels
- [ ] **INDI-03**: User can add MACD with signal line and histogram
- [ ] **INDI-04**: User can add Bollinger Bands with configurable period/deviation
- [ ] **INDI-05**: User can view volume bars color-coded by candle direction
- [ ] **INDI-06**: User can add Stochastic Oscillator with %K/%D lines
- [ ] **INDI-07**: User can add ATR for volatility measurement
- [ ] **INDI-08**: User can add Ichimoku Cloud with all 5 components
- [ ] **INDI-09**: User can add Pivot Points (Classic, Fibonacci, Woodie)
- [ ] **INDI-10**: User can add VWAP (session and anchored)
- [ ] **INDI-11**: User can overlay multiple indicators with separate panes for oscillators
- [ ] **INDI-12**: User can configure parameters, colors, and styles for each indicator

### Backtesting & Trade Journal

- [ ] **BACK-01**: User can click on chart to set entry price, stop loss, and take profit
- [ ] **BACK-02**: System automatically calculates P&L and outcome (win/loss/breakeven) from historical data
- [ ] **BACK-03**: User can record trade details: pair, timeframe, direction, entry/SL/TP
- [ ] **BACK-04**: System auto-captures chart screenshot at time of trade entry
- [ ] **BACK-05**: User can write free-text comments explaining trade reasoning
- [ ] **BACK-06**: User can tag trades with labels (strategy name, pattern type, confidence level)
- [ ] **BACK-07**: User can view and filter their trade journal history
- [ ] **BACK-08**: User can edit and delete backtest entries

### Analytics

- [ ] **ANAL-01**: User can view overall win rate and per-strategy win rate
- [ ] **ANAL-02**: User can view risk:reward ratio (planned vs actual)
- [ ] **ANAL-03**: User can view expectancy per trade
- [ ] **ANAL-04**: User can view maximum drawdown
- [ ] **ANAL-05**: User can view equity curve (cumulative P&L over time)
- [ ] **ANAL-06**: User can view performance breakdown by time-of-day, day-of-week, session
- [ ] **ANAL-07**: User can view pattern performance analysis (which patterns work best)
- [ ] **ANAL-08**: User can view per-pair performance analysis

### AI Co-Pilot

- [ ] **AI-01**: User can chat with AI assistant in a side panel next to the chart
- [ ] **AI-02**: AI can see current chart context (symbol, timeframe, visible indicators)
- [ ] **AI-03**: AI can query and reference user's backtest history in conversations
- [ ] **AI-04**: AI can auto-detect chart patterns (head & shoulders, flags, double tops/bottoms, wedges)
- [ ] **AI-05**: AI responses stream in real-time via WebSocket
- [ ] **AI-06**: User can view conversation history and start new conversations

### Data & Markets

- [x] **DATA-01**: Platform provides real-time crypto market data (BTC, ETH, major altcoins)
- [x] **DATA-02**: Platform provides real-time forex market data (major and minor pairs)
- [x] **DATA-03**: Platform provides historical OHLCV data for backtesting
- [x] **DATA-04**: Data updates in real-time via WebSocket streaming

### User Management

- [ ] **USER-01**: User can create account with email/password
- [ ] **USER-02**: User can log in with OAuth (Google)
- [ ] **USER-03**: User can configure preferences (default timeframe, timezone, theme)
- [ ] **USER-04**: Platform displays in dark theme by default with light theme option
- [ ] **USER-05**: User's data (backtests, drawings, settings) persists across sessions

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Learning Loop

- **AILR-01**: AI learns user's trading strategy from accumulated backtests and comments
- **AILR-02**: AI articulates user's strategy back to them in natural language
- **AILR-03**: AI suggests entry/SL/TP based on learned strategy after 100+ trades
- **AILR-04**: AI detects when a trade doesn't match user's usual strategy (mistake detection)
- **AILR-05**: AI generates periodic performance insight reports

### Multi-Timeframe

- **MTF-01**: User can view 2-4 timeframes of same symbol simultaneously (split screen)
- **MTF-02**: Crosshairs synchronize across multi-timeframe views
- **MTF-03**: Higher timeframe levels project onto lower timeframe charts

### Additional Markets

- **MKTX-01**: Platform provides US equity market data
- **MKTX-02**: Platform provides futures/commodities market data

### Advanced Features

- **ADV-01**: User can replay trades candle-by-candle hiding future data
- **ADV-02**: User can view Volume Profile (VPVR, fixed range)
- **ADV-03**: User can create/import custom indicators

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated trade execution | Analysis tool, not a trading bot -- regulatory and trust constraint |
| Mobile app | Web-first; charting requires screen real estate |
| Custom indicator scripting (Pine Script) | Enormous effort; TradingView has 10+ year head start |
| Social features / copy-trading | Distracts from core AI co-pilot value |
| Signal/alert marketplace | Liability and quality control concerns |
| News feed integration | Not differentiating; adds data provider costs |
| Broker API integrations | Each broker is separate integration; defer to v2+ |
| Paper trading simulation | Backtesting on historical data serves the learning purpose |
| Fine-tuned ML models | Claude API with agentic workflows for v1; custom models later |
| Real-time push notifications | AI insights surface in chat; alerts are future enhancement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| USER-01 | Phase 1 | Pending |
| USER-02 | Phase 1 | Pending |
| USER-03 | Phase 1 | Pending |
| USER-04 | Phase 1 | Pending |
| USER-05 | Phase 1 | Pending |
| CHART-01 | Phase 2 | Pending |
| CHART-02 | Phase 2 | Pending |
| CHART-03 | Phase 2 | Pending |
| CHART-04 | Phase 2 | Pending |
| CHART-05 | Phase 2 | Complete |
| CHART-06 | Phase 2 | Complete |
| CHART-07 | Phase 2 | Pending |
| CHART-08 | Phase 2 | Complete |
| CHART-09 | Phase 2 | Complete |
| CHART-10 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Complete |
| DATA-02 | Phase 3 | Complete |
| DATA-03 | Phase 3 | Complete |
| DATA-04 | Phase 3 | Complete |
| DRAW-01 | Phase 4 | Pending |
| DRAW-02 | Phase 4 | Pending |
| DRAW-03 | Phase 4 | Pending |
| DRAW-04 | Phase 4 | Pending |
| DRAW-05 | Phase 4 | Pending |
| DRAW-06 | Phase 4 | Pending |
| DRAW-07 | Phase 4 | Pending |
| DRAW-08 | Phase 4 | Pending |
| DRAW-09 | Phase 4 | Pending |
| DRAW-10 | Phase 4 | Pending |
| INDI-01 | Phase 5 | Pending |
| INDI-02 | Phase 5 | Pending |
| INDI-03 | Phase 5 | Pending |
| INDI-04 | Phase 5 | Pending |
| INDI-05 | Phase 5 | Pending |
| INDI-06 | Phase 5 | Pending |
| INDI-07 | Phase 5 | Pending |
| INDI-08 | Phase 5 | Pending |
| INDI-09 | Phase 5 | Pending |
| INDI-10 | Phase 5 | Pending |
| INDI-11 | Phase 5 | Pending |
| INDI-12 | Phase 5 | Pending |
| BACK-01 | Phase 6 | Pending |
| BACK-02 | Phase 6 | Pending |
| BACK-03 | Phase 6 | Pending |
| BACK-04 | Phase 6 | Pending |
| BACK-05 | Phase 6 | Pending |
| BACK-06 | Phase 6 | Pending |
| BACK-07 | Phase 6 | Pending |
| BACK-08 | Phase 6 | Pending |
| ANAL-01 | Phase 7 | Pending |
| ANAL-02 | Phase 7 | Pending |
| ANAL-03 | Phase 7 | Pending |
| ANAL-04 | Phase 7 | Pending |
| ANAL-05 | Phase 7 | Pending |
| ANAL-06 | Phase 7 | Pending |
| ANAL-07 | Phase 7 | Pending |
| ANAL-08 | Phase 7 | Pending |
| AI-01 | Phase 8 | Pending |
| AI-02 | Phase 8 | Pending |
| AI-03 | Phase 8 | Pending |
| AI-04 | Phase 8 | Pending |
| AI-05 | Phase 8 | Pending |
| AI-06 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after roadmap creation*
