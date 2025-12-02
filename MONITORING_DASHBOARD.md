# BillHaven Monitoring Dashboard

**Last Updated:** 2025-12-02
**Status:** 🟢 All Systems Operational

---

## 🎯 Quick Status Check

```bash
# Run this command to check all systems at once
curl -s https://billhaven.onrender.com/health | jq '.'
```

---

## 📊 System Health Overview

### Frontend (Vercel)
- **URL:** https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
- **Status:** 🟢 Operational
- **CDN:** Global edge network
- **Uptime Target:** 99.9%
- **Response Time Target:** < 1 second

**Quick Check:**
```bash
curl -I https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
# Expected: HTTP/2 200
```

---

### Backend (Render)
- **URL:** https://billhaven.onrender.com
- **Status:** 🟢 Operational
- **Region:** US East (Ohio)
- **Uptime Target:** 99.9%
- **Response Time Target:** < 500ms

**Quick Check:**
```bash
curl -s https://billhaven.onrender.com/health | jq '.status'
# Expected: "healthy"
```

---

### Database (Supabase)
- **Type:** PostgreSQL
- **Status:** 🟢 Operational
- **Region:** US East
- **Backup:** Daily (7-day retention)

**Quick Check:**
```bash
curl -s https://billhaven.onrender.com/health | jq '.services.supabase'
# Expected: "ok"
```

---

### Payment Processors

#### Stripe
- **Status:** 🟢 Operational
- **Dashboard:** https://dashboard.stripe.com
- **Webhook:** Signature verified

**Quick Check:**
```bash
curl -s https://billhaven.onrender.com/health | jq '.services.stripe'
# Expected: "ok"
```

#### OpenNode (Lightning)
- **Status:** 🟢 Operational
- **Dashboard:** https://opennode.com/dashboard
- **Webhook:** HMAC verified

**Quick Check:**
```bash
curl -s https://billhaven.onrender.com/health | jq '.services.opennode'
# Expected: "ok"
```

---

### Smart Contract (Polygon)
- **Address:** 0x8beED27aA6d28FE42a9e792d81046DD1337a8240
- **Network:** Polygon Mainnet
- **Status:** 🟢 Deployed
- **Verified:** Yes

**Quick Check:**
```bash
# Check contract on PolygonScan
open https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240
```

---

## 🔍 Detailed Health Metrics

### Current Performance
```bash
curl -s https://billhaven.onrender.com/health | jq '.performance'
```

**Expected Output:**
```json
{
  "supabase": "45ms",
  "stripe": "120ms",
  "opennode": "89ms",
  "total": "254ms"
}
```

**Thresholds:**
- 🟢 Green: < 500ms total
- 🟡 Yellow: 500ms - 1000ms total
- 🔴 Red: > 1000ms total

---

### Server Uptime
```bash
curl -s https://billhaven.onrender.com/health | jq '.uptime'
```

**Output:** Seconds since last restart

---

### Environment Check
```bash
curl -s https://billhaven.onrender.com/health | jq '.environment'
```

**Expected:** `"production"`

---

## 📈 Key Metrics to Monitor

### 1. Uptime
- **Target:** 99.9% (43 minutes downtime/month max)
- **Current:** Track via Better Uptime or UptimeRobot
- **Alert if:** Down for > 2 minutes

### 2. Response Time
- **Target:** < 500ms (backend API)
- **Current:** Check `.performance.total` in health endpoint
- **Alert if:** > 1000ms consistently

### 3. Error Rate
- **Target:** < 1% of total requests
- **Current:** Monitor via Sentry
- **Alert if:** > 5% in 5-minute window

### 4. Payment Success Rate
- **Target:** > 95%
- **Current:** Stripe Dashboard > Payments
- **Alert if:** < 90% in 1-hour window

### 5. Webhook Delivery
- **Target:** 100% (Stripe retries automatically)
- **Current:** Stripe Dashboard > Webhooks > Attempts
- **Alert if:** Multiple failures for same event

---

## 🚨 Alert Thresholds

