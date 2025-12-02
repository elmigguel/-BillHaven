# BillHaven API Documentation

> **Complete reference for the BillHaven backend API**

This document covers all API endpoints, webhooks, authentication, and error handling for the BillHaven backend server.

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
6. [Webhook Endpoints](#webhook-endpoints)
7. [Error Handling](#error-handling)
8. [Request/Response Examples](#requestresponse-examples)

---

## Overview

The BillHaven backend is an Express.js server that handles:
- Payment intent creation (Stripe)
- Lightning invoice generation (OpenNode)
- Webhook processing (Stripe + OpenNode)
- Database operations (Supabase)
- Health monitoring

**Tech Stack:**
- Express 5.2.0
- Stripe SDK 20.0.0
- Supabase Client 2.86.0
- Node.js 22.21.1

---

## Base URL

**Production:**
```
https://billhaven-production.up.railway.app
```

**Development:**
```
http://localhost:3001
```

All endpoints are relative to the base URL.

---

## Authentication

### Public Endpoints

These endpoints require **no authentication**:
- `GET /health` - Health check
- `POST /webhooks/stripe` - Stripe webhook (signature verified)
- `POST /webhooks/opennode` - OpenNode webhook (signature verified)

### Protected Endpoints

These endpoints require **authentication** via one of:

1. **Supabase Auth Token** (preferred for user-initiated requests)
   ```http
   Authorization: Bearer <supabase-jwt-token>
   ```

2. **API Key** (for server-to-server calls)
   ```http
   X-API-Key: <your-api-key>
   ```

**Example Request:**
```bash
curl -X POST https://billhaven-production.up.railway.app/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"amount": 100, "currency": "EUR", "billId": "123"}'
```

---

## Rate Limiting

All payment-related endpoints are rate-limited:

- **Limit:** 30 requests per minute per IP address
- **Window:** 60 seconds
- **Response on Limit:** `429 Too Many Requests`

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1701388800
```

**Rate-Limited Endpoints:**
- `POST /api/create-payment-intent`
- `POST /api/create-lightning-invoice`

---

## API Endpoints

### 1. Health Check

Get server status and service health.

**Endpoint:** `GET /health`

**Authentication:** None required

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T10:30:00.000Z",
  "services": {
    "supabase": "ok",
    "stripe": "ok",
    "opennode": "ok"
  },
  "errors": {}
}
```

**Status Codes:**
- `200 OK` - All services operational
- `503 Service Unavailable` - One or more services down

**Service Status Values:**
- `"ok"` - Service is operational
- `"error"` - Service has errors (details in `errors` object)
- `"degraded"` - Service is slow but functional

**Example Request:**
```bash
curl https://billhaven-production.up.railway.app/health
```

---

### 2. Create Payment Intent (Stripe)

Create a Stripe PaymentIntent for credit card, iDEAL, SEPA, etc.

**Endpoint:** `POST /api/create-payment-intent`

**Authentication:** Required (Supabase JWT or API Key)

**Rate Limit:** 30 req/min

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "EUR",
  "billId": "abc123",
  "paymentMethod": "IDEAL"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | Number | Yes | Amount in currency units (e.g., 100.50 EUR) |
| `currency` | String | Yes | ISO 4217 currency code (EUR, USD, GBP) |
| `billId` | String | Yes | Unique bill identifier |
| `paymentMethod` | String | Yes | Payment method: IDEAL, SEPA, CREDIT_CARD, BANCONTACT, SOFORT, KLARNA, GOOGLE_PAY |

**Response:**
```json
{
  "clientSecret": "pi_3ABC123_secret_XYZ789",
  "paymentIntentId": "pi_3ABC123"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `clientSecret` | String | Client secret for Stripe.js confirmation |
| `paymentIntentId` | String | Unique PaymentIntent ID for tracking |

**Error Response:**
```json
{
  "error": "Invalid payment method"
}
```

**Status Codes:**
- `200 OK` - PaymentIntent created successfully
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid authentication
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Stripe API error

**Example Request:**
```bash
curl -X POST https://billhaven-production.up.railway.app/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <supabase-jwt>" \
  -d '{
    "amount": 100.50,
    "currency": "EUR",
    "billId": "bill_abc123",
    "paymentMethod": "IDEAL"
  }'
```

**Supported Payment Methods:**
- `CREDIT_CARD` - All major credit cards (Visa, Mastercard, Amex)
- `IDEAL` - Netherlands bank transfer (instant)
- `SEPA` - SEPA Direct Debit (2-5 business days)
- `BANCONTACT` - Belgium bank transfer (instant)
- `SOFORT` - Germany/Austria bank transfer (instant)
- `KLARNA` - Buy now, pay later
- `GOOGLE_PAY` - Google Pay
- `APPLE_PAY` - Apple Pay (requires domain verification)

---

### 3. Create Lightning Invoice (OpenNode)

Create a Bitcoin Lightning Network invoice for instant payments.

**Endpoint:** `POST /api/create-lightning-invoice`

**Authentication:** Required

**Rate Limit:** 30 req/min

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "SATS",
  "billId": "abc123",
  "description": "BillHaven Payment - Bill #abc123"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | Number | Yes | Amount in specified currency |
| `currency` | String | Yes | Currency: SATS, BTC, EUR, USD |
| `billId` | String | Yes | Unique bill identifier |
| `description` | String | No | Invoice description (max 200 chars) |

**Response:**
```json
{
  "id": "charge_abc123",
  "lightning_invoice": {
    "payreq": "lnbc10u1p...",
    "expires_at": "2025-12-02T11:00:00.000Z"
  },
  "hosted_checkout_url": "https://checkout.opennode.com/abc123",
  "qr_code_url": "https://api.opennode.com/v1/qr/abc123.png"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Charge ID for tracking |
| `lightning_invoice.payreq` | String | BOLT11 invoice (lightning:...) |
| `lightning_invoice.expires_at` | String | Invoice expiration (15 min) |
| `hosted_checkout_url` | String | OpenNode checkout page |
| `qr_code_url` | String | QR code image URL |

**Status Codes:**
- `200 OK` - Invoice created successfully
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Invalid OpenNode API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - OpenNode API error

**Example Request:**
```bash
curl -X POST https://billhaven-production.up.railway.app/api/create-lightning-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <supabase-jwt>" \
  -d '{
    "amount": 10000,
    "currency": "SATS",
    "billId": "bill_abc123",
    "description": "Lightning payment for Bill #abc123"
  }'
```

**Currency Options:**
- `SATS` - Bitcoin Satoshis (1 BTC = 100M sats)
- `BTC` - Bitcoin
- `EUR` - Euros (converted to BTC at current rate)
- `USD` - US Dollars (converted to BTC at current rate)

**Invoice Expiration:**
- Lightning invoices expire after **15 minutes**
- User must pay before expiration
- Expired invoices cannot be paid

---

## Webhook Endpoints

Webhooks are used by payment providers to notify the backend of payment status changes.

### 1. Stripe Webhook

Receives payment confirmation events from Stripe.

**Endpoint:** `POST /webhooks/stripe`

**Authentication:** Signature verification (automatic)

**Headers:**
```http
stripe-signature: t=1234567890,v1=abc123...
Content-Type: application/json
```

**Webhook Events Handled:**
| Event | Description | Action |
|-------|-------------|--------|
| `payment_intent.succeeded` | Payment completed successfully | Update bill status to `payment_confirmed` |
| `payment_intent.payment_failed` | Payment failed | Update bill status to `payment_failed` |
| `charge.dispute.created` | Customer disputed charge | Create dispute record, notify admin |
| `charge.refunded` | Payment refunded | Update bill status to `refunded` |

**Event Payload Example:**
```json
{
  "id": "evt_abc123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3ABC123",
      "amount": 10050,
      "currency": "eur",
      "status": "succeeded",
      "metadata": {
        "billId": "bill_abc123",
        "platform": "BillHaven"
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Status Codes:**
- `200 OK` - Event processed successfully
- `400 Bad Request` - Invalid signature
- `500 Internal Server Error` - Processing error

**Security:**
- **Signature Verification:** All webhooks are verified using `STRIPE_WEBHOOK_SECRET`
- **Replay Protection:** Stripe includes timestamp in signature
- **IP Whitelisting:** Optional (Stripe IPs: 3.18.12.63, 3.130.192.231, etc.)

**Testing Webhooks:**
```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to localhost:3001/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

### 2. OpenNode Webhook

Receives Lightning payment confirmation from OpenNode.

**Endpoint:** `POST /webhooks/opennode`

**Authentication:** HMAC-SHA256 signature verification

**Headers:**
```http
x-opennode-signature: abc123def456...
Content-Type: application/json
```

**Webhook Events:**
| Event | Status Value | Description |
|-------|-------------|-------------|
| Payment Successful | `paid` | Lightning payment completed |
| Payment Processing | `processing` | Payment received, confirming |
| Payment Underpaid | `underpaid` | Insufficient amount paid |
| Payment Expired | `expired` | Invoice expired unpaid |

**Event Payload:**
```json
{
  "id": "charge_abc123",
  "status": "paid",
  "hashed_order": "bill_abc123",
  "callback_url": "https://billhaven.app/payment/callback",
  "amount": 10000,
  "currency": "SATS",
  "paid_at": "2025-12-02T10:30:00.000Z"
}
```

**Response:**
```json
{
  "received": true
}
```

**Status Codes:**
- `200 OK` - Event processed
- `401 Unauthorized` - Invalid or missing signature
- `500 Internal Server Error` - Processing error

**Security:**
- **HMAC Verification:** Signature verified using `OPENNODE_API_KEY`
- **Timing-Safe Comparison:** Prevents timing attacks
- **Payload Integrity:** Entire payload is hashed

**Signature Verification Algorithm:**
```javascript
const expectedSignature = crypto
  .createHmac('sha256', OPENNODE_API_KEY)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

## Error Handling

### Standard Error Response

All endpoints return errors in this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "parameter_name",
    "issue": "Specific issue description"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (duplicate) |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 502 | `BAD_GATEWAY` | External API error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily down |

### Error Examples

**Invalid Payment Method:**
```json
{
  "error": "Invalid payment method",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "paymentMethod",
    "issue": "Must be one of: IDEAL, CREDIT_CARD, SEPA, BANCONTACT, SOFORT"
  }
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 42
  }
}
```

**Webhook Signature Invalid:**
```json
{
  "error": "Webhook signature verification failed",
  "code": "UNAUTHORIZED"
}
```

---

## Request/Response Examples

### Example 1: Create iDEAL Payment

**Request:**
```bash
curl -X POST https://billhaven-production.up.railway.app/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "amount": 50.00,
    "currency": "EUR",
    "billId": "bill_20251202_001",
    "paymentMethod": "IDEAL"
  }'
