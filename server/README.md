# BillHaven Backend Server

Express.js backend server handling webhooks and API endpoints for BillHaven payment platform.

## Features

- **Stripe Webhooks**: Secure webhook handling with signature verification
- **OpenNode Webhooks**: Lightning Network payment confirmations with HMAC verification
- **Payment Intent API**: Create Stripe PaymentIntents for multiple payment methods
- **Lightning Invoice API**: Create Lightning Network invoices via OpenNode
- **Health Checks**: Comprehensive service status monitoring
- **Rate Limiting**: Built-in rate limiting (30 req/min per IP)
- **Security**: Non-root Docker user, webhook signature verification, CORS protection

## Payment Methods Supported

### Stripe
- Credit/Debit Cards
- iDEAL (Netherlands)
- SEPA Direct Debit
- Bancontact (Belgium)
- SOFORT (Europe)
- Klarna (Buy Now Pay Later)
- Google Pay
- Alipay
- Revolut Pay

### Cryptocurrency
- Bitcoin Lightning Network (via OpenNode)
- Bitcoin on-chain (via OpenNode)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start server (with auto-reload)
npm run dev

# Test health endpoint
npm test
```

### Production

```bash
# Install production dependencies
npm ci --only=production

# Start server
npm start
```

## API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T12:00:00.000Z",
  "services": {
    "supabase": "ok",
    "stripe": "ok",
    "opennode": "ok"
  }
}
```

### Create Payment Intent
```http
POST /api/create-payment-intent
Content-Type: application/json

{
  "amount": 100.50,
  "currency": "EUR",
  "billId": "bill_123",
  "paymentMethod": "IDEAL"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Create Lightning Invoice
```http
POST /api/create-lightning-invoice
Content-Type: application/json

{
  "amount": 100.50,
  "currency": "EUR",
  "billId": "bill_123",
  "description": "Payment for Bill #123"
}
```

**Response:**
```json
{
  "invoiceId": "charge_xxx",
  "lightningInvoice": "lnbc...",
  "btcAddress": "bc1q...",
  "amount": 100.50,
  "expiresAt": "2025-12-02T13:00:00Z"
}
```

### Webhooks

#### Stripe Webhook
```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=xxx,v1=xxx
```

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`
- `charge.refunded`

#### OpenNode Webhook
```http
POST /webhooks/opennode
Content-Type: application/json
X-OpenNode-Signature: xxx
```

**Statuses Handled:**
- `paid` - Payment successful
- `processing` - Payment processing
- `underpaid` - Insufficient payment
- `expired` - Invoice expired

## Environment Variables

See `.env.example` for all required variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ |
| `VITE_OPENNODE_API_KEY` | OpenNode API key | ✅ |
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `PORT` | Server port (default: 3001) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |
| `SERVER_URL` | Backend URL for webhooks | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | ❌ |

## Docker

### Build Image

```bash
npm run docker:build
```

### Run Container

```bash
npm run docker:run
```

### Manual Docker Commands

```bash
# Build
docker build -t billhaven-backend .

# Run with environment variables
docker run -p 3001:3001 \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -e VITE_SUPABASE_URL=https://... \
  -e VITE_SUPABASE_ANON_KEY=eyJ... \
  -e VITE_OPENNODE_API_KEY=... \
  billhaven-backend

# Run with .env file
docker run -p 3001:3001 --env-file ../.env billhaven-backend
```

## Railway Deployment

1. Push code to GitHub
2. Create new project on [Railway.app](https://railway.app)
3. Connect GitHub repository
4. Railway auto-detects `railway.json` configuration
5. Add environment variables in Railway dashboard
6. Deploy

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed guide.

## Security Features

### Webhook Verification
- **Stripe**: Signature verification using `stripe.webhooks.constructEvent()`
- **OpenNode**: HMAC SHA256 signature verification with timing-safe comparison

### Rate Limiting
- 30 requests per minute per IP address
- Applies to all API endpoints (not webhooks)
- Returns 429 status code when exceeded

### CORS Protection
- Whitelist of allowed origins
- Credentials support enabled
- Pre-flight request handling

### Docker Security
- Non-root user (`nodejs`)
- Minimal Alpine Linux base image
- Multi-stage build for smaller image size
- Health check monitoring

## Logging

The server logs to console (stdout):

```bash
# View logs in production
railway logs  # Railway
docker logs <container_id>  # Docker

# Filter logs
railway logs --filter="error"
docker logs <container_id> 2>&1 | grep ERROR
```

## Monitoring

### Health Check Endpoint

Monitor all services with `/health` endpoint:

```bash
curl https://your-backend.railway.app/health
```

**Service Status:**
- `ok` - Service is healthy
- `error` - Service is down or misconfigured
- `degraded` - Some services are unavailable

### Recommended Monitoring

Set up uptime monitoring with:
- [UptimeRobot](https://uptimerobot.com/) (free)
- [Cronitor](https://cronitor.io/)
- Railway built-in monitoring

## Troubleshooting

### Webhook Signature Verification Fails

**Stripe:**
```
Error: Webhook signature verification failed
```

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Get secret from: https://dashboard.stripe.com/webhooks
3. Ensure raw body is preserved (express.raw middleware)

**OpenNode:**
```
Error: Invalid signature
```

**Solution:**
1. Verify `VITE_OPENNODE_API_KEY` is correct
2. Check signature is in `X-OpenNode-Signature` header
3. Ensure payload is not modified before verification

### Database Connection Fails

```
Error: Supabase connection failed
```

**Solution:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check Supabase project is active
3. Verify network connectivity

### Rate Limit Hit

```
429 Too Many Requests
```

**Solution:**
- Wait 60 seconds for rate limit to reset
- Increase `RATE_LIMIT_MAX` if needed (in code)
- Use separate API keys for high-volume clients

## Testing Webhooks Locally

### Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Listen for webhooks
stripe listen --forward-to localhost:3001/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### OpenNode Testing

```bash
# Create test charge
curl -X POST https://api.opennode.com/v1/charges \
  -H "Authorization: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "currency": "EUR",
    "callback_url": "http://localhost:3001/webhooks/opennode"
  }'
```

## Performance

- **Response Time**: < 50ms average
- **Throughput**: 100+ req/sec
- **Memory**: ~50MB baseline
- **CPU**: < 5% idle, < 30% under load

## Support

For issues or questions:
- Check [DEPLOYMENT.md](../DEPLOYMENT.md) for deployment help
- Review Railway logs for errors
- Test endpoints with health check
- Verify environment variables are set

## License

Private - BillHaven Platform
