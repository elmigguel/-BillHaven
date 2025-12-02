/**
 * BillHaven Backend Server
 * Handles webhooks for Stripe and OpenNode payment confirmations
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// ===========================================
// V4 ORACLE CONFIGURATION
// ===========================================
// The Oracle wallet signs payment verifications for the smart contract
// This must match the Oracle registered in the deployed V4 contract

const V4_CONTRACT_CONFIG = {
  // Polygon Mainnet
  chainId: 137,
  contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000', // UPDATE AFTER DEPLOY
  rpcUrl: 'https://polygon-rpc.com',

  // Oracle wallet - KEEP THIS SECRET!
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || null
};

// V4 Contract ABI (only the functions we need)
const V4_CONTRACT_ABI = [
  'function verifyPaymentReceived(uint256 _billId, bytes32 _paymentReference, uint256 _fiatAmount, uint256 _timestamp, bytes calldata _signature) external',
  'function getBill(uint256 _billId) external view returns (tuple(address billMaker, address payer, address token, uint256 amount, uint256 platformFee, uint256 fiatAmount, uint8 status, uint8 paymentMethod, bool payerConfirmed, bool oracleVerified, bool makerConfirmed, uint256 createdAt, uint256 fundedAt, uint256 paymentSentAt, uint256 verifiedAt, uint256 releaseTime, uint256 expiresAt, bytes32 paymentReference))'
];

// Simple in-memory rate limiter
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
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  record.count++;
  next();
}

// Load environment variables
// Try multiple paths for different deployment environments
dotenv.config({ path: '../.env' }); // Local development
dotenv.config(); // Default (checks .env in current directory and parent directories)

// ==========================================
// CRITICAL: Environment Variable Validation
// ==========================================
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
  console.error('\n❌ CRITICAL ERROR: Missing required environment variables:');
  MISSING_ENV_VARS.forEach(varName => {
    console.error(`   - ${varName} (or VITE_${varName})`);
  });
  console.error('\n📝 Please add these to your .env file (see .env.example for reference)\n');
  process.exit(1);
}

// Validate webhook secret format (Stripe webhook secrets start with whsec_)
if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
  console.warn('\n⚠️  WARNING: STRIPE_WEBHOOK_SECRET does not start with "whsec_"');
  console.warn('   This might not be a valid Stripe webhook secret.');
  console.warn('   Get the correct secret from: https://dashboard.stripe.com/webhooks\n');
}

console.log('✅ Environment variables validated successfully');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers with Helmet
// DEVELOPMENT: CSP disabled for Vite HMR (requires eval)
// PRODUCTION: Enable strict CSP via vercel.json
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false, // Allow embedding for payment iframes
}));

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('✅ Supabase client initialized:', {
  url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'MISSING',
  keyLength: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0
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

// Stripe webhook needs raw body
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // SECURITY: Always require webhook signature verification
  if (!endpointSecret) {
    console.error('CRITICAL: STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook configuration error' });
  }

  try {
    // Verify webhook signature - REQUIRED for security
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// OpenNode webhook (Lightning payments) - with HMAC verification
app.post('/webhooks/opennode', express.json(), async (req, res) => {
  const { id, status, hashed_order, callback_url } = req.body;
  const receivedSignature = req.headers['x-opennode-signature'];
  const apiKey = process.env.OPENNODE_API_KEY;

  // SECURITY: Verify OpenNode webhook signature - REQUIRED for production
  if (!apiKey) {
    console.error('CRITICAL: OPENNODE_API_KEY not configured for signature verification');
    return res.status(500).json({ error: 'Webhook configuration error - API key required' });
  }

  if (!receivedSignature) {
    console.error('OpenNode webhook missing signature header');
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
    console.error('OpenNode webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('OpenNode webhook received:', { id, status });

  try {
    if (status === 'paid') {
      await handleLightningPaymentSuccess(id, req.body);
    } else if (status === 'processing') {
      console.log('Lightning payment processing:', id);
    } else if (status === 'underpaid' || status === 'expired') {
      await handleLightningPaymentFailure(id, status, req.body);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('OpenNode webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// JSON parser for other routes
app.use(express.json());

// Health check endpoint with service status
app.get('/health', async (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
    errors: {}
  };

  // Check Supabase connection
  try {
    const { data, error } = await supabase.from('bills').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase health check error:', error);
      status.services.supabase = 'error';
      status.errors.supabase = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      };
    } else {
      status.services.supabase = 'ok';
    }
  } catch (error) {
    console.error('Supabase health check exception:', error);
    status.services.supabase = 'error';
    status.errors.supabase = {
      message: error.message,
      stack: error.stack
    };
  }

  // Check Stripe API
  try {
    await stripe.paymentIntents.list({ limit: 1 });
    status.services.stripe = 'ok';
  } catch (error) {
    console.error('Stripe health check error:', error);
    status.services.stripe = 'error';
    status.errors.stripe = {
      message: error.message,
      type: error.type,
      code: error.code
    };
  }

  // Check OpenNode API
  try {
    const response = await fetch('https://api.opennode.com/v1/currencies', {
      headers: {
        'Authorization': process.env.OPENNODE_API_KEY
      }
    });
    if (response.ok) {
      status.services.opennode = 'ok';
    } else {
      status.services.opennode = 'error';
      status.errors.opennode = {
        message: 'OpenNode API returned non-OK status',
        status: response.status,
        statusText: response.statusText
      };
    }
  } catch (error) {
    console.error('OpenNode health check error:', error);
    status.services.opennode = 'error';
    status.errors.opennode = {
      message: error.message
    };
  }

  // Set overall status
  const allServicesOk = Object.values(status.services).every(s => s === 'ok');
  status.status = allServicesOk ? 'ok' : 'degraded';

  res.json(status);
});

// Create Stripe PaymentIntent - with rate limiting
app.post('/api/create-payment-intent', rateLimit, async (req, res) => {
  try {
    const { amount, currency, billId, paymentMethod } = req.body;

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
    console.error('PaymentIntent creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create OpenNode Lightning invoice - with rate limiting
app.post('/api/create-lightning-invoice', rateLimit, async (req, res) => {
  try {
    const { amount, currency, billId, description } = req.body;

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
    console.error('Lightning invoice creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
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

async function handlePaymentSuccess(paymentIntent) {
  const billId = paymentIntent.metadata.billId;
  const onChainBillId = paymentIntent.metadata.onChainBillId; // V4: On-chain bill ID
  const paymentReference = paymentIntent.metadata.paymentReference; // V4: Payment reference bytes32

  console.log(`Payment succeeded for bill ${billId}:`, paymentIntent.id);

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
      console.error('Failed to update bill status:', error);
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

    // ===========================================
    // V4: AUTOMATIC ON-CHAIN VERIFICATION
    // ===========================================
    // This is the CRITICAL security step - verify payment on smart contract
    // Only the Oracle (backend) can do this, which starts the hold period
    if (onChainBillId && paymentReference) {
      console.log(`\n🔒 V4: Initiating on-chain payment verification...`);
      console.log(`   Supabase Bill ID: ${billId}`);
      console.log(`   On-Chain Bill ID: ${onChainBillId}`);
      console.log(`   Payment Reference: ${paymentReference}`);

      const fiatAmount = paymentIntent.amount; // Amount in cents
      const result = await verifyPaymentOnChainV4(
        parseInt(onChainBillId),
        paymentReference,
        fiatAmount
      );

      if (result.success) {
        // Update Supabase with on-chain verification status
        await supabase
          .from('bills')
          .update({
            onchain_verified: true,
            onchain_tx_hash: result.txHash,
            onchain_verified_at: new Date().toISOString()
          })
          .eq('id', billId);

        console.log(`✅ V4: On-chain verification complete - hold period started!`);
      } else {
        console.error(`❌ V4: On-chain verification failed: ${result.error}`);
        // Record the failure for manual review
        await supabase
          .from('bills')
          .update({
            onchain_verification_error: result.error,
            onchain_verification_failed_at: new Date().toISOString()
          })
          .eq('id', billId);
      }
    } else {
      console.log(`ℹ️  V4: No on-chain bill ID or payment reference - skipping smart contract verification`);
    }

  } catch (error) {
    console.error('Error processing payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  const billId = paymentIntent.metadata.billId;
  console.log(`Payment failed for bill ${billId}:`, paymentIntent.id);

  try {
    await supabase
      .from('bills')
      .update({
        payment_status: 'FAILED',
        payment_error: paymentIntent.last_payment_error?.message
      })
      .eq('id', billId);

  } catch (error) {
    console.error('Error processing payment failure:', error);
  }
}

async function handleDisputeCreated(dispute) {
  console.log('DISPUTE CREATED:', dispute.id);

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

      // Alert admin
      console.error(`ALERT: Dispute created for bill ${bill.id}, amount: ${dispute.amount / 100}`);

      // TODO: Send admin notification (email/Telegram)
    }
  } catch (error) {
    console.error('Error handling dispute:', error);
  }
}

async function handleRefund(charge) {
  console.log('Refund processed:', charge.id);

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
    console.error('Error handling refund:', error);
  }
}

async function handleLightningPaymentSuccess(chargeId, data) {
  const billId = data.order_id;
  console.log(`Lightning payment succeeded for bill ${billId}:`, chargeId);

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
      console.error('Failed to update bill status:', error);
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
    console.error('Error processing lightning payment:', error);
  }
}

async function handleLightningPaymentFailure(chargeId, status, data) {
  const billId = data.order_id;
  console.log(`Lightning payment ${status} for bill ${billId}:`, chargeId);

  try {
    await supabase
      .from('bills')
      .update({
        payment_status: status.toUpperCase(),
        payment_error: `Lightning payment ${status}`
      })
      .eq('id', billId);

  } catch (error) {
    console.error('Error processing lightning payment failure:', error);
  }
}

// ===========================================
// V4 ORACLE SIGNING FUNCTIONS
// ===========================================

/**
 * Creates an Oracle signature for V4 payment verification
 * This signature is used by the smart contract to verify payment was received
 *
 * @param {number} billId - On-chain bill ID
 * @param {string} payer - Payer wallet address
 * @param {string} billMaker - Bill maker wallet address
 * @param {number} fiatAmount - Fiat amount in cents
 * @param {string} paymentReference - Payment reference (bytes32)
 * @returns {Object} { signature, timestamp }
 */
