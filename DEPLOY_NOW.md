# 🚀 DEPLOY IN 5 MINUTEN

## OPTIE 1: Render.com (MAKKELIJKST - Gratis)

### Stap 1: Ga naar Render
1. Open: https://render.com
2. Sign up met GitHub

### Stap 2: Deploy
1. Klik: "New +" → "Web Service"
2. Connect je GitHub repo: BillHaven
3. Settings:
   - Name: billhaven-backend
   - Root Directory: server
   - Build Command: npm install
   - Start Command: node index.js

### Stap 3: Environment Variables
Klik "Environment" en voeg toe:

```
STRIPE_SECRET_KEY = sk_test_REDACTED

STRIPE_WEBHOOK_SECRET = whsec_b0v3xwHp93Z3Ecgr8Cg8wuHSiZ4fI9Ah

VITE_OPENNODE_API_KEY = e88ab3b3-f11d-44ad-b6c2-fec8fd79a9ae

VITE_SUPABASE_URL = https://bldjdctgjhtucyxqhwpc.supabase.co

VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZGpkY3Rnamh0dWN5eHFod3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjQsImV4cCI6MjA3OTkwMjUyNH0.lNCn_6yyK5gQ_06XrP96vp8R7g93UAtiiqIjrYng3hw

NODE_ENV = production

FRONTEND_URL = https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
```

### Stap 4: Deploy!
Klik "Create Web Service" - Klaar in 2-3 minuten!

Je krijgt een URL zoals: https://billhaven-backend.onrender.com

---

## Stap 5: Update Stripe Webhook
1. Ga naar: https://dashboard.stripe.com/test/webhooks
2. Klik op je endpoint
3. Update URL naar: https://billhaven-backend.onrender.com/webhooks/stripe
4. Save!

---

## Test Health Check
Open in browser: https://billhaven-backend.onrender.com/health

Je moet zien:
```json
{"status":"ok","timestamp":"..."}
```

KLAAR! 🎉