### Critical (Immediate Action Required)
- 🔴 **Service Down:** Any component unreachable for > 2 minutes
- 🔴 **Error Spike:** > 10 errors/minute
- 🔴 **Payment Failures:** > 10% failure rate
- 🔴 **Security Issue:** Rate limit exceeded by 10x

### Warning (Investigate Within 1 Hour)
- 🟡 **Slow Response:** > 1 second consistently
- 🟡 **Degraded Service:** Health check shows "degraded"
- 🟡 **Error Increase:** 2-5% error rate
- 🟡 **Database Slow:** Supabase queries > 200ms

### Info (Review Daily)
- ℹ️ **Rate Limit Hits:** Normal traffic spikes
- ℹ️ **Performance Degradation:** 500-1000ms response
- ℹ️ **Minor Errors:** < 1% error rate

---

## 🔧 Troubleshooting Commands

### Check Backend Logs (Render)
```bash
# Via Render Dashboard
1. Go to https://dashboard.render.com/
2. Select "billhaven-backend" service
3. Click "Logs" tab
4. Filter by request ID if needed
```

### Check Frontend Logs (Vercel)
```bash
# Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. View function logs
```

### Check Database Health (Supabase)
```bash
# Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Database" > "Health"
4. Check query performance
```

### Check Payment Status (Stripe)
```bash
# Via Stripe Dashboard
1. Go to https://dashboard.stripe.com/payments
2. Filter by date range
3. Check success/failure rate
4. Review webhook delivery logs
```

### Check Smart Contract (Polygon)
```bash
# Via PolygonScan
1. Go to https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240
2. Check recent transactions
3. Verify contract is not paused
4. Check event logs
```

---

## 📊 Weekly Health Report

### Run this every Monday:

```bash
#!/bin/bash
# weekly-health-check.sh

echo "BillHaven Weekly Health Report"
echo "=============================="
echo ""

echo "1. Backend Health:"
curl -s https://billhaven.onrender.com/health | jq '{status, uptime, services, performance}'
echo ""

echo "2. Security Headers Check:"
curl -I https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"
echo ""

echo "3. Request ID Check:"
curl -I https://billhaven.onrender.com/health | grep -i "x-request-id"
echo ""

echo "4. Response Time Test:"
time curl -s https://billhaven.onrender.com/health > /dev/null
echo ""

echo "Review complete. Check Sentry and Better Uptime for detailed metrics."
```

---

## 🎯 Monthly Review Checklist

### Security
- [ ] Review Sentry error patterns
- [ ] Check rate limit logs for abuse attempts
- [ ] Verify all security headers present
- [ ] Review Stripe webhook logs
- [ ] Check for failed authentication attempts

### Performance
- [ ] Average response time < 500ms
- [ ] 99.9% uptime achieved
- [ ] No memory leaks (stable memory usage)
- [ ] Database query times < 100ms average
- [ ] CDN cache hit rate > 90%

### Reliability
- [ ] Zero unplanned downtime
- [ ] All deployments successful
- [ ] Health checks passing
- [ ] Backups completed successfully
- [ ] No data loss incidents

### Compliance
- [ ] PCI-DSS audit passed (via Stripe)
- [ ] GDPR compliance verified (minimal data logging)
- [ ] API keys rotated (quarterly)
- [ ] Webhook secrets rotated (monthly)
- [ ] Access logs reviewed

---

## 🔐 Security Monitoring

### Daily Checks
```bash
# Check for suspicious activity
curl -s https://billhaven.onrender.com/health
# If degraded, investigate immediately

# Check rate limiting
# Look for "Rate limit exceeded" in logs
# Normal: < 10 hits/day
# Suspicious: > 100 hits/day
```

### Weekly Checks
```bash
# Verify security headers
curl -I https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app | grep -E "x-frame-options|x-content-type-options|strict-transport-security"

# Check for exposed secrets (should return nothing)
curl -s https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app | grep -E "sk_live|whsec_|supabase\.co.*?eyJ"
```

### Monthly Checks
- Review Stripe webhook signature failures
- Check for unusual payment patterns
- Review Sentry for security-related errors
- Rotate API keys (quarterly schedule)

---

## 📞 Emergency Contacts

