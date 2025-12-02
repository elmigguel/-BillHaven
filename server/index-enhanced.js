/**
 * BillHaven Backend Server - Production-Ready Version
 * Handles webhooks for Stripe and OpenNode payment confirmations
 *
 * PRODUCTION ENHANCEMENTS:
 * - Helmet.js security headers
 * - Request ID tracking for logs
 * - Structured JSON logging
 * - Enhanced health checks with detailed diagnostics
 * - Rate limiting with cleanup
 * - Sensitive data filtering
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import crypto from 'crypto';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// REQUEST ID MIDDLEWARE (for log tracing)
// ==========================================
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function requestIdMiddleware(req, res, next) {
  req.id = generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
}

// ==========================================
// LOGGING UTILITY (production-safe)
// ==========================================
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
      requestId: meta.requestId || 'no-request-id'
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
      requestId: meta.requestId || 'no-request-id'
    }));
  },
  error: (message, meta = {}) => {
    // Filter sensitive data from logs
    const sanitizedMeta = { ...meta };
    delete sanitizedMeta.apiKey;
    delete sanitizedMeta.secret;
    delete sanitizedMeta.privateKey;
    delete sanitizedMeta.password;

    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...sanitizedMeta,
      requestId: meta.requestId || 'no-request-id'
    }));
  }
};

// ==========================================
// RATE LIMITER (in-memory with cleanup)
// ==========================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return next();
  }

  const record = rateLimitMap.get(ip);
  if (now - record.startTime > RATE_LIMIT_WINDOW) {
    record.count = 1;
    record.startTime = now;
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    logger.warn('Rate limit exceeded', { requestId: req.id, ip });
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  record.count++;
  next();
}

// Cleanup rate limiter every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW * 5) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================
// Try multiple paths for different deployment environments
dotenv.config({ path: '../.env' }); // Local development
dotenv.config(); // Default (checks .env in current directory and parent directories)

// Helper function to get env var with or without VITE_ prefix
function getEnvVar(name) {
  return process.env[name] || process.env[`VITE_${name}`] || null;
}

// Set normalized env vars (without VITE_ prefix for backend)
process.env.SUPABASE_URL = getEnvVar('SUPABASE_URL');
process.env.SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');
process.env.OPENNODE_API_KEY = getEnvVar('OPENNODE_API_KEY');

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'OPENNODE_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const MISSING_ENV_VARS = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);

if (MISSING_ENV_VARS.length > 0) {
  logger.error('Missing required environment variables', { missing: MISSING_ENV_VARS });
  process.exit(1);
}

// Validate webhook secret format (Stripe webhook secrets start with whsec_)
if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
  logger.warn('STRIPE_WEBHOOK_SECRET does not start with "whsec_" - might not be valid');
}

logger.info('Environment variables validated successfully');

// ==========================================
// EXPRESS APP SETUP
// ==========================================
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

logger.info('Services initialized', {
  supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
  environment: process.env.NODE_ENV || 'development'
});

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
// Helmet.js security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.opennode.com"],
    },
  },
  crossOriginEmbedderPolicy: !IS_PRODUCTION, // Disable in dev for easier testing
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
}));

// HTTPS enforcement (in production)
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

// Request ID tracking
app.use(requestIdMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress
    });
  });

  next();
});

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

// ==========================================
// WEBHOOK ROUTES (raw body required)
// ==========================================
// Stripe webhook needs raw body
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // SECURITY: Always require webhook signature verification
  if (!endpointSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured', { requestId: req.id });
    return res.status(500).json({ error: 'Webhook configuration error' });
  }

  try {
    // Verify webhook signature - REQUIRED for security
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    logger.info('Stripe webhook verified', { requestId: req.id, type: event.type });
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', {
      requestId: req.id,
      error: err.message
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object, req.id);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object, req.id);
      break;

    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object, req.id);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object, req.id);
      break;

    default:
      logger.info('Unhandled Stripe event type', { requestId: req.id, type: event.type });
  }

  res.json({ received: true });
});

// OpenNode webhook (Lightning payments) - with HMAC verification
app.post('/webhooks/opennode', express.json(), async (req, res) => {
  const { id, status } = req.body;
  const receivedSignature = req.headers['x-opennode-signature'];
  const apiKey = process.env.OPENNODE_API_KEY;

  // SECURITY: Verify OpenNode webhook signature - REQUIRED for production
  if (!apiKey) {
    logger.error('OPENNODE_API_KEY not configured', { requestId: req.id });
    return res.status(500).json({ error: 'Webhook configuration error - API key required' });
  }

  if (!receivedSignature) {
    logger.error('OpenNode webhook missing signature', { requestId: req.id });
    return res.status(401).json({ error: 'Missing signature' });
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const isValid = receivedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );

  if (!isValid) {
    logger.error('OpenNode webhook signature verification failed', { requestId: req.id });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  logger.info('OpenNode webhook received', { requestId: req.id, id, status });

  try {
    if (status === 'paid') {
      await handleLightningPaymentSuccess(id, req.body, req.id);
    } else if (status === 'processing') {
      logger.info('Lightning payment processing', { requestId: req.id, id });
    } else if (status === 'underpaid' || status === 'expired') {
      await handleLightningPaymentFailure(id, status, req.body, req.id);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('OpenNode webhook error', { requestId: req.id, error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ==========================================
// JSON PARSER FOR API ROUTES
// ==========================================
app.use(express.json());

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {},
    errors: {},
    performance: {}
  };

  // Check Supabase connection
  const supabaseStart = Date.now();
  try {
    const { data, error } = await supabase.from('bills').select('count', { count: 'exact', head: true });
    status.performance.supabase = `${Date.now() - supabaseStart}ms`;

    if (error) {
      logger.error('Supabase health check error', { requestId: req.id, error: error.message });
      status.services.supabase = 'error';
      status.errors.supabase = {
        message: error.message,
        code: error.code
      };
    } else {
      status.services.supabase = 'ok';
    }
  } catch (error) {
    status.performance.supabase = `${Date.now() - supabaseStart}ms`;
    logger.error('Supabase health check exception', { requestId: req.id, error: error.message });
    status.services.supabase = 'error';
    status.errors.supabase = {
      message: error.message
    };
  }

  // Check Stripe API
  const stripeStart = Date.now();
  try {
    await stripe.paymentIntents.list({ limit: 1 });
    status.performance.stripe = `${Date.now() - stripeStart}ms`;
    status.services.stripe = 'ok';
  } catch (error) {
    status.performance.stripe = `${Date.now() - stripeStart}ms`;
    logger.error('Stripe health check error', { requestId: req.id, error: error.message });
    status.services.stripe = 'error';
    status.errors.stripe = {
      message: error.message,
      type: error.type
    };
  }

  // Check OpenNode API
  const opennodeStart = Date.now();
  try {
    const response = await fetch('https://api.opennode.com/v1/currencies', {
      headers: {
        'Authorization': process.env.OPENNODE_API_KEY
      }
    });
    status.performance.opennode = `${Date.now() - opennodeStart}ms`;

    if (response.ok) {
      status.services.opennode = 'ok';
    } else {
      status.services.opennode = 'error';
      status.errors.opennode = {
        message: 'OpenNode API returned non-OK status',
        status: response.status
      };
    }
  } catch (error) {
    status.performance.opennode = `${Date.now() - opennodeStart}ms`;
    logger.error('OpenNode health check error', { requestId: req.id, error: error.message });
    status.services.opennode = 'error';
    status.errors.opennode = {
      message: error.message
    };
  }

  // Set overall status
  const allServicesOk = Object.values(status.services).every(s => s === 'ok');
  status.status = allServicesOk ? 'healthy' : 'degraded';
  status.performance.total = `${Date.now() - startTime}ms`;

  // Return appropriate HTTP status code
  const httpStatus = allServicesOk ? 200 : 503;
  res.status(httpStatus).json(status);
});

// ==========================================
// API ROUTES
// ==========================================
// Create Stripe PaymentIntent - with rate limiting
app.post('/api/create-payment-intent', rateLimit, async (req, res) => {
  try {
    const { amount, currency, billId, paymentMethod } = req.body;

    logger.info('Creating payment intent', {
      requestId: req.id,
      billId,
      amount,
      currency
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      payment_method_types: getPaymentMethodTypes(paymentMethod),
      metadata: {
        billId,
        platform: 'BillHaven'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('PaymentIntent creation error', {
      requestId: req.id,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// Create OpenNode Lightning invoice - with rate limiting
app.post('/api/create-lightning-invoice', rateLimit, async (req, res) => {
  try {
    const { amount, currency, billId, description } = req.body;

    logger.info('Creating lightning invoice', {
      requestId: req.id,
      billId,
      amount,
      currency
    });

    const response = await fetch('https://api.opennode.com/v1/charges', {
      method: 'POST',
      headers: {
        'Authorization': process.env.OPENNODE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: currency.toUpperCase(),
        description: description || `BillHaven Payment - Bill #${billId}`,
        order_id: billId,
        callback_url: `${process.env.SERVER_URL || 'http://localhost:3001'}/webhooks/opennode`,
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        auto_settle: false // Keep in BTC for immediate settlement
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OpenNode API error');
    }

    res.json({
      invoiceId: data.data.id,
      lightningInvoice: data.data.lightning_invoice.payreq,
      btcAddress: data.data.chain_invoice?.address,
      amount: data.data.amount,
      expiresAt: data.data.expires_at
    });
  } catch (error) {
    logger.error('Lightning invoice creation error', {
      requestId: req.id,
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function getPaymentMethodTypes(method) {
  switch (method) {
    case 'IDEAL':
      return ['ideal'];
    case 'SEPA':
      return ['sepa_debit'];
    case 'BANCONTACT':
      return ['bancontact'];
    case 'SOFORT':
      return ['sofort'];
    case 'KLARNA':
      return ['klarna'];
    case 'GOOGLE_PAY':
      return ['google_pay'];
    case 'ALIPAY':
      return ['alipay'];
    case 'REVOLUT_PAY':
      return ['revolut_pay'];
    case 'CREDIT_CARD':
      return ['card'];
    default:
      return ['card', 'ideal', 'sepa_debit', 'klarna', 'google_pay'];
  }
}

// ==========================================
// WEBHOOK HANDLERS
// ==========================================
async function handlePaymentSuccess(paymentIntent, requestId) {
  const billId = paymentIntent.metadata.billId;
  logger.info('Payment succeeded', { requestId, billId, paymentIntentId: paymentIntent.id });

  try {
    // Update bill status in Supabase
    const { error } = await supabase
      .from('bills')
      .update({
        payment_status: 'PAID',
        payment_id: paymentIntent.id,
        paid_at: new Date().toISOString()
      })
      .eq('id', billId);

    if (error) {
      logger.error('Failed to update bill status', { requestId, billId, error: error.message });
    }

    // Log the transaction
    await supabase.from('transactions').insert({
      bill_id: billId,
      type: 'PAYMENT_RECEIVED',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      provider: 'stripe',
      provider_id: paymentIntent.id,
      status: 'COMPLETED'
    });

  } catch (error) {
    logger.error('Error processing payment success', { requestId, billId, error: error.message });
  }
}

async function handlePaymentFailure(paymentIntent, requestId) {
  const billId = paymentIntent.metadata.billId;
  logger.warn('Payment failed', { requestId, billId, paymentIntentId: paymentIntent.id });

  try {
    await supabase
      .from('bills')
      .update({
        payment_status: 'FAILED',
        payment_error: paymentIntent.last_payment_error?.message
      })
      .eq('id', billId);

  } catch (error) {
    logger.error('Error processing payment failure', { requestId, billId, error: error.message });
  }
}

async function handleDisputeCreated(dispute, requestId) {
  logger.error('DISPUTE CREATED - CRITICAL', { requestId, disputeId: dispute.id });

  // This is CRITICAL - a chargeback has been initiated
  try {
    // Find the bill by payment_id
    const { data: bill } = await supabase
      .from('bills')
      .select('*')
      .eq('payment_id', dispute.payment_intent)
      .single();

    if (bill) {
      // FREEZE the escrow immediately
      await supabase
        .from('bills')
        .update({
          payment_status: 'DISPUTED',
          dispute_id: dispute.id,
          disputed_at: new Date().toISOString()
        })
        .eq('id', bill.id);

      logger.error('Escrow frozen due to dispute', {
        requestId,
        billId: bill.id,
        amount: dispute.amount / 100
      });

      // TODO: Send admin notification (email/Telegram)
    }
  } catch (error) {
    logger.error('Error handling dispute', { requestId, error: error.message });
  }
}

async function handleRefund(charge, requestId) {
  logger.info('Refund processed', { requestId, chargeId: charge.id });

  try {
    const { data: bill } = await supabase
      .from('bills')
      .select('*')
      .eq('payment_id', charge.payment_intent)
      .single();

    if (bill) {
      await supabase
        .from('bills')
        .update({
          payment_status: 'REFUNDED',
          refunded_at: new Date().toISOString()
        })
        .eq('id', bill.id);
    }
  } catch (error) {
    logger.error('Error handling refund', { requestId, error: error.message });
  }
}

async function handleLightningPaymentSuccess(chargeId, data, requestId) {
  const billId = data.order_id;
  logger.info('Lightning payment succeeded', { requestId, billId, chargeId });

  try {
    // Lightning payments are INSTANT and IRREVERSIBLE
    const { error } = await supabase
      .from('bills')
      .update({
        payment_status: 'PAID',
        payment_id: chargeId,
        paid_at: new Date().toISOString(),
        // Lightning = instant release (no hold period needed)
        can_release_at: new Date().toISOString()
      })
      .eq('id', billId);

    if (error) {
      logger.error('Failed to update bill status', { requestId, billId, error: error.message });
    }

    // Log the transaction
    await supabase.from('transactions').insert({
      bill_id: billId,
      type: 'LIGHTNING_PAYMENT_RECEIVED',
      amount: data.fiat_value,
      currency: 'BTC',
      provider: 'opennode',
      provider_id: chargeId,
      status: 'COMPLETED',
      metadata: {
        sats: data.amount,
        lightning_invoice: data.lightning_invoice?.payreq
      }
    });

  } catch (error) {
    logger.error('Error processing lightning payment', { requestId, billId, error: error.message });
  }
}

async function handleLightningPaymentFailure(chargeId, status, data, requestId) {
  const billId = data.order_id;
  logger.warn('Lightning payment failed', { requestId, billId, chargeId, status });

  try {
    await supabase
      .from('bills')
      .update({
        payment_status: status.toUpperCase(),
        payment_error: `Lightning payment ${status}`
      })
      .eq('id', billId);

  } catch (error) {
    logger.error('Error processing lightning payment failure', { requestId, billId, error: error.message });
  }
}

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.id,
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  logger.info('BillHaven Backend Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  console.log(`\n🚀 BillHaven Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Stripe webhook: POST /webhooks/stripe`);
  console.log(`⚡ OpenNode webhook: POST /webhooks/opennode\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
