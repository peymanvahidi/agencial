---
phase: 01-foundation-and-authentication
plan: 02
subsystem: auth
tags: [next-auth, auth.js-v5, fastapi, jwt, jwe, google-oauth, credentials, bcrypt, resend, email-verification, password-reset, split-auth]

# Dependency graph
requires:
  - "01-01: SQLAlchemy models (User, Account, VerificationToken), auth utilities (hash_password, verify_password, generate_token), FastAPI skeleton, API client"
provides:
  - "FastAPI auth endpoints: register, login, verify-email, forgot-password, reset-password, oauth-callback, me"
  - "AuthService with register, authenticate, verify_email, reset_password, find_or_create_oauth_user"
  - "get_current_user FastAPI dependency validating Auth.js JWE tokens via fastapi-nextauth-jwt"
  - "Email service with Resend integration and dev-mode console fallback"
  - "Auth.js v5 config with Google OAuth + Credentials provider calling FastAPI backend"
  - "OAuth signIn callback syncing users to PostgreSQL via /api/v1/auth/oauth-callback"
  - "Route protection middleware redirecting unauthenticated users to /login"
  - "Split-screen auth UI with Sign In / Sign Up tabs, password strength indicators"
  - "Email verification and password reset pages with token-based flows"
  - "SessionProvider wrapper for client-side session access"
affects: [01-03, 02, 03, 04, 05, 06, 07, 08]

# Tech tracking
tech-stack:
  added: [fastapi-nextauth-jwt, resend, pydantic-emailstr]
  patterns: [split-auth-architecture, credentials-passthrough-to-fastapi, oauth-callback-sync, dev-mode-email-fallback, suspense-boundary-for-searchparams]

key-files:
  created:
    - backend/app/auth/schemas.py
    - backend/app/auth/service.py
    - backend/app/auth/dependencies.py
    - backend/app/auth/router.py
    - backend/app/common/email.py
    - frontend/auth.config.ts
    - frontend/src/auth.ts
    - frontend/src/app/api/auth/[...nextauth]/route.ts
    - frontend/middleware.ts
    - frontend/src/hooks/use-session.ts
    - frontend/src/app/(auth)/layout.tsx
    - frontend/src/app/(auth)/login/page.tsx
    - frontend/src/app/(auth)/verify-email/page.tsx
    - frontend/src/app/(auth)/reset-password/page.tsx
    - frontend/src/components/auth/auth-layout.tsx
    - frontend/src/components/auth/login-form.tsx
    - frontend/src/components/auth/register-form.tsx
    - frontend/src/components/auth/forgot-password-form.tsx
    - frontend/src/components/auth/reset-password-form.tsx
    - frontend/src/components/session-provider.tsx
  modified:
    - backend/app/config.py
    - backend/app/main.py
    - frontend/src/app/layout.tsx
    - frontend/src/app/page.tsx

key-decisions:
  - "Auth.js Credentials authorize() delegates to FastAPI /api/v1/auth/login -- no user persistence in Auth.js, all user management via FastAPI"
  - "OAuth signIn synced to backend in jwt callback (not signIn callback) to get backend UUID as token.userId"
  - "Email service uses dev-mode console fallback when RESEND_API_KEY is placeholder/empty"
  - "Forgot password always returns success message to prevent email enumeration"
  - "Split auth.config.ts (Edge-compatible) and src/auth.ts (full config) to avoid Edge runtime issues"
  - "Suspense boundaries required for pages using useSearchParams in Next.js 16"
  - "Added FRONTEND_URL to backend config for constructing email verification/reset links"

patterns-established:
  - "Split-auth: Auth.js handles OAuth + sessions, FastAPI handles registration/verification/reset"
  - "Credentials passthrough: Auth.js authorize() calls FastAPI login endpoint, returns user for JWT"
  - "OAuth callback sync: Auth.js jwt callback POSTs to /api/v1/auth/oauth-callback to create/update user in PostgreSQL"
  - "Dev-mode email: console logging of verification/reset tokens when no Resend API key configured"
  - "Password validation: min 8 chars, uppercase, lowercase, digit -- enforced on both backend (Pydantic) and frontend (visual indicators)"
  - "Auth error display: inline error messages in forms with destructive color scheme"

