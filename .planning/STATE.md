# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** The AI learning loop: users backtest manually, the AI learns their strategy, and gradually becomes a personalized co-pilot that makes their trading more consistent and profitable.
**Current focus:** Phase 2: Charting Core

## Current Position

Phase: 2 of 8 (Charting Core)
Plan: 1 of 5 in current phase
Status: In Progress (plan 01 complete)
Last activity: 2026-02-19 -- Phase 02 plan 01 executed (chart foundation layer)

Progress: [▓▓▓▓░░░░░░] 15%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~53min
- Total execution time: ~4.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | ~4.4h | ~65min |
| 02-charting-core | 1 | 4min | 4min |

**Recent Trend:**
- Last 5 plans: 6min, 9min, ~4h (deployment), 4min
- Trend: plan 02-01 was fast (data layer only, no UI rendering)

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

### Pending Todos

None yet.

### Blockers/Concerns

- Research flags: Phase 2 (drawing tools overlay), Phase 4 (look-ahead bias prevention), Phase 8 (Claude streaming + tool use) may need research before planning
- REQUIREMENTS.md states 52 total requirements but actual count is 63 -- traceability table updated with correct count

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 02-01-PLAN.md (chart foundation layer)
Resume file: .planning/phases/02-charting-core/02-01-SUMMARY.md
Note: Ready for 02-02-PLAN.md execution (chart component rendering)
