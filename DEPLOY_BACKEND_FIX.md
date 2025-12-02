# Quick Deploy Checklist - Backend Supabase Fix

## What Changed?
- ✅ Backend now handles `VITE_*` environment variables correctly
- ✅ Added detailed error logging for debugging
- ✅ Fixed all API key references
- ✅ Added missing `STRIPE_WEBHOOK_SECRET`

## Quick Deploy (5 minutes)

### Step 1: Commit & Push (2 min)
```bash
cd /home/elmigguel/BillHaven
git add server/index.js .env
git commit -m "fix: Resolve Supabase connection in backend server

- Add smart env var resolution (works with or without VITE_ prefix)
- Improve dotenv loading with fallback paths
- Add detailed error logging in health check endpoint
- Fix all API key references (Supabase, OpenNode)
- Add missing STRIPE_WEBHOOK_SECRET to .env

Fixes backend Supabase error on Render deployment"
git push origin main
```

### Step 2: Monitor Render Deployment (2 min)
1. Go to https://dashboard.render.com
2. Click on your "billhaven" service
3. Watch the "Events" tab - deployment should start automatically
4. Wait for "Deploy succeeded" message

### Step 3: Verify Fix (1 min)
```bash
curl https://billhaven.onrender.com/health | jq
```

**Expected output:**
```json
{
  "status": "ok",
  "services": {
    "supabase": "ok",  ✅ Should be "ok" now!
    "stripe": "ok",
    "opennode": "ok"
  },
  "errors": {}
}
```

## Troubleshooting

### If Supabase still shows "error":

1. **Check Render logs:**
   - Go to Render dashboard → "billhaven" service → "Logs" tab
   - Look for error messages in the logs

2. **Check environment variables in Render:**
   - Go to "Environment" tab
   - Verify these are set:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `VITE_OPENNODE_API_KEY`

3. **Check detailed error in health endpoint:**
   ```bash
   curl https://billhaven.onrender.com/health | jq '.errors'
   ```
   This will show the exact error message from Supabase

### If deployment fails:

1. **Check build logs in Render:**
   - Look for any errors during deployment
   - Common issues: missing dependencies, syntax errors

2. **Verify code syntax:**
   ```bash
   cd /home/elmigguel/BillHaven/server
   node --check index.js
   ```

3. **Test locally again:**
   ```bash
   cd /home/elmigguel/BillHaven/server
   node index.js &
   sleep 2
   curl http://localhost:3001/health | jq
   ```

## Render Environment Variables

Your current Render environment variables (these are correct, don't change them):

```
VITE_SUPABASE_URL = https://bldjdctgjhtucyxqhwpc.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah
VITE_OPENNODE_API_KEY = e88ab3b3-f11d-44ad-b6c2-fec8fd79a9ae
```

The fixed code now handles the `VITE_` prefix automatically!

## Success Indicators

You'll know it's working when you see in Render logs:
```
✅ Environment variables validated successfully
✅ Supabase client initialized: { url: 'https://bldjdctgjhtucyxqhwpc.s...', keyLength: 208 }
BillHaven Backend Server running on port 3001
```

And the health endpoint returns:
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

## Next Steps After Fix

1. ✅ Backend working
2. Test webhook endpoints:
   - Stripe webhook: `POST https://billhaven.onrender.com/webhooks/stripe`
   - OpenNode webhook: `POST https://billhaven.onrender.com/webhooks/opennode`
3. Test payment creation:
   - `POST https://billhaven.onrender.com/api/create-payment-intent`
   - `POST https://billhaven.onrender.com/api/create-lightning-invoice`

## Rollback Plan

If something goes wrong:
```bash
git log --oneline -3
git revert HEAD
git push origin main
```

Or use Render dashboard:
1. Go to "Deploys" tab
2. Find previous working deploy
3. Click "Redeploy"

---

**Status**: Ready to deploy! 🚀
**Time**: 5 minutes total
**Risk**: Low (backward compatible)