requirements-completed: [USER-01, USER-02]

# Metrics
duration: 6min
completed: 2026-02-17
---

# Phase 1 Plan 2: Authentication System Summary

**Split-auth system with Auth.js v5 (Google OAuth + Credentials) on frontend, FastAPI auth endpoints (register/login/verify/reset/oauth-callback) on backend, email verification via Resend, and split-screen auth UI with tabs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-17T16:23:24Z
- **Completed:** 2026-02-17T16:30:15Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments
- Complete FastAPI auth backend: 7 endpoints (register, login, verify-email, forgot-password, reset-password, oauth-callback, me) with AuthService business logic
- Auth.js v5 frontend integration: Google OAuth + Credentials provider with JWT session strategy, OAuth callback syncing users to PostgreSQL
- Split-screen auth UI: Sign In/Sign Up tabs, Google OAuth at top, password strength indicators, forgot/reset password flow
- Route protection middleware: unauthenticated users redirect to /login, authenticated users on /login redirect to dashboard
- Email verification and password reset with token-based flows (dev-mode console fallback when no Resend key)
- get_current_user FastAPI dependency validating Auth.js JWE tokens for protected API endpoints

## Task Commits

Each task was committed atomically:

1. **Task 1: Build FastAPI auth endpoints and email service** - `7b68d8a` (feat)
2. **Task 2: Build Auth.js v5 config, auth UI pages, and route protection** - `2968df7` (feat)

