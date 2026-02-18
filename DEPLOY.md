# Production Deployment

This guide covers deploying Agencial to **Vercel** (frontend) and **Railway** (backend with PostgreSQL and Redis).

Deployment is triggered automatically by pushing to `main` -- no CI/CD pipelines needed. Both Vercel and Railway watch the repository and auto-deploy on push.

## Prerequisites

- A GitHub repository with this codebase pushed
- A [Vercel](https://vercel.com) account (free tier works)
- A [Railway](https://railway.app) account (free tier works for initial deploy)
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth 2.0 credentials
- A shared `NEXTAUTH_SECRET` value (generate with `openssl rand -base64 32`)

## Step 1: Deploy Backend to Railway

### 1.1 Create the Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** > **Deploy from GitHub Repo**
3. Select your repository
4. In **Service Settings** > **Root Directory**, set to `/backend`

### 1.2 Add Database Plugins

1. In your Railway project, click **New** > **Database** > **PostgreSQL**
   - Railway automatically provisions `DATABASE_URL` as an environment variable
2. Click **New** > **Database** > **Redis**
   - Railway automatically provisions `REDIS_URL` as an environment variable

### 1.3 Set Environment Variables

In the backend service, go to **Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | `<your-generated-secret>` | Must match the Vercel value |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |
| `CORS_ORIGINS` | `["https://your-app.vercel.app"]` | JSON array, must match Vercel URL |
| `RESEND_API_KEY` | `<your-resend-key>` | Optional for initial deploy (emails print to logs without it) |
| `EMAIL_FROM` | `noreply@agencial.dev` | Or your verified Resend domain |

`DATABASE_URL`, `REDIS_URL`, `BACKEND_URL`, and `PORT` are set automatically by Railway.

### 1.4 Run Database Migrations

Using the [Railway CLI](https://docs.railway.app/develop/cli):

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Link to your project
railway link

# Run migrations
railway run alembic upgrade head
```

Alternatively, you can run the migration as a one-off command in the Railway dashboard under **Service** > **Settings** > **Deploy** > **Custom Start Command** (temporarily set to `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`, then revert after first deploy).

### 1.5 Verify Backend

```bash
curl https://YOUR-RAILWAY-URL/api/v1/health
```

Expected response:

```json
{"status": "healthy"}
```

Note the Railway public URL for the next step.

## Step 2: Deploy Frontend to Vercel

### 2.1 Import the Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** > **Project** > **Import Git Repository**
3. Select your repository

### 2.2 Configure Build Settings

1. Set **Framework Preset** to **Next.js**
2. Set **Root Directory** to `frontend`
3. Leave build command and output directory as defaults

### 2.3 Set Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXTAUTH_SECRET` | `<your-generated-secret>` | Must match the Railway value |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |
| `AUTH_SECRET` | `<same-as-NEXTAUTH_SECRET>` | Auth.js v5 uses this name |
| `AUTH_GOOGLE_ID` | `<your-google-client-id>` | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | `<your-google-client-secret>` | From Google Cloud Console |
| `NEXT_PUBLIC_BACKEND_URL` | `https://YOUR-RAILWAY-URL` | Your Railway backend URL |

### 2.4 Deploy

Click **Deploy**. Vercel will build and deploy the frontend automatically.

### 2.5 Verify Frontend

Visit your Vercel URL in a browser. You should be redirected to the login page (`/auth/login`).

## Step 3: Post-Deploy Configuration

### 3.1 Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com) > **APIs & Services** > **Credentials**
2. Click your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
4. Click **Save**

### 3.2 Verify Cross-Service Communication

1. Visit your Vercel URL -- you should see the login page
2. Try registering a new account:
   - If `RESEND_API_KEY` is not set, check Railway logs for the verification token
   - If set, check your email for the verification link
3. After verifying email, log in and confirm you see the dashboard
4. Try Google OAuth login (if configured)

### 3.3 Update Environment Variables if URLs Change

If you get a custom domain or Railway URL changes:

1. Update `FRONTEND_URL` and `CORS_ORIGINS` on Railway
2. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BACKEND_URL` on Vercel
3. Update Google OAuth redirect URIs
4. Redeploy both services

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | (local) | PostgreSQL connection string (auto-provisioned by Railway) |
| `REDIS_URL` | Yes | (local) | Redis connection string (auto-provisioned by Railway) |
| `PORT` | No | `8000` | Server port (auto-set by Railway) |
| `NEXTAUTH_SECRET` | Yes | - | JWT signing secret (must match frontend) |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Frontend URL for CORS and email links |
| `CORS_ORIGINS` | Yes | `["http://localhost:3000"]` | Allowed CORS origins (JSON array) |
| `RESEND_API_KEY` | No | - | Resend email API key (emails print to logs without it) |
| `EMAIL_FROM` | No | `noreply@agencial.dev` | Sender email address |
| `BACKEND_URL` | No | `http://localhost:8000` | Backend self-reference URL |

### Frontend (Vercel)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | Yes | - | JWT signing secret (must match backend) |
| `NEXTAUTH_URL` | Yes | - | Canonical URL of the deployment |
| `AUTH_SECRET` | Yes | - | Same as NEXTAUTH_SECRET (Auth.js v5 convention) |
| `AUTH_GOOGLE_ID` | Yes | - | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | - | Google OAuth client secret |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | `http://localhost:8000` | Backend API URL for rewrites |

## Troubleshooting

### Backend returns 502 or fails to start

- Check Railway logs for startup errors
- Verify `DATABASE_URL` and `REDIS_URL` are set (Railway should auto-provision these)
- Ensure migrations have been run (`railway run alembic upgrade head`)

### Frontend shows "Server Error" or blank page

- Check Vercel deployment logs for build errors
- Verify `NEXT_PUBLIC_BACKEND_URL` points to the correct Railway URL
- Ensure `AUTH_SECRET` / `NEXTAUTH_SECRET` is set

### Google OAuth returns "redirect_uri_mismatch"

- Verify the redirect URI in Google Cloud Console matches exactly:
  `https://your-app.vercel.app/api/auth/callback/google`
- Note: No trailing slash

### CORS errors in browser console

- Verify `CORS_ORIGINS` on Railway matches the exact Vercel URL (including `https://`)
- The value must be a JSON array: `["https://your-app.vercel.app"]`

### Email verification not working

- If `RESEND_API_KEY` is not set, check Railway logs for the verification token
- If set, verify the `EMAIL_FROM` domain is verified in Resend

### Database migration fails

- Ensure the Railway CLI is linked to the correct project: `railway status`
- Try running migrations directly: `railway run alembic upgrade head`
- Check if PostgreSQL plugin is properly connected to the service