```

**Response (200 OK):**
```json
{
  "clientSecret": "pi_3OFx4L2eZvKYlo2C0HpzR5zf_secret_JpBxQPT9rH8eG5l4F0Qz3Qx1",
  "paymentIntentId": "pi_3OFx4L2eZvKYlo2C0HpzR5zf"
}
```

**Frontend Usage:**
```javascript
// Use clientSecret with Stripe.js
const { error } = await stripe.confirmIdealPayment(clientSecret, {
  payment_method: {
    ideal: {
      bank: 'ing' // User selects bank
    }
  },
  return_url: 'https://billhaven.app/payment/success'
});
```

---

### Example 2: Create Lightning Invoice

**Request:**
```bash
curl -X POST https://billhaven-production.up.railway.app/api/create-lightning-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "amount": 50000,
    "currency": "SATS",
    "billId": "bill_20251202_002",
    "description": "Coffee payment via Lightning"
  }'
```

**Response (200 OK):**
```json
{
  "id": "charge_6f3a8d2b",
  "lightning_invoice": {
    "payreq": "lnbc500u1pjkq2z2pp5xc7k5m9ykv3w3gu8dq...",
    "expires_at": "2025-12-02T10:45:00.000Z"
  },
  "hosted_checkout_url": "https://checkout.opennode.com/charge_6f3a8d2b",
  "qr_code_url": "https://api.opennode.com/v1/qr/charge_6f3a8d2b.png"
}
```

**Frontend Usage:**
```javascript
// Display QR code
<img src={response.qr_code_url} alt="Lightning Invoice" />

