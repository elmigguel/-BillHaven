# BillHaven Production Enhancement - Quick Deployment Guide

## 🚀 5-Minute Deployment

### Option 1: Automated Script (Recommended)

```bash
cd /home/elmigguel/BillHaven
./DEPLOY_PRODUCTION_ENHANCEMENTS.sh
```

The script will:
- Backup current files
- Install Helmet.js
- Replace with enhanced versions
- Commit and push to production

---

### Option 2: Manual Deployment

```bash
# 1. Install Helmet.js
cd /home/elmigguel/BillHaven/server
npm install helmet

# 2. Replace files
cd /home/elmigguel/BillHaven
cp server/index-enhanced.js server/index.js
cp vercel-enhanced.json vercel.json

# 3. Commit and push
git add server/index.js server/package.json vercel.json
git commit -m "feat: Add production security enhancements"
git push origin main
```

---

## ⚠️ Required Actions (After Deployment)

### 1. Set Up Sentry (5 minutes)

**Why:** Error tracking and performance monitoring

**Steps:**
1. Go to https://sentry.io and create account
2. Create new project (select "React")
3. Copy your DSN (looks like: `https://abc123@o123456.ingest.sentry.io/789`)
4. Add to Vercel:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Settings > Environment Variables
   - Add: `VITE_SENTRY_DSN` = `<your-dsn>`
5. Redeploy frontend

---

### 2. Set Up Uptime Monitoring (10 minutes)

**Why:** Get alerted immediately if your site goes down

**Recommended:** Better Uptime (https://betteruptime.com)

**Steps:**
1. Sign up at https://betteruptime.com (free tier)
2. Create 3 monitors:
   - Frontend: `https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app`
   - Backend: `https://billhaven.onrender.com/health`
   - Smart Contract RPC: Your Polygon endpoint
3. Set check interval: 1-3 minutes
4. Configure alerts: Email + SMS

---

### 3. Test Production Webhooks (15 minutes)

**Stripe:**
```bash
# In Stripe Dashboard:
# 1. Go to Webhooks
# 2. Click on your webhook endpoint
# 3. Click "Send test webhook"
# 4. Select "payment_intent.succeeded"
# 5. Verify logs show "Stripe webhook verified"
```

**OpenNode:**
```bash
# Create test Lightning invoice in OpenNode dashboard
# Pay with test wallet
# Verify webhook received and bill updated
```

---

## 🔍 Verification Checklist

After deployment, verify:

```bash
# 1. Backend health check
curl https://billhaven.onrender.com/health | jq '.'
# Should return: { "status": "healthy", "services": { ... } }

# 2. Frontend loads
curl -I https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
# Should return: HTTP/2 200 with security headers

# 3. Security headers present
curl -I https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app | grep -i "x-frame-options"
# Should return: x-frame-options: DENY

# 4. Request ID in responses
curl -I https://billhaven.onrender.com/health | grep -i "x-request-id"
# Should return: x-request-id: req_123456789_abc123
```

---

## 📊 What's Changed

### Backend (`server/index.js`)
- ✅ Helmet.js security headers
- ✅ Request ID tracking (X-Request-ID header)
- ✅ Structured JSON logging
- ✅ Enhanced health check (with performance metrics)
- ✅ Rate limiting cleanup (prevents memory leaks)
- ✅ HTTPS enforcement (production only)
- ✅ Error handling middleware
- ✅ Graceful shutdown handlers

### Frontend (`vercel.json`)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security (HSTS)
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Cache headers (API: no-cache, Static: 1 year)

---

## 🔐 Environment Variables to Verify

### Render (Backend)
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ VITE_OPENNODE_API_KEY
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ NODE_ENV=production
- ✅ PORT=3001

### Vercel (Frontend)
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ VITE_STRIPE_PUBLISHABLE_KEY
- ✅ VITE_OPENNODE_API_KEY
- ⚠️ VITE_SENTRY_DSN (needs setup)

---

## 🚨 Rollback Plan (If Something Goes Wrong)

```bash
# Restore backend
cd /home/elmigguel/BillHaven/server
cp index-backup-<timestamp>.js index.js
git add index.js
git commit -m "rollback: Restore previous backend version"
git push origin main

# Restore frontend config
cd /home/elmigguel/BillHaven
cp vercel-backup-<timestamp>.json vercel.json
git add vercel.json
git commit -m "rollback: Restore previous Vercel config"
git push origin main
```

---

## 📈 Monitoring Dashboard URLs

After setup, bookmark these:

1. **Backend Logs:** https://dashboard.render.com/
2. **Frontend Logs:** https://vercel.com/dashboard
3. **Error Tracking:** https://sentry.io/
4. **Uptime Monitoring:** https://betteruptime.com/
5. **Payment Dashboard:** https://dashboard.stripe.com/
6. **Database:** https://supabase.com/dashboard

---

## 🎯 Success Metrics

After 24 hours, you should see:

- **Uptime:** 100% (no downtime)
- **Response Time:** < 500ms average
- **Error Rate:** < 1%
- **Security Headers:** All present (check with securityheaders.com)
- **Logs:** Structured JSON with request IDs

---

## 📞 Need Help?

1. Check logs:
   - Render: https://dashboard.render.com/
   - Vercel: https://vercel.com/dashboard
   - Browser Console: F12 > Console

2. Review full documentation:
   - **PRODUCTION_READINESS.md** - Complete production guide
   - **server/index-enhanced.js** - Enhanced server code with comments

3. Test health endpoint:
   ```bash
   curl -v https://billhaven.onrender.com/health
   ```

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Health check returns 200 OK
- [ ] Security headers present (check with curl -I)
- [ ] Sentry DSN configured
- [ ] Uptime monitoring configured
- [ ] Webhooks tested (Stripe + OpenNode)
- [ ] Payment flow tested end-to-end
- [ ] Logs showing structured JSON format
- [ ] Team notified of deployment

---

**Deployment Time:** ~30 minutes total (including monitoring setup)
**Rollback Time:** ~5 minutes if needed
**Next Review:** 1 week (check monitoring dashboards)
