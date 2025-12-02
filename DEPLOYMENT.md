# BillHaven Deployment Guide

Complete guide for deploying BillHaven to Railway.app (Backend) and Vercel (Frontend).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [Railway.app](https://railway.app) account (backend hosting)
- [Vercel](https://vercel.com) account (frontend hosting)
- [Stripe](https://stripe.com) account (payments)
- [OpenNode](https://opennode.com) account (Lightning Network)
- [Supabase](https://supabase.com) project (database)

### Required Tools
- Git installed locally
- GitHub account (for repository connection)
- Node.js 20+ (for local testing)

---

## Backend Deployment (Railway)

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "feat: prepare for Railway deployment"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/BillHaven.git
git branch -M main
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your **BillHaven** repository
6. Railway will auto-detect the configuration from `server/railway.json`

### Step 3: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah

# OpenNode Configuration
VITE_OPENNODE_API_KEY=your_opennode_api_key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3001
NODE_ENV=production
SERVER_URL=https://your-railway-app.railway.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Step 4: Deploy

1. Railway will automatically deploy after you set environment variables
2. Wait for build to complete (2-3 minutes)
3. Click on the deployment to see logs
4. Copy your Railway URL (e.g., `https://billhaven-production.up.railway.app`)

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://your-railway-app.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-02T...",
  "services": {
    "supabase": "ok",
    "stripe": "ok",
    "opennode": "ok"
  }
}
```

---

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your BillHaven repository from GitHub
4. Vercel will auto-detect it's a Vite project

### Step 2: Configure Build Settings

Vercel should auto-detect these settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 3: Configure Environment Variables

In Vercel project settings, add these variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)

# OpenNode
VITE_OPENNODE_API_KEY=your_opennode_api_key

# Backend URL (from Railway)
VITE_API_URL=https://your-railway-app.railway.app

# WalletConnect (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id

# Sentry (optional)
VITE_SENTRY_DSN=your_sentry_dsn
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (3-5 minutes)
3. Vercel will provide a URL (e.g., `https://billhaven.vercel.app`)
4. Test the deployment

---

## Environment Variables

### Complete List

#### Backend (Railway)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | Yes | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes | `whsec_...` |
| `VITE_OPENNODE_API_KEY` | OpenNode API key | Yes | `your_key` |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment | No | `production` |
| `SERVER_URL` | Backend URL | Yes | Railway URL |
| `FRONTEND_URL` | Frontend URL | Yes | Vercel URL |

#### Frontend (Vercel)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes | `pk_test_...` |
| `VITE_OPENNODE_API_KEY` | OpenNode API key | Yes | `your_key` |
| `VITE_API_URL` | Backend API URL | Yes | Railway URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | No | `your_id` |
| `VITE_SENTRY_DSN` | Sentry DSN | No | `https://...` |

---

## Post-Deployment

### 1. Update Stripe Webhook URL

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Update the URL to: `https://your-railway-app.railway.app/webhooks/stripe`
4. Ensure these events are enabled:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
   - `charge.refunded`

### 2. Update OpenNode Webhook

1. Go to OpenNode Settings
2. Set webhook URL to: `https://your-railway-app.railway.app/webhooks/opennode`
3. Copy your webhook secret

### 3. Configure CORS

Update `server/index.js` CORS configuration with your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
```

Redeploy after this change.

### 4. Test Payment Flow

1. Create a test bill
2. Attempt payment with Stripe test card: `4242 4242 4242 4242`
3. Verify webhook receives payment confirmation
4. Check Railway logs for webhook processing

### 5. Monitor Health

```bash
# Backend health
curl https://your-railway-app.railway.app/health

# Check all services are "ok"
```

---

## Troubleshooting

### Backend Issues

#### Build Fails
```bash
# Check Railway logs
# Common issues:
# - Missing package.json in server directory
# - Wrong Node version
# - Missing dependencies

# Solution: Ensure server/package.json exists with all dependencies
```

#### Webhooks Not Working
```bash
# Check Stripe webhook signature
# Verify STRIPE_WEBHOOK_SECRET is set correctly
# Check Railway logs for signature errors

# Test webhook locally:
stripe listen --forward-to localhost:3001/webhooks/stripe
```

#### CORS Errors
```bash
# Ensure Vercel URL is in CORS origins list
# Update server/index.js and redeploy
```

### Frontend Issues

#### Environment Variables Not Loading
```bash
# In Vercel, ensure all VITE_ prefixed variables are set
# Redeploy after adding variables
```

#### Build Fails
```bash
# Check build logs in Vercel
# Common issues:
# - Missing dependencies
# - TypeScript errors
# - Environment variables missing at build time
```

#### API Calls Fail
```bash
# Verify VITE_API_URL is set to Railway URL
# Check Railway backend is running
# Verify CORS is configured correctly
```

### Database Issues

#### Supabase Connection Fails
```bash
# Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# Check Supabase project is active
# Verify API keys haven't expired
```

---

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Stripe webhook URL updated to production
- [ ] OpenNode webhook URL updated
- [ ] CORS configured with production domains
- [ ] Stripe using live keys (not test keys)
- [ ] Database migrations run on Supabase
- [ ] Health check returns "ok" for all services
- [ ] Test payment flow end-to-end
- [ ] Error tracking enabled (Sentry)
- [ ] Domain configured (optional)
- [ ] SSL certificates active (automatic on Railway/Vercel)

---

## Docker Deployment (Alternative)

If you prefer Docker deployment:

### Build and Run Locally

```bash
# Build Docker image
cd server
docker build -t billhaven-backend .

# Run container
docker run -p 3001:3001 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -e VITE_SUPABASE_URL=https://... \
  -e VITE_SUPABASE_ANON_KEY=eyJ... \
  billhaven-backend
```

### Deploy to Railway with Docker

1. In Railway, select **"Deploy from Dockerfile"**
2. Point to `server/Dockerfile`
3. Configure environment variables
4. Deploy

---

## Support

For issues:
- Check Railway logs: `railway logs`
- Check Vercel logs: Vercel Dashboard → Deployments → Logs
- Test webhooks: [Stripe CLI](https://stripe.com/docs/stripe-cli)
- Monitor health: `curl https://your-app.railway.app/health`

---

## Performance Optimization

### Backend (Railway)

- Health checks run every 30 seconds
- Rate limiting: 30 requests/minute per IP
- Auto-restart on failure (max 10 retries)

### Frontend (Vercel)

- Automatic CDN distribution
- Edge caching enabled
- Code splitting optimized (see vite.config.js)
- TON/Solana/Tron libraries lazy-loaded

---

## Security Notes

1. **Never commit .env files** to Git
2. Use **Railway's secret management** for sensitive keys
3. Enable **Stripe webhook signature verification** (already implemented)
4. Use **HTTPS only** for all endpoints
5. **Rate limiting** is enabled on all API endpoints
6. **Non-root Docker user** for security

---

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic)
3. Enable monitoring/alerts
4. Set up CI/CD for automatic deployments
5. Configure backup strategy for Supabase

---

**Deployment complete! Your BillHaven platform is now live.**

Railway Backend: `https://your-railway-app.railway.app`
Vercel Frontend: `https://your-vercel-app.vercel.app`