async function createOracleSignatureV4(billId, payer, billMaker, fiatAmount, paymentReference) {
  if (!V4_CONTRACT_CONFIG.oraclePrivateKey) {
    throw new Error('ORACLE_PRIVATE_KEY not configured - cannot sign payment verification');
  }

  const wallet = new ethers.Wallet(V4_CONTRACT_CONFIG.oraclePrivateKey);
  const timestamp = Math.floor(Date.now() / 1000);

  // V4 signature format includes chainId and contract address to prevent replay attacks
  const messageHash = ethers.solidityPackedKeccak256(
    ['uint256', 'address', 'uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
    [
      V4_CONTRACT_CONFIG.chainId,
      V4_CONTRACT_CONFIG.contractAddress,
      billId,
      payer,
      billMaker,
      fiatAmount,
      paymentReference,
      timestamp
    ]
  );

  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  console.log(`🔏 V4 Oracle signature created for bill ${billId}`);
  console.log(`   Chain ID: ${V4_CONTRACT_CONFIG.chainId}`);
  console.log(`   Contract: ${V4_CONTRACT_CONFIG.contractAddress}`);
  console.log(`   Timestamp: ${timestamp}`);

  return { signature, timestamp };
}

/**
 * Calls verifyPaymentReceived on the V4 smart contract
 *
 * @param {number} billId - On-chain bill ID
 * @param {string} paymentReference - Payment reference (bytes32)
 * @param {number} fiatAmount - Fiat amount in cents
 * @returns {Object} { success, txHash, error }
 */
async function verifyPaymentOnChainV4(billId, paymentReference, fiatAmount) {
  if (!V4_CONTRACT_CONFIG.oraclePrivateKey) {
    console.warn('⚠️  V4 Oracle signing not configured - skipping on-chain verification');
    return { success: false, error: 'Oracle not configured' };
  }

  if (V4_CONTRACT_CONFIG.contractAddress === '0x0000000000000000000000000000000000000000') {
    console.warn('⚠️  V4 Contract address not set - skipping on-chain verification');
    return { success: false, error: 'Contract address not configured' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(V4_CONTRACT_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(V4_CONTRACT_CONFIG.oraclePrivateKey, provider);
    const contract = new ethers.Contract(V4_CONTRACT_CONFIG.contractAddress, V4_CONTRACT_ABI, wallet);

    // Get bill details from contract
    const bill = await contract.getBill(billId);

    if (!bill || bill.billMaker === '0x0000000000000000000000000000000000000000') {
      console.error(`❌ Bill ${billId} not found on-chain`);
      return { success: false, error: 'Bill not found on chain' };
    }

    // Create signature
    const { signature, timestamp } = await createOracleSignatureV4(
      billId,
      bill.payer,
      bill.billMaker,
      fiatAmount,
      paymentReference
    );

    // Send transaction
    console.log(`📤 Sending verifyPaymentReceived transaction for bill ${billId}...`);

    const tx = await contract.verifyPaymentReceived(
      billId,
      paymentReference,
      fiatAmount,
      timestamp,
      signature
    );

    console.log(`⏳ Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log(`✅ V4 Payment verified on-chain!`);
    console.log(`   Bill ID: ${billId}`);
    console.log(`   Tx Hash: ${receipt.hash}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

    return { success: true, txHash: receipt.hash };

  } catch (error) {
    console.error(`❌ V4 on-chain verification failed:`, error.message);

    // Check for specific error types
    if (error.message.includes('PaymentNotOracleVerified')) {
      return { success: false, error: 'Bill already verified or invalid state' };
    }
    if (error.message.includes('SignatureAlreadyUsed')) {
      return { success: false, error: 'Signature already used' };
    }
    if (error.message.includes('InvalidSignature')) {
      return { success: false, error: 'Invalid oracle signature' };
    }

    return { success: false, error: error.message };
  }
}

/**
 * API endpoint to manually trigger V4 payment verification
 * (for testing or manual intervention)
 */
app.post('/api/v4/verify-payment', express.json(), rateLimit, async (req, res) => {
  const { billId, paymentReference, fiatAmount, adminKey } = req.body;

  // Simple admin key check (replace with proper auth in production)
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!billId || !paymentReference || !fiatAmount) {
    return res.status(400).json({ error: 'Missing required fields: billId, paymentReference, fiatAmount' });
  }

  const result = await verifyPaymentOnChainV4(billId, paymentReference, fiatAmount);

  if (result.success) {
    res.json({ success: true, txHash: result.txHash });
  } else {
    res.status(500).json({ success: false, error: result.error });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  BillHaven Backend Server (V4 Ready)`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Stripe webhook: POST /webhooks/stripe`);
  console.log(`OpenNode webhook: POST /webhooks/opennode`);
  console.log(`V4 Manual verify: POST /api/v4/verify-payment`);
  console.log(`\n🔒 V4 Oracle Status:`);
  console.log(`   Chain ID: ${V4_CONTRACT_CONFIG.chainId}`);
  console.log(`   Contract: ${V4_CONTRACT_CONFIG.contractAddress}`);
  console.log(`   Oracle configured: ${V4_CONTRACT_CONFIG.oraclePrivateKey ? '✅ YES' : '❌ NO'}`);
  console.log(`========================================\n`);
});