### Service Providers
- **Render Support:** https://dashboard.render.com/support
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/dashboard/support
- **Stripe Support:** https://support.stripe.com (24/7)
- **OpenNode Support:** support@opennode.com

### Status Pages
- **Render Status:** https://status.render.com
- **Vercel Status:** https://vercel-status.com
- **Supabase Status:** https://status.supabase.com
- **Stripe Status:** https://status.stripe.com
- **Polygon Network:** https://polygon.technology/blog-tags/status

---

## 🎨 Monitoring Dashboard URLs

### Bookmark These:
1. **Backend Logs:** https://dashboard.render.com/
2. **Frontend Logs:** https://vercel.com/dashboard
3. **Database:** https://supabase.com/dashboard
4. **Payments:** https://dashboard.stripe.com/
5. **Error Tracking:** https://sentry.io/ (after setup)
6. **Uptime:** https://betteruptime.com/ (after setup)
7. **Smart Contract:** https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240

---

## 🔄 Automated Monitoring Setup

### Option 1: Better Uptime (Recommended)

**Setup (5 minutes):**
1. Sign up at https://betteruptime.com
2. Add monitors:
   - Frontend: https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
   - Backend Health: https://billhaven.onrender.com/health
   - Expected status: 200
3. Set check interval: 1 minute
4. Configure alerts: Email + SMS

**Cost:** Free (10 monitors)

---

### Option 2: UptimeRobot

**Setup (5 minutes):**
1. Sign up at https://uptimerobot.com
2. Add monitors (same URLs as above)
3. Set check interval: 5 minutes
4. Configure alerts: Email

**Cost:** Free (50 monitors)

---

## 📱 Mobile Monitoring (Optional)

### Better Uptime Mobile App
- iOS: https://apps.apple.com/app/better-uptime/
- Android: https://play.google.com/store/apps/details?id=com.betteruptime

### Sentry Mobile App
- iOS: https://apps.apple.com/app/sentry/
- Android: https://play.google.com/store/apps/details?id=io.sentry.mobile

**Benefits:**
- Real-time push notifications
- Quick status checks
- Acknowledge incidents
- View error details on-the-go

---

## ✅ Monitoring Checklist

### Initial Setup (After Deployment)
- [ ] Backend health check returning 200 OK
- [ ] Frontend loading successfully
- [ ] Security headers present
- [ ] Request IDs in responses
- [ ] Structured logs in Render
- [ ] Sentry DSN configured
- [ ] Uptime monitoring configured
- [ ] Alert notifications working

### Daily
- [ ] Quick health check (1 minute)
- [ ] Review error count in Sentry (2 minutes)
- [ ] Check uptime status (30 seconds)

### Weekly
- [ ] Run weekly health report (5 minutes)
- [ ] Review performance metrics (10 minutes)
- [ ] Check for security issues (5 minutes)

### Monthly
- [ ] Complete monthly review checklist (30 minutes)
- [ ] Rotate webhook secrets (10 minutes)
- [ ] Update documentation if needed (15 minutes)

### Quarterly
- [ ] Rotate API keys (15 minutes)
- [ ] Review and update alert thresholds (10 minutes)
- [ ] Disaster recovery test (1 hour)

---

## 🎉 Success Indicators

After 1 week, you should see:
- ✅ 100% uptime (or 99.9% with documented incidents)
- ✅ < 500ms average response time
- ✅ < 1% error rate
- ✅ All security headers A-rated
- ✅ Zero security incidents

After 1 month, you should see:
- ✅ Consistent performance trends
- ✅ Proactive issue detection (before users notice)
- ✅ < 15 minute MTTR (Mean Time To Recovery)
- ✅ Clear incident response process
- ✅ Automated alerting working perfectly

---

**Last Check:** Run this command now to verify everything is working:

```bash
curl -s https://billhaven.onrender.com/health | jq '.'
```

Expected output should show `"status": "healthy"` with all services `"ok"`.

If you see any errors, check the PRODUCTION_READINESS.md troubleshooting section.

---

**Dashboard Version:** 1.0.0
**Next Update:** 2025-12-09
