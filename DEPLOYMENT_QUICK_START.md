# BillHaven Deployment Quick Start

Fast track guide to deploy BillHaven to production in under 30 minutes.

## Prerequisites (5 minutes)

- [x] GitHub account
- [x] Railway.app account (free tier)
- [x] Vercel account (free tier)
- [x] All API keys ready:
  - Stripe secret key + webhook secret
  - OpenNode API key
  - Supabase URL + anon key

---

## Step 1: Backend (Railway) - 10 minutes

### 1.1 Push to GitHub (2 min)

```bash
git add .
git commit -m "feat: production-ready backend with DevOps improvements"
git push origin main
```

### 1.2 Deploy to Railway (3 min)

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose **BillHaven** repository
5. Railway auto-detects `server/railway.json` ✅

### 1.3 Set Environment Variables (3 min)

In Railway dashboard, click **Variables** tab:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah
VITE_OPENNODE_API_KEY=your_opennode_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=production
```

### 1.4 Get Backend URL (1 min)

After deployment completes:
1. Click **Settings** → **Domains**
2. Copy the Railway URL (e.g., `https://billhaven-production.up.railway.app`)

### 1.5 Verify Deployment (1 min)

```bash
# Test health endpoint
curl https://your-railway-app.railway.app/health

# Or use verification script
./server/verify-deployment.sh https://your-railway-app.railway.app
```

Expected response:
```json
{
  "status": "ok",
  "services": {
    "supabase": "ok",
    "stripe": "ok",
    "opennode": "ok"
  }
}
```

---

## Step 2: Frontend (Vercel) - 10 minutes

### 2.1 Create Vercel Project (2 min)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import **BillHaven** from GitHub
4. Vercel auto-detects Vite ✅

### 2.2 Set Environment Variables (4 min)

In Vercel project settings:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_OPENNODE_API_KEY=your_opennode_key
VITE_API_URL=https://your-railway-app.railway.app
```

### 2.3 Deploy (3 min)

1. Click **Deploy**
2. Wait for build to complete
3. Copy Vercel URL (e.g., `https://billhaven.vercel.app`)

### 2.4 Update Backend CORS (1 min)

In Railway, add Vercel URL to environment:

```bash
FRONTEND_URL=https://billhaven.vercel.app
SERVER_URL=https://your-railway-app.railway.app
```

Redeploy backend (automatic after env change).

---

## Step 3: Configure Webhooks - 5 minutes

### 3.1 Stripe Webhook (3 min)

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set URL: `https://your-railway-app.railway.app/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
   - `charge.refunded`
5. Save and copy signing secret (should match `whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah`)

### 3.2 OpenNode Webhook (2 min)

1. Go to OpenNode Settings
2. Set webhook URL: `https://your-railway-app.railway.app/webhooks/opennode`
3. Save

---

## Step 4: Test Payment Flow - 5 minutes

### 4.1 Create Test Bill

1. Go to `https://billhaven.vercel.app`
2. Create a new bill
3. Enter amount and details

### 4.2 Test Stripe Payment

1. Select **Credit Card** payment
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any CVC

### 4.3 Verify Payment

1. Check payment success message
2. Verify webhook received (Railway logs)
3. Check database updated (Supabase)

---

## Verification Checklist

After deployment, verify:

- [ ] Backend health check returns "ok"
- [ ] All services status "ok" (Stripe, Supabase, OpenNode)
- [ ] Frontend loads correctly
- [ ] Can create bills
- [ ] Stripe payment works (test card)
- [ ] Webhook received (check Railway logs)
- [ ] Database updated (check Supabase)
- [ ] CORS working (no errors in browser console)

---

## Quick Commands

### Check Backend Status
```bash
curl https://your-railway-app.railway.app/health | jq
```

### View Railway Logs
```bash
# In Railway dashboard: Deployments → View Logs
# Or with Railway CLI:
railway logs
```

### Redeploy Backend
```bash
# Railway auto-redeploys on git push
git push origin main

# Or manually in Railway dashboard: Deployments → Redeploy
```

### Redeploy Frontend
```bash
# Vercel auto-redeploys on git push
git push origin main

# Or manually in Vercel dashboard: Deployments → Redeploy
```

---

## Environment Variables Reference

### Backend (Railway) - 7 variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah
VITE_OPENNODE_API_KEY=your_key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SERVER_URL=https://your-railway-app.railway.app
FRONTEND_URL=https://billhaven.vercel.app
NODE_ENV=production
```

### Frontend (Vercel) - 5 variables

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_OPENNODE_API_KEY=your_key
VITE_API_URL=https://your-railway-app.railway.app
```

---

## Troubleshooting

### Backend not starting

1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure `STRIPE_WEBHOOK_SECRET` starts with `whsec_`

### Frontend CORS errors

1. Verify `FRONTEND_URL` is set in Railway
2. Check backend CORS configuration
3. Redeploy backend after CORS changes

### Webhooks not working

1. Verify webhook URLs in Stripe/OpenNode dashboards
2. Check Railway logs for webhook signature errors
3. Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Payment fails

1. Check Stripe API keys are correct (test mode vs live mode)
2. Verify backend is receiving requests (Railway logs)
3. Check database connection (Supabase)

---

## Support Resources

### Documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [DEVOPS_IMPROVEMENTS.md](./DEVOPS_IMPROVEMENTS.md) - All improvements
- [BUILD_ANALYSIS.md](./BUILD_ANALYSIS.md) - Bundle optimization
- [server/README.md](./server/README.md) - API documentation

### External Links
- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [OpenNode API](https://opennode.com/docs/)

### Tools
- [Railway Dashboard](https://railway.app/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## Production Checklist

Before going live with real money:

- [ ] Switch to Stripe **live keys** (not test keys)
- [ ] Update webhook secret to **live webhook** secret
- [ ] Test with small real amount first
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure custom domain (optional)
- [ ] Enable Sentry for error tracking
- [ ] Review security settings
- [ ] Backup database
- [ ] Document admin procedures

---

## Performance Benchmarks

After deployment, you should see:

| Metric | Target | Status |
|--------|--------|--------|
| Backend response time | < 50ms | ✅ |
| Frontend load time (3G) | < 1.5s | ✅ |
| Health check | < 100ms | ✅ |
| Total bundle gzipped | < 1 MB | ✅ 862 KB |
| Critical path gzipped | < 200 KB | ✅ 169 KB |

---

## Next Steps

After successful deployment:

1. **Monitor** - Set up UptimeRobot for health checks
2. **Test** - Comprehensive payment flow testing
3. **Optimize** - Use Lighthouse to identify improvements
4. **Custom Domain** - Configure your own domain (optional)
5. **Analytics** - Add Vercel Analytics or Google Analytics
6. **Go Live** - Switch to production API keys when ready

---

## Success! 🎉

Your BillHaven platform is now live:

- **Backend**: https://your-railway-app.railway.app
- **Frontend**: https://billhaven.vercel.app
- **Health**: https://your-railway-app.railway.app/health

**Total deployment time**: ~30 minutes

Start accepting payments immediately! 💰
