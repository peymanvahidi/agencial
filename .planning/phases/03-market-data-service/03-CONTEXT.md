# Phase 3: Market Data Service - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace mock data with live streaming prices and deep historical data for crypto and forex. Users see real-time updates on their charts and can scroll back through years of history. This phase delivers the data pipeline — no new chart features, no new UI panels.

</domain>

<decisions>
## Implementation Decisions

### Data Providers
- Primary crypto source: Binance (WebSocket for real-time, REST for historical)
- Forex provider: Claude's discretion — research best free/affordable option with WebSocket support and major+minor pair coverage
- Historical data uses same providers as real-time (Binance for crypto, same forex provider)
- Historical caching strategy: Claude's discretion — choose between DB caching vs on-demand based on performance/complexity tradeoffs

### Symbol Coverage
- Crypto: All available Binance pairs (not limited to a curated list)
- Crypto quote currencies: USDT + BUSD + BTC quoted pairs
- Forex: Majors + minors (~20-30 pairs)
- Display naming: Exchange-native format — BTCUSDT for crypto, EUR/USD for forex (each asset class keeps its convention)

### Connection Behavior
- Disconnect notification: Colored banner/toast at top of chart area ("Connection lost — reconnecting...")
- Stale data visual: No chart dimming/graying — the banner is sufficient feedback
- Symbol switch behavior: Claude's discretion — pick between clearing immediately vs keeping old data visible
- Live candle updates: Animate/smooth — current candle smoothly updates OHLC as ticks arrive (not snapping)

### History Loading UX
- Load trigger: Auto-load on scroll — seamlessly fetch more candles as user approaches the edge
- Loading indicator: Skeleton/ghost candles that fill in when data arrives
- Initial load: Generous buffer (~500 candles) — more than visible so user can scroll back without waiting
- Timeframe switch: Maintain same time position — if looking at Jan 15 on 1H, switching to 1D shows Jan 15 area

### Claude's Discretion
- Forex data provider selection (research during planning)
- Historical data caching strategy (DB cache vs on-demand fetch)
- Symbol switch transition behavior (clear vs keep-old)
- Reconnection strategy (retry intervals, backoff)
- WebSocket connection management architecture
- Rate limiting and API key management approach

</decisions>

<specifics>
## Specific Ideas

- Smooth/animated candle updates for live data — the chart should feel "alive" as ticks arrive
- Skeleton candles for history loading — data should feel like it's "arriving" rather than appearing from nothing
- Exchange-native naming keeps the platform familiar to traders who already use Binance or forex platforms

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-market-data-service*
*Context gathered: 2026-02-22*