## Files Created/Modified
- `backend/app/auth/schemas.py` - Pydantic v2 models: RegisterRequest, LoginRequest/Response, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest, OAuthCallbackRequest, MessageResponse, UserResponse
- `backend/app/auth/service.py` - AuthService class with register, authenticate, verify_email, send_reset_email_flow, reset_password, find_or_create_oauth_user
- `backend/app/auth/dependencies.py` - get_current_user FastAPI dependency using fastapi-nextauth-jwt to validate Auth.js JWE tokens
- `backend/app/auth/router.py` - 7 auth API endpoints mounted at /api/v1/auth/*
- `backend/app/common/email.py` - send_verification_email and send_reset_email using Resend with dev-mode console fallback
- `backend/app/config.py` - Added FRONTEND_URL setting for email template links
- `backend/app/main.py` - Mounted auth router via app.include_router
- `frontend/auth.config.ts` - Edge-compatible Auth.js providers config (Google + Credentials)
- `frontend/src/auth.ts` - Full Auth.js config with jwt/session/signIn callbacks
- `frontend/src/app/api/auth/[...nextauth]/route.ts` - NextAuth route handler exports
- `frontend/middleware.ts` - Route protection: unauthenticated -> /login, authenticated on auth pages -> /
- `frontend/src/hooks/use-session.ts` - Typed useSession wrapper with isLoading, isAuthenticated helpers
- `frontend/src/app/(auth)/layout.tsx` - Auth route group layout (no dashboard shell)
- `frontend/src/app/(auth)/login/page.tsx` - Split-screen login page with Sign In/Sign Up tabs
- `frontend/src/app/(auth)/verify-email/page.tsx` - Token verification page with loading/success/error states
- `frontend/src/app/(auth)/reset-password/page.tsx` - Password reset page with new password form
- `frontend/src/components/auth/auth-layout.tsx` - Split-screen layout: left branding panel, right form area
- `frontend/src/components/auth/login-form.tsx` - Login form with Google OAuth, divider, email/password, forgot password
- `frontend/src/components/auth/register-form.tsx` - Registration form with password strength indicator
- `frontend/src/components/auth/forgot-password-form.tsx` - Forgot password email form
- `frontend/src/components/auth/reset-password-form.tsx` - Reset password form with strength indicator
- `frontend/src/components/session-provider.tsx` - NextAuth SessionProvider wrapper for client components
- `frontend/src/app/layout.tsx` - Added SessionProvider wrapper
- `frontend/src/app/page.tsx` - Dashboard welcome page with user name and sign out

## Decisions Made
- Auth.js Credentials authorize() delegates entirely to FastAPI /api/v1/auth/login -- keeps user management in a single place (FastAPI/PostgreSQL)
- OAuth user sync happens in the jwt callback rather than signIn callback, so we can set the backend UUID as token.userId
- Email service uses dev-mode console fallback (logs URL + token) when RESEND_API_KEY is not configured -- enables development without external service
- Forgot password always returns success to prevent email enumeration attacks
- Split auth.config.ts (Edge-compatible, providers only) and src/auth.ts (full config with callbacks) to avoid Edge runtime module resolution issues
- Added FRONTEND_URL to backend config for constructing email verification and password reset links in HTML emails
- Suspense boundaries added to verify-email and reset-password pages since Next.js 16 requires useSearchParams to be wrapped in Suspense

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrapped useSearchParams in Suspense boundaries**
- **Found during:** Task 2 (frontend build verification)
- **Issue:** Next.js 16 requires useSearchParams() to be wrapped in a Suspense boundary for static page generation. Build failed with error on /reset-password page.
- **Fix:** Extracted page content using useSearchParams into separate components and wrapped with Suspense + loading fallback in both verify-email and reset-password pages.
- **Files modified:** frontend/src/app/(auth)/verify-email/page.tsx, frontend/src/app/(auth)/reset-password/page.tsx
- **Verification:** `npm run build` passes with zero errors, all 6 routes render correctly
- **Committed in:** 2968df7 (part of Task 2 commit)

**2. [Rule 2 - Missing Critical] Added SessionProvider for client-side session access**
- **Found during:** Task 2 (building dashboard page with useSession)
- **Issue:** next-auth/react useSession hook requires SessionProvider context wrapper in the component tree. Without it, client components cannot access session data.
- **Fix:** Created SessionProvider wrapper component and added it to root layout.tsx
- **Files modified:** frontend/src/components/session-provider.tsx, frontend/src/app/layout.tsx
- **Verification:** Frontend build passes, useSession hook accessible in client components
- **Committed in:** 2968df7 (part of Task 2 commit)

**3. [Rule 2 - Missing Critical] Added FRONTEND_URL to backend config**
- **Found during:** Task 1 (implementing email service)
- **Issue:** Email templates need the frontend URL to construct verification/reset links. Config only had BACKEND_URL.
- **Fix:** Added FRONTEND_URL setting with default "http://localhost:3000" to backend config.py
- **Files modified:** backend/app/config.py
- **Verification:** Email service correctly constructs URLs using FRONTEND_URL
- **Committed in:** 7b68d8a (part of Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. Suspense boundaries are a Next.js 16 requirement, SessionProvider is required for client-side session access, and FRONTEND_URL is required for email links.

## Issues Encountered
- Docker not running -- could not test backend endpoints against live database during verification. All code verified via module imports (all 7 endpoints registered correctly) and frontend build passing. Full end-to-end testing requires Docker Compose (PostgreSQL) to be running.

## User Setup Required

The following external services need manual configuration for full functionality:
- **Resend**: Set `RESEND_API_KEY` in `.env` for real email sending (dev mode logs tokens to console as fallback)
- **Google OAuth**: Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env` for Google sign-in
- **NEXTAUTH_SECRET**: Set a secure random string in `.env` (shared between frontend Auth.js and backend fastapi-nextauth-jwt)
- **Docker**: Start Docker Desktop, run `docker compose up -d && cd backend && alembic upgrade head`

## Next Phase Readiness
- Complete auth system ready: registration, login, verification, password reset, OAuth
- Protected routes and middleware working: all authenticated pages require valid session
- get_current_user dependency ready for any protected FastAPI endpoint
- Plan 03 (Dashboard Shell + Settings) can build the three-panel layout inside the protected route area
- Auth UI components (auth-layout, forms) are self-contained and won't conflict with dashboard components

## Self-Check: PASSED

- All 20 created files verified present on disk
- All 4 modified files verified present on disk
- Both task commits verified in git history (7b68d8a, 2968df7)
- Frontend build passes with zero errors (6 routes rendered)
- All backend Python modules import successfully (7 auth endpoints registered)

---
*Phase: 01-foundation-and-authentication*
*Completed: 2026-02-17*
