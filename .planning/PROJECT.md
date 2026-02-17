# Agencial

## What This Is

An AI-powered trading platform that combines full-featured charting (like TradingView) with an AI co-pilot that learns each trader's unique style. Users manually backtest trades, building a rich journal with entry/SL/TP, screenshots, comments, and tags. Over time, the AI studies these backtests and starts surfacing opportunities, catching mistakes, and helping refine the trader's strategy. It's not automated trading — it's augmented decision-making that gets smarter the more you use it.

## Core Value

The AI learning loop: users backtest manually, the AI learns their strategy, and gradually becomes a personalized co-pilot that makes their trading more consistent and profitable — fewer mistakes, more consistency, more opportunities found.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

- [ ] Full interactive charting with candlestick charts, drawing tools, and indicators
- [ ] Classic indicators (MA, EMA, RSI, MACD, Bollinger Bands, Volume)
- [ ] Advanced indicators (Ichimoku, Fibonacci, Pivot Points, ATR, Stochastic)
- [ ] Multi-timeframe analysis across weekly, daily, 4H, 1H and lower
- [ ] Manual backtesting — click chart to set entry, stop loss, take profit
- [ ] Rich trade journal: pair, timeframe, entry/SL/TP, outcome, P&L per trade
- [ ] Chart screenshots captured at entry as trade context
- [ ] Free-text comments per trade explaining reasoning (AI-readable)
- [ ] Tags and labels per trade (strategy name, pattern type, confidence level)
- [ ] Database storage of all backtests with queryable history
- [ ] Win rate tracking (overall and per-strategy)
- [ ] Risk metrics dashboard (risk:reward ratio, max drawdown, expectancy)
- [ ] Pattern performance stats (which patterns work best for each user)
- [ ] AI side panel chat — conversational analysis powered by Claude API
- [ ] AI auto-detection of chart patterns (head & shoulders, flags, double bottoms, etc.)
- [ ] AI learns user's strategy from accumulated backtests and comments
- [ ] AI suggests entry/SL/TP based on learned strategy after sufficient data
- [ ] AI-generated insights ("You perform best on 4H BTC double bottoms")
- [ ] Strategy articulation — AI helps users describe and refine their own strategy through conversation
- [ ] Support for all markets: crypto, forex, stocks/equities, futures/commodities
- [ ] Live real-time price streaming
- [ ] Historical price data for charting and backtesting
- [ ] User accounts and authentication (public SaaS)

### Out of Scope

- Automated trade execution — this is an analysis and decision-support tool, not a trading bot
- Mobile app — web-first, mobile later
- Custom indicator scripting — use built-in classic + advanced indicators for v1
- Social features — no copy-trading, leaderboards, or community for v1
- Broker API integrations — free data feeds for v1, broker connections later
- Fine-tuned ML models — Claude API with agentic workflows for v1, custom models later

## Context

The trading tool landscape is fragmented. TradingView excels at charting but has no AI integration or personalized learning. Existing AI trading tools are either black-box automated systems or generic chatbots with no memory of your style. The gap is a tool that combines professional charting with an AI that learns YOUR specific approach over time.

The AI architecture uses Claude API with an agentic workflow (MCP, skills, plugins). The AI doesn't try to be helpful from day one with one trade — it needs a critical mass of backtests (the user mentioned ~100) before it starts making meaningful suggestions. This is a deliberate design choice: earn trust through observation, not assumptions.

The platform targets all skill levels. Beginners get a structured backtesting workflow that teaches discipline. Advanced traders get an AI that amplifies their existing edge. The AI adapts to the user's level through the natural language conversation and backtest complexity.

Data strategy: start with free feeds (Yahoo Finance, CoinGecko, similar) for MVP. Move to broker API integrations (Binance, Alpaca, OANDA) for production-quality data and eventually live trading support.

## Constraints

- **Tech stack**: Python backend (FastAPI) + React/Next.js frontend — chosen for strong data/AI ecosystem on backend
- **AI provider**: Claude API (Anthropic) — core intelligence layer, agentic workflow architecture
- **Data feeds**: Free APIs initially (Yahoo Finance, CoinGecko) — budget constraint for MVP
- **No auto-trading**: Platform assists decisions, never executes trades — regulatory and trust constraint
- **Real-time**: Must support live streaming charts from day one — traders need current data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude API over custom ML for v1 | Faster to build, more flexible reasoning, can work with small datasets via context | — Pending |
| AI learns from backtest accumulation, not rules | Users' strategies are intuitive and evolve — rules can't capture this | — Pending |
| Free data feeds for MVP | Reduce costs and complexity, prove the concept before investing in premium data | — Pending |
| Side panel chat as primary AI interface | Keeps chart uncluttered, natural conversation metaphor, familiar pattern | — Pending |
| Manual backtesting before AI suggestions | AI must earn trust through observation, not impose suggestions from day one | — Pending |
| Python + React split over full TypeScript | Python ecosystem is stronger for financial data processing and AI integration | — Pending |

---
*Last updated: 2026-02-17 after initialization*
