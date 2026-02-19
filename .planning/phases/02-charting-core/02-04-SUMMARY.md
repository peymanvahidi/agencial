---
phase: 02-charting-core
plan: 04
subsystem: api
tags: [fastapi, sqlalchemy, alembic, postgresql, watchlists, crud]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "User model, auth dependencies (get_current_user), database session (get_db), exception handlers"
provides:
  - "Watchlist and WatchlistItem SQLAlchemy models"
  - "Alembic migration 002 for watchlists + watchlist_items tables"
  - "WatchlistService with full CRUD + default watchlist auto-creation"
  - "6 authenticated FastAPI endpoints under /api/v1/watchlists"
affects: [02-05, frontend-watchlist-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Direct DB query for duplicate/existence checks instead of relying on in-memory relationship state"]

key-files:
  created:
    - backend/app/watchlists/__init__.py
    - backend/app/watchlists/models.py
    - backend/app/watchlists/schemas.py
    - backend/app/watchlists/service.py
    - backend/app/watchlists/router.py
    - backend/alembic/versions/002_add_watchlists.py
  modified:
    - backend/app/main.py
    - backend/alembic/env.py

key-decisions:
  - "Direct DB queries for duplicate/existence checks in add_symbol and remove_symbol to avoid stale selectinload relationship cache"
  - "Default watchlist pre-populated with BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT on first user access"

patterns-established:
  - "Watchlist service pattern: class with AsyncSession, ownership verification via combined WHERE on user_id + entity_id"
  - "Auto-create defaults on first access: list endpoint creates default entity if none exist"

requirements-completed: [CHART-10]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 02 Plan 04: Watchlist Backend API Summary

**Full watchlist CRUD API with SQLAlchemy models, Alembic migration, auto-created default watchlist, and 6 authenticated FastAPI endpoints**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T08:10:49Z
- **Completed:** 2026-02-19T08:15:44Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Watchlist and WatchlistItem models with UUID PKs, cascade delete, unique constraint on (watchlist_id, symbol)
- Alembic migration 002 creating both tables with indexes
- WatchlistService with get_or_create_default, list, create, delete, add_symbol, remove_symbol, reorder_items
- 6 authenticated endpoints: GET/POST/DELETE watchlists, POST/DELETE items, PATCH reorder
- Default watchlist with BTC, ETH, SOL, BNB auto-created for new users on first access
- Ownership isolation: all operations verify watchlist belongs to the requesting user

## Task Commits

Each task was committed atomically:

1. **Task 1: Create watchlist models, schemas, and Alembic migration** - `10d8de8` (feat)
2. **Task 2: Create watchlist service and router, mount on FastAPI app** - `b3af484` (feat)

## Files Created/Modified
- `backend/app/watchlists/__init__.py` - Package init
- `backend/app/watchlists/models.py` - Watchlist and WatchlistItem SQLAlchemy models
- `backend/app/watchlists/schemas.py` - Pydantic request/response schemas (WatchlistResponse, WatchlistCreate, AddSymbolRequest, ReorderItemsRequest)
- `backend/app/watchlists/service.py` - WatchlistService with full CRUD business logic and ownership verification
- `backend/app/watchlists/router.py` - FastAPI router with 6 authenticated endpoints
- `backend/alembic/versions/002_add_watchlists.py` - Migration creating watchlists + watchlist_items tables
- `backend/app/main.py` - Added watchlist router include
- `backend/alembic/env.py` - Added watchlist model imports for autogenerate support

## Decisions Made
- Used direct DB queries for duplicate/existence checks in add_symbol and remove_symbol rather than relying on the in-memory selectinload relationship cache -- more reliable across session states
- Default watchlist symbols: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT (top 4 by market cap)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale relationship cache in add_symbol and remove_symbol**
- **Found during:** Task 2 (service implementation)
- **Issue:** Checking for duplicates and existing items via in-memory `watchlist.items` relationship was unreliable after flush -- selectinload returns stale data when items were added/removed in the same session
- **Fix:** Switched to direct `SELECT` queries on WatchlistItem table for existence/duplicate checks
- **Files modified:** backend/app/watchlists/service.py
- **Verification:** All 9 service tests pass including duplicate detection (ConflictError) and removal
- **Committed in:** b3af484 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correct duplicate detection and item removal. No scope creep.

## Issues Encountered
- backend/.env contains Railway template variables (e.g., `${{Postgres.DATABASE_URL}}`) which cause SQLAlchemy URL parse errors locally -- resolved by passing DATABASE_URL as environment variable override when running Alembic and tests

## User Setup Required
None - no external service configuration required. Docker PostgreSQL used for local development.

## Next Phase Readiness
- All 6 watchlist API endpoints are functional and ready for frontend consumption in Plan 05
- Alembic migration applied, tables exist in local PostgreSQL
- Service layer follows established project patterns (UserService), easy for Plan 05 frontend to integrate

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (10d8de8, b3af484) verified in git log.

---
*Phase: 02-charting-core*
*Completed: 2026-02-19*
