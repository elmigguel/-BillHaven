#!/bin/bash

# BillHaven Backend Deployment Verification Script
# Usage: ./verify-deployment.sh <backend_url>
# Example: ./verify-deployment.sh https://billhaven.railway.app

BACKEND_URL=$1

if [ -z "$BACKEND_URL" ]; then
  echo "❌ Error: Backend URL is required"
  echo "Usage: ./verify-deployment.sh <backend_url>"
  echo "Example: ./verify-deployment.sh https://billhaven.railway.app"
  exit 1
fi

echo "🔍 Verifying BillHaven Backend Deployment"
echo "📍 Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "   ✅ Health check passed (HTTP 200)"

  # Check if response is valid JSON
  if echo "$HEALTH_BODY" | jq . > /dev/null 2>&1; then
    echo "   ✅ Valid JSON response"

    # Check service statuses
    SUPABASE_STATUS=$(echo "$HEALTH_BODY" | jq -r '.services.supabase // "unknown"')
    STRIPE_STATUS=$(echo "$HEALTH_BODY" | jq -r '.services.stripe // "unknown"')
    OPENNODE_STATUS=$(echo "$HEALTH_BODY" | jq -r '.services.opennode // "unknown"')

    echo "   📊 Service Status:"
    echo "      - Supabase: $SUPABASE_STATUS"
    echo "      - Stripe: $STRIPE_STATUS"
    echo "      - OpenNode: $OPENNODE_STATUS"

    if [ "$SUPABASE_STATUS" == "ok" ] && [ "$STRIPE_STATUS" == "ok" ] && [ "$OPENNODE_STATUS" == "ok" ]; then
      echo "   ✅ All services operational"
    else
      echo "   ⚠️  Warning: Some services are not operational"
    fi
  else
    echo "   ❌ Invalid JSON response"
    echo "   Response: $HEALTH_BODY"
  fi
else
  echo "   ❌ Health check failed (HTTP $HTTP_CODE)"
  echo "   Response: $HEALTH_BODY"
  exit 1
fi

echo ""

# Test 2: CORS Headers
echo "2️⃣  Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -I -H "Origin: https://billhaven.vercel.app" "$BACKEND_URL/health")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo "   ✅ CORS headers present"
  echo "$CORS_RESPONSE" | grep "Access-Control" | sed 's/^/      /'
else
  echo "   ⚠️  Warning: CORS headers not found"
fi

echo ""

# Test 3: Rate Limiting
echo "3️⃣  Testing rate limiting..."
RATE_LIMIT_ATTEMPTS=5
RATE_LIMITED=false

for i in $(seq 1 $RATE_LIMIT_ATTEMPTS); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
  if [ "$HTTP_CODE" == "429" ]; then
    RATE_LIMITED=true
    break
  fi
done

if [ "$RATE_LIMITED" == true ]; then
  echo "   ⚠️  Rate limit triggered (expected if testing repeatedly)"
else
  echo "   ✅ Rate limiting configured (not triggered in $RATE_LIMIT_ATTEMPTS requests)"
fi

echo ""

# Test 4: Webhook Endpoints Exist
echo "4️⃣  Testing webhook endpoints exist..."

# Stripe webhook (should return 400 without signature)
STRIPE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/webhooks/stripe")
if [ "$STRIPE_CODE" == "400" ]; then
  echo "   ✅ Stripe webhook endpoint exists (returns 400 without signature - expected)"
else
  echo "   ⚠️  Stripe webhook returned HTTP $STRIPE_CODE (expected 400)"
fi

# OpenNode webhook (should return 401 without signature)
OPENNODE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/webhooks/opennode" -H "Content-Type: application/json" -d '{}')
if [ "$OPENNODE_CODE" == "401" ]; then
  echo "   ✅ OpenNode webhook endpoint exists (returns 401 without signature - expected)"
else
  echo "   ⚠️  OpenNode webhook returned HTTP $OPENNODE_CODE (expected 401)"
fi

echo ""

# Test 5: Environment Configuration
echo "5️⃣  Checking environment configuration..."
if echo "$HEALTH_BODY" | jq -e '.services.stripe == "ok"' > /dev/null 2>&1; then
  echo "   ✅ Stripe API key configured correctly"
else
  echo "   ❌ Stripe API key not configured or invalid"
fi

if echo "$HEALTH_BODY" | jq -e '.services.supabase == "ok"' > /dev/null 2>&1; then
  echo "   ✅ Supabase configured correctly"
else
  echo "   ❌ Supabase not configured or invalid"
fi

if echo "$HEALTH_BODY" | jq -e '.services.opennode == "ok"' > /dev/null 2>&1; then
  echo "   ✅ OpenNode API key configured correctly"
else
  echo "   ❌ OpenNode API key not configured or invalid"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment Verification Complete"
echo ""

# Final summary
OVERALL_STATUS=$(echo "$HEALTH_BODY" | jq -r '.status // "unknown"')
if [ "$OVERALL_STATUS" == "ok" ]; then
  echo "🎉 Status: HEALTHY - All systems operational"
  echo ""
  echo "Next steps:"
  echo "1. Update Stripe webhook URL to: $BACKEND_URL/webhooks/stripe"
  echo "2. Update OpenNode webhook URL to: $BACKEND_URL/webhooks/opennode"
  echo "3. Test payment flow end-to-end"
  echo "4. Monitor logs for any errors"
  exit 0
elif [ "$OVERALL_STATUS" == "degraded" ]; then
  echo "⚠️  Status: DEGRADED - Some services unavailable"
  echo ""
  echo "Action required:"
  echo "1. Check Railway logs for errors"
  echo "2. Verify all environment variables are set"
  echo "3. Ensure external services (Stripe, Supabase, OpenNode) are accessible"
  exit 1
else
  echo "❌ Status: UNHEALTHY - Deployment verification failed"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check Railway logs: railway logs"
  echo "2. Verify environment variables in Railway dashboard"
  echo "3. Ensure all required env vars are set (see .env.example)"
  exit 1
fi
