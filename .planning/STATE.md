# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** The AI learning loop: users backtest manually, the AI learns their strategy, and gradually becomes a personalized co-pilot that makes their trading more consistent and profitable.
**Current focus:** Phase 2: Charting Core

## Current Position

Phase: 2 of 8 (Charting Core)
Plan: 6 of 6 in current phase (ALL COMPLETE)
Status: Phase 02 complete (all 6 plans: 01, 02, 03, 04, 05, 06)
Last activity: 2026-02-22 -- Phase 02 plan 06 executed (UAT gap closure)

Progress: [▓▓▓░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~31min
- Total execution time: ~4.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | ~4.4h | ~65min |
| 02-charting-core | 6 | 22min | ~4min |

**Recent Trend:**
- Last 5 plans: 4min, 5min, 3min, 3min, 2min
- Trend: charting plans execute fast (~3min avg)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 8 phases derived from 63 requirements across 8 categories, following strict dependency chain
- [Roadmap]: Phases 3, 4, 5 can partially parallelize (all depend on Phase 2, not each other) but Phase 6 needs Phase 3
- [01-01]: Dark theme default with enableSystem=false -- no system preference detection
- [01-01]: Soft dark gray palette (#13131f bg, #1a1a2e card, #2a2a42 borders) with teal/cyan oklch accent
- [01-01]: Docker Compose for infrastructure only (PostgreSQL + Redis), backend/frontend run locally in dev
- [01-01]: Manual Alembic migration for deterministic initial schema
- [01-02]: Auth.js Credentials authorize() delegates to FastAPI /api/v1/auth/login -- all user management via FastAPI
- [01-02]: OAuth user sync in jwt callback to get backend UUID as token.userId
- [01-02]: Email service dev-mode console fallback when RESEND_API_KEY not configured
- [01-02]: Forgot password always returns success to prevent email enumeration
- [01-02]: Split auth.config.ts (Edge) and src/auth.ts (Node) to avoid Edge runtime issues
- [01-03]: Three-panel layout with react-resizable-panels needs percentage strings (not numbers) in v4
- [01-03]: Backend config.py must load env from project root (parent dir) not just CWD
- [01-03]: frontend/.env.local required for Auth.js vars (gitignored, created from .env.example)
- [01-03]: proxy.ts (or middleware.ts) MUST be in src/ when using src/app/ directory -- root-level file compiles but never executes due to Watchpack watcher path resolution
- [01-03]: Next.js 16 renames middleware.ts → proxy.ts; export must be `export const proxy = ...`
- [01-04]: Vercel for frontend + Railway for backend -- native platform support, free tier compatible
- [01-04]: Railway startCommand must be wrapped in sh -c for $PORT expansion
- [01-04]: DATABASE_URL scheme auto-normalized from postgres:// to postgresql+asyncpg:// in config.py
- [01-04]: pool_pre_ping=True required for cloud-hosted databases (Railway PostgreSQL recycles idle connections)
- [01-04]: No CI/CD pipelines -- Vercel/Railway git integration auto-deploys on push to main
- [02-01]: Math.imul for seeded PRNG -- correct 32-bit integer multiplication across JS engines
- [02-01]: Unix timestamps (number) for time values -- matches lightweight-charts v5 UTCTimestamp type
- [02-01]: toPrecision(8) for price rounding -- realistic decimal precision across all price ranges ($0.08 to $67,000)
- [02-01]: Volume histogram overlay (priceScaleId: '') with scaleMargins top 0.8 -- bottom 20% of chart
- [02-04]: Direct DB queries for duplicate/existence checks in watchlist service -- avoids stale selectinload relationship cache
- [02-04]: Default watchlist pre-populated with BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT on first user access
- [02-02]: UTCTimestamp branded type cast at series-manager boundary -- keeps OHLCData decoupled from lightweight-charts types
- [02-02]: Chart type switching triggers full series rebuild (remove + re-add main and volume) via shared effect
- [02-02]: Arrow key shortcuts: left/right pan 10 bars, up/down zoom 12.5% increments
- [02-03]: Star icon in timeframe dropdown toggles favorites without closing menu (e.stopPropagation)
- [02-03]: Crosshair toggle uses CrosshairMode.Normal/Hidden from lightweight-charts API
- [02-03]: Measurement tool uses series.coordinateToPrice() + timeScale.coordinateToTime() for pixel-to-value conversion
- [02-03]: Measurement overlay with green/red directional shading and price diff (abs + %)
- [02-05]: Zustand watchlist store without persist -- data lives on backend API, not localStorage
- [02-05]: Optimistic updates with rollback for addSymbol/removeSymbol for responsive UI
- [02-05]: Mock prices derived from getMockDataForSymbol last two 1D candles -- deterministic but realistic
- [02-05]: Chart nav item enabled (href "/" not "#") since chart renders on dashboard
- [02-06]: Sort favorites via TIMEFRAMES.findIndex() -- canonical ordering without mutating store array
- [02-06]: 4-state measurement cycle uses two boolean refs (finalized + cleared) to minimize code churn
- [02-06]: Return undefined as T for 204 No Content -- DELETE callers don't use return value
- [02-06]: mt-auto on collapse toggle wrapper leverages existing flex-col parent for bottom pinning

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags: Phase 2 (drawing tools overlay), Phase 4 (look-ahead bias prevention), Phase 8 (Claude streaming + tool use) may need research before planning
- REQUIREMENTS.md states 52 total requirements but actual count is 63 -- traceability table updated with correct count

## Session Continuity

Last session: 2026-02-22
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-market-data-service/03-CONTEXT.md
Note: Phase 03 context captured. Ready for /gsd:plan-phase 3.