// Or redirect to hosted checkout
window.location.href = response.hosted_checkout_url;

// Or show BOLT11 invoice for wallet apps
<input value={response.lightning_invoice.payreq} readOnly />
```

---

### Example 3: Handle Stripe Webhook

**Webhook Request from Stripe:**
```http
POST /webhooks/stripe
stripe-signature: t=1701432000,v1=abc123def456...
Content-Type: application/json

{
  "id": "evt_abc123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3ABC123",
      "amount": 5000,
      "currency": "eur",
      "status": "succeeded",
      "metadata": {
        "billId": "bill_20251202_001",
        "platform": "BillHaven"
      }
    }
  }
}
```

**Backend Processing:**
1. Verify signature using `STRIPE_WEBHOOK_SECRET`
2. Extract `billId` from `metadata`
3. Query Supabase for bill record
4. Update bill status to `payment_confirmed`
5. Calculate hold period based on payment method and trust level
6. Schedule release after hold period
7. Send confirmation email (if configured)

**Response:**
```json
{
  "received": true
}
```

---

### Example 4: Handle OpenNode Webhook

**Webhook Request from OpenNode:**
```http
POST /webhooks/opennode
x-opennode-signature: abc123def456789...
Content-Type: application/json

{
  "id": "charge_6f3a8d2b",
  "status": "paid",
  "hashed_order": "bill_20251202_002",
  "amount": 50000,
  "currency": "SATS",
  "paid_at": "2025-12-02T10:35:00.000Z"
}
```

**Backend Processing:**
1. Verify HMAC signature using `OPENNODE_API_KEY`
2. Extract bill ID from `hashed_order`
3. Update bill status to `completed` (Lightning = instant)
4. No hold period for Lightning payments
5. Release funds immediately

**Response:**
```json
{
  "received": true
}
```

---

## Environment Variables

Required environment variables for the backend:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenNode
OPENNODE_API_KEY=your-api-key

# Supabase
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Server (optional)
PORT=3001
SERVER_URL=https://billhaven-production.up.railway.app
FRONTEND_URL=https://billhaven.app
```

---

## Testing

### Test Stripe Payments

Use Stripe test cards:

```
Success: 4242 4242 4242 4242
3DS Required: 4000 0027 6000 3184
Declined: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Test Lightning Payments

Use OpenNode test mode:

1. Set `OPENNODE_API_KEY` to test API key
2. Create invoice
3. Use Lightning test wallet (e.g., BlueWallet testnet)
4. Pay invoice
5. Verify webhook received

### Test Webhooks Locally

**Stripe:**
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**OpenNode:**
```bash
# Use ngrok to expose local server
ngrok http 3001

# Add ngrok URL to OpenNode dashboard
https://abc123.ngrok.io/webhooks/opennode
```

---

## Support

For API support:

- **Email:** dev@billhaven.com
- **Documentation:** [https://docs.billhaven.com](https://docs.billhaven.com)
- **Discord:** [https://discord.gg/billhaven](https://discord.gg/billhaven)
- **Status Page:** [https://status.billhaven.com](https://status.billhaven.com)

---

**API Documentation Version:** 1.0
**Last Updated:** 2025-12-02
**Backend Version:** 1.0.0
