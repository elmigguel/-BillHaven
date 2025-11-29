# Payment Systems Integration Research 2025
## Automated Fiat Payment Verification & Smart Contract Release

**Date:** 2025-11-29
**Project:** BillHaven Escrow System
**Focus:** Netherlands/EU Payment Methods

---

## Table of Contents
1. [iDEAL Payment Verification](#1-ideal-payment-verification)
2. [Bank Transfer Verification](#2-bank-transfer-verification)
3. [Payment Provider Webhooks](#3-payment-provider-webhooks)
4. [Smart Contract Integration](#4-smart-contract-integration)
5. [Complete Architecture](#5-complete-architecture)
6. [Security Considerations](#6-security-considerations)
7. [Cost Analysis](#7-cost-analysis)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. iDEAL Payment Verification

### 1.1 Technical Architecture

**How iDEAL Works:**
```
1. Customer → Selects iDEAL at checkout
2. Merchant → Redirects to iDEAL payment page
3. Customer → Selects bank & authenticates
4. Bank → Processes payment
5. Bank → Confirms to iDEAL network
6. iDEAL → Redirects customer back to merchant
7. Merchant → Receives webhook confirmation
8. Merchant → Fulfills order
```

**Key Characteristics:**
- Real-time payment confirmation (instant)
- Irrevocable transactions (no chargebacks)
- Direct bank-to-bank transfer
- Very popular in Netherlands (60%+ market share)
- Maximum transaction: €50,000

### 1.2 Mollie API Integration (RECOMMENDED for Netherlands)

**Why Mollie:**
- Netherlands-based company
- Best iDEAL integration in EU
- Excellent documentation
- Competitive pricing
- Strong webhook system

**API Implementation:**

```javascript
// 1. Create Payment
const mollieClient = require('@mollie/api-client');
const mollie = mollieClient({ apiKey: process.env.MOLLIE_API_KEY });

async function createIdealPayment(escrowId, amount, description) {
  const payment = await mollie.payments.create({
    amount: {
      currency: 'EUR',
      value: amount.toFixed(2)
    },
    description: description,
    redirectUrl: `https://billhaven.com/escrow/${escrowId}/return`,
    webhookUrl: `https://billhaven.com/api/webhooks/mollie`,
    method: 'ideal',
    metadata: {
      escrow_id: escrowId,
      blockchain_address: '0x...',
      release_signature: 'signed_data'
    }
  });

  return {
    paymentId: payment.id,
    checkoutUrl: payment.getCheckoutUrl(),
    status: payment.status
  };
}

// 2. Webhook Handler
async function handleMollieWebhook(req, res) {
  const paymentId = req.body.id;

  // Fetch payment details from Mollie
  const payment = await mollie.payments.get(paymentId);

  if (payment.status === 'paid') {
    const { escrow_id, blockchain_address } = payment.metadata;

    // Verify payment amount matches escrow
    const escrow = await getEscrow(escrow_id);
    if (payment.amount.value !== escrow.fiat_amount) {
      throw new Error('Amount mismatch');
    }

    // Trigger smart contract release
    await triggerSmartContractRelease(escrow_id, blockchain_address);

    // Log successful payment
    await logPayment({
      escrow_id,
      payment_id: paymentId,
      amount: payment.amount.value,
      method: 'ideal',
      status: 'confirmed',
      timestamp: new Date()
    });
  }

  res.status(200).send('OK');
}
```

**Mollie API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/payments` | POST | Create payment |
| `/v2/payments/{id}` | GET | Get payment status |
| `/v2/methods` | GET | List available methods |
| `/v2/profiles/me` | GET | Get account info |

**Authentication:**
```bash
# Test API Key
test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM

# Live API Key
live_YourSecretApiKeyHere

# Header
Authorization: Bearer YOUR_API_KEY
```

### 1.3 Stripe iDEAL Integration

**Stripe Approach:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeIdealPayment(escrowId, amount) {
  // 1. Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // cents
    currency: 'eur',
    payment_method_types: ['ideal'],
    metadata: {
      escrow_id: escrowId
    }
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}

// 2. Handle webhook
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const escrowId = paymentIntent.metadata.escrow_id;

    // Trigger smart contract release
    await releaseEscrow(escrowId);
  }

  res.json({received: true});
}
```

**Stripe Pricing:**
- iDEAL: 0.29€ per transaction
- No percentage fee for iDEAL
- Monthly minimum: €0

### 1.4 Adyen iDEAL Integration

**Adyen Features:**
- Enterprise-grade solution
- Higher fees but more features
- Advanced fraud detection
- Best for large volumes

```javascript
// Adyen Client
const { Client, CheckoutAPI } = require('@adyen/api-library');

const client = new Client({
  apiKey: process.env.ADYEN_API_KEY,
  environment: 'TEST'
});
const checkout = new CheckoutAPI(client);

async function createAdyenPayment(escrowId, amount) {
  const response = await checkout.payments({
    amount: {
      currency: 'EUR',
      value: amount * 100
    },
    reference: escrowId,
    merchantAccount: 'BillHavenEscrow',
    returnUrl: `https://billhaven.com/return`,
    paymentMethod: {
      type: 'ideal'
    }
  });

  return {
    redirectUrl: response.redirect.url,
    paymentRef: response.pspReference
  };
}
```

**Adyen Pricing:**
- Setup fee: €500-2,000
- iDEAL: 0.10€ + 0.5%
- Monthly fee: €50+

---

## 2. Bank Transfer Verification

### 2.1 PSD2 Open Banking APIs

**PSD2 Overview:**
- EU regulation requiring banks to open APIs
- Real-time account access
- Transaction history
- Balance checking
- Strong Customer Authentication (SCA) required

**Key Capabilities:**
1. **Account Information Service (AIS):** Read account balance & transactions
2. **Payment Initiation Service (PIS):** Initiate payments directly
3. **Confirmation of Funds (COF):** Verify sufficient funds

### 2.2 TrueLayer Integration (RECOMMENDED for Open Banking)

**Why TrueLayer:**
- Best Open Banking coverage in EU
- Supports 200+ banks
- Excellent API design
- Real-time notifications
- PIS for instant payments

**Implementation:**

```javascript
const TrueLayer = require('truelayer-client');

// 1. Initialize payment
async function initiateBankTransfer(escrowId, amount, description) {
  const payment = await TrueLayer.Payments.create({
    amount_in_minor: amount * 100,
    currency: 'EUR',
    payment_method: {
      type: 'bank_transfer',
      provider_selection: {
        type: 'user_selected'
      },
      beneficiary: {
        type: 'merchant_account',
        merchant_account_id: 'BILLHAVEN_ACCOUNT_ID',
        reference: `ESCROW-${escrowId}`
      }
    },
    user: {
      email: 'payer@example.com'
    },
    metadata: {
      escrow_id: escrowId,
      contract_address: '0x...'
    }
  });

  return {
    paymentId: payment.id,
    authorizationUrl: payment.authorization_flow.url
  };
}

// 2. Webhook handler
async function handleTrueLayerWebhook(req, res) {
  const signature = req.headers['tl-signature'];

  // Verify signature
  if (!TrueLayer.verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.type === 'payment_executed') {
    const { payment_id, metadata } = event;
    const { escrow_id } = metadata;

    // Get full payment details
    const payment = await TrueLayer.Payments.get(payment_id);

    if (payment.status === 'executed') {
      // Payment confirmed - release escrow
      await releaseEscrowFunds(escrow_id);

      console.log(`✅ Payment confirmed: ${payment_id}`);
    }
  }

  res.status(200).send('OK');
}
```

**TrueLayer Webhook Events:**
- `payment_authorized` - User approved payment
- `payment_executed` - Bank processed payment (TRIGGER RELEASE HERE)
- `payment_settled` - Funds in your account
- `payment_failed` - Payment failed

**TrueLayer Pricing:**
- Setup: Free
- Per transaction: 0.30€ - 1.00€
- Volume discounts available

### 2.3 Plaid Integration (Alternative)

**Plaid Overview:**
- US-focused but expanding in EU
- Good for account verification
- Less suited for payments in EU

```javascript
const plaid = require('plaid');

const client = new plaid.PlaidApi(
  new plaid.Configuration({
    basePath: plaid.PlaidEnvironments.production,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

// Monitor transactions
async function checkForPayment(accessToken, escrowId, expectedAmount) {
  const request = {
    access_token: accessToken,
    start_date: '2025-11-01',
    end_date: '2025-11-29',
  };

  const response = await client.transactionsGet(request);
  const transactions = response.data.transactions;

  // Look for matching payment
  const payment = transactions.find(tx =>
    tx.amount === expectedAmount &&
    tx.name.includes(`ESCROW-${escrowId}`)
  );

  if (payment) {
    return {
      confirmed: true,
      transaction_id: payment.transaction_id,
      date: payment.date
    };
  }

  return { confirmed: false };
}
```

**Note:** Plaid is better for US market. Use TrueLayer or Salt Edge for EU.

### 2.4 Salt Edge Integration

**Salt Edge Features:**
- Good Open Banking coverage
- Supports 5,000+ banks globally
- PSD2 compliant
- Real-time transaction data

```javascript
// Salt Edge API
const axios = require('axios');

async function createSaltEdgeConnection(customerId) {
  const response = await axios.post(
    'https://www.saltedge.com/api/v5/connect_sessions/create',
    {
      data: {
        customer_id: customerId,
        consent: {
          scopes: ['account_details', 'transactions'],
          from_date: new Date().toISOString().split('T')[0]
        },
        return_to: 'https://billhaven.com/bank-connected'
      }
    },
    {
      headers: {
        'App-id': process.env.SALT_EDGE_APP_ID,
        'Secret': process.env.SALT_EDGE_SECRET
      }
    }
  );

  return response.data.data.connect_url;
}

// Monitor for payment
async function monitorTransactions(connectionId, escrowId, amount) {
  const response = await axios.get(
    `https://www.saltedge.com/api/v5/transactions`,
    {
      params: {
        connection_id: connectionId,
        from_date: new Date(Date.now() - 86400000).toISOString()
      },
      headers: {
        'App-id': process.env.SALT_EDGE_APP_ID,
        'Secret': process.env.SALT_EDGE_SECRET
      }
    }
  );

  const transactions = response.data.data;
  const payment = transactions.find(tx =>
    Math.abs(tx.amount - amount) < 0.01 &&
    tx.description.includes(escrowId)
  );

  return payment ? true : false;
}
```

---

## 3. Payment Provider Webhooks

### 3.1 Webhook Security Best Practices

**Critical Security Rules:**
1. Always verify webhook signatures
2. Use HTTPS endpoints only
3. Validate payload structure
4. Check idempotency
5. Rate limit webhook endpoints
6. Log all webhook events
7. Return 200 quickly (process async)

### 3.2 Stripe Webhook Implementation

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// RAW BODY REQUIRED for signature verification
app.post('/webhooks/stripe',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      // CRITICAL: Verify signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // IMPORTANT: Return 200 quickly
    res.json({received: true});
  }
);

async function handlePaymentSuccess(paymentIntent) {
  const escrowId = paymentIntent.metadata.escrow_id;

  // Idempotency check
  const existing = await db.getPayment(paymentIntent.id);
  if (existing && existing.processed) {
    console.log('Payment already processed');
    return;
  }

  // Process payment
  await db.savePayment({
    id: paymentIntent.id,
    escrow_id: escrowId,
    amount: paymentIntent.amount / 100,
    status: 'confirmed',
    processed: true,
    timestamp: new Date()
  });

  // Trigger smart contract release
  await releaseEscrowToBlockchain(escrowId);
}
```

**Stripe Webhook Events:**
- `payment_intent.succeeded` ✅ Payment confirmed
- `payment_intent.payment_failed` ❌ Payment failed
- `charge.refunded` 💸 Refund processed
- `payment_method.attached` 🔗 Payment method added

**Testing Webhooks Locally:**
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

### 3.3 Mollie Webhook Implementation

```javascript
app.post('/webhooks/mollie', express.json(), async (req, res) => {
  const paymentId = req.body.id;

  // CRITICAL: Always fetch from Mollie API
  // Never trust webhook body directly
  const payment = await mollie.payments.get(paymentId);

  if (payment.status === 'paid') {
    const escrowId = payment.metadata.escrow_id;

    // Verify amount
    const escrow = await db.getEscrow(escrowId);
    if (payment.amount.value !== escrow.amount.toString()) {
      console.error('Amount mismatch!');
      return res.status(400).send('Invalid amount');
    }

    // Double-check payment not already processed
    const processed = await db.isPaymentProcessed(paymentId);
    if (processed) {
      return res.status(200).send('Already processed');
    }

    // Mark as processed BEFORE releasing
    await db.markPaymentProcessed(paymentId);

    // Release escrow
    await releaseToSmartContract(escrowId);
  }

  res.status(200).send('OK');
});
```

**Mollie Webhook Security:**
- Mollie doesn't use signatures
- MUST fetch payment from API to verify
- Never trust webhook body directly
- Use HTTPS only
- Whitelist Mollie IPs (optional)

**Mollie Payment Statuses:**
- `open` - Payment created
- `pending` - Payment started
- `authorized` - Payment authorized (not yet captured)
- `paid` ✅ - Payment confirmed (TRIGGER HERE)
- `failed` - Payment failed
- `expired` - Payment expired
- `canceled` - Payment canceled

### 3.4 PayPal IPN (Instant Payment Notification)

```javascript
const axios = require('axios');

app.post('/webhooks/paypal', express.urlencoded({extended: true}), async (req, res) => {
  // Step 1: Return 200 immediately
  res.status(200).send('OK');

  // Step 2: Verify IPN with PayPal
  const verifyUrl = process.env.PAYPAL_MODE === 'live'
    ? 'https://ipnpb.paypal.com/cgi-bin/webscr'
    : 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';

  const verifyData = 'cmd=_notify-validate&' +
    Object.keys(req.body)
      .map(key => `${key}=${encodeURIComponent(req.body[key])}`)
      .join('&');

  const verification = await axios.post(verifyUrl, verifyData);

  if (verification.data !== 'VERIFIED') {
    console.error('IPN verification failed');
    return;
  }

  // Step 3: Process verified IPN
  if (req.body.payment_status === 'Completed') {
    const escrowId = req.body.custom; // custom field
    const amount = parseFloat(req.body.mc_gross);

    await processPayPalPayment(escrowId, amount, req.body.txn_id);
  }
});
```

**PayPal IPN Security:**
- Always verify with PayPal server
- Check payment_status === 'Completed'
- Verify receiver_email matches your account
- Check mc_currency matches expected
- Implement duplicate transaction check

---

## 4. Smart Contract Integration

### 4.1 Oracle Patterns

**Three Main Approaches:**

#### A. Chainlink Oracles (Most Decentralized)

```solidity
// Smart Contract
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract BillHavenEscrow is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    mapping(bytes32 => uint256) public requestToEscrow;

    function requestPaymentVerification(
        uint256 escrowId,
        string memory paymentId
    ) external returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillPaymentVerification.selector
        );

        // API endpoint to check payment
        req.add("get", "https://billhaven.com/api/verify-payment");
        req.add("path", "confirmed");
        req.add("paymentId", paymentId);

        requestId = sendChainlinkRequest(req, fee);
        requestToEscrow[requestId] = escrowId;
    }

    function fulfillPaymentVerification(
        bytes32 requestId,
        bool confirmed
    ) public recordChainlinkFulfillment(requestId) {
        if (confirmed) {
            uint256 escrowId = requestToEscrow[requestId];
            releaseEscrow(escrowId);
        }
    }
}
```

**Chainlink Pros:**
- Decentralized oracle network
- Secure and trusted
- Industry standard

**Chainlink Cons:**
- Costs LINK tokens per request
- ~$0.10-1.00 per API call
- More complex setup
- Need to maintain LINK balance

#### B. Custom Oracle (Centralized but Fast)

```javascript
// Backend Oracle Service
const { ethers } = require('ethers');

class PaymentOracle {
  constructor(privateKey, contractAddress) {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      escrowABI,
      this.wallet
    );
  }

  async confirmPaymentAndRelease(escrowId, paymentProof) {
    // Verify payment proof
    const verified = await this.verifyPayment(paymentProof);
    if (!verified) {
      throw new Error('Payment verification failed');
    }

    // Call smart contract
    const tx = await this.contract.confirmFiatPayment(
      escrowId,
      paymentProof.transactionId,
      paymentProof.amount,
      paymentProof.timestamp,
      {
        gasLimit: 200000
      }
    );

    await tx.wait();
    console.log(`✅ Escrow ${escrowId} released via tx ${tx.hash}`);
  }

  async verifyPayment(proof) {
    // Check payment in database
    const payment = await db.getPayment(proof.transactionId);

    return payment &&
           payment.status === 'confirmed' &&
           payment.amount === proof.amount &&
           !payment.used_for_release;
  }
}

// Smart Contract
pragma solidity ^0.8.0;

contract BillHavenEscrow {
    address public oracle;

    mapping(uint256 => Escrow) public escrows;

    struct Escrow {
        address payee;
        uint256 amount;
        bool released;
        string fiatTxId;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }

    function confirmFiatPayment(
        uint256 escrowId,
        string memory fiatTxId,
        uint256 fiatAmount,
        uint256 timestamp
    ) external onlyOracle {
        Escrow storage escrow = escrows[escrowId];

        require(!escrow.released, "Already released");
        require(fiatAmount >= escrow.expectedFiatAmount, "Insufficient amount");

        // Release crypto to payee
        escrow.released = true;
        escrow.fiatTxId = fiatTxId;

        payable(escrow.payee).transfer(escrow.amount);

        emit EscrowReleased(escrowId, fiatTxId, timestamp);
    }
}
```

**Custom Oracle Pros:**
- Fast (no waiting for oracle network)
- Cheap (only gas fees)
- Full control

**Custom Oracle Cons:**
- Centralized (single point of failure)
- Requires trust in oracle operator
- Security responsibility

#### C. Multi-Signature Approach (Hybrid)

```solidity
// Requires 2 of 3 signatures to release
contract MultiSigEscrow {
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    address public paymentOracle;
    address public adminOracle;
    address public backupOracle;

    function confirmPayment(uint256 escrowId) external {
        require(
            msg.sender == paymentOracle ||
            msg.sender == adminOracle ||
            msg.sender == backupOracle,
            "Not authorized"
        );

        confirmations[escrowId][msg.sender] = true;

        // Check if we have 2 confirmations
        uint256 confirmCount = 0;
        if (confirmations[escrowId][paymentOracle]) confirmCount++;
        if (confirmations[escrowId][adminOracle]) confirmCount++;
        if (confirmations[escrowId][backupOracle]) confirmCount++;

        if (confirmCount >= 2) {
            releaseEscrow(escrowId);
        }
    }
}
```

### 4.2 Backend-to-Blockchain Bridge

**Complete Implementation:**

```javascript
// backend/services/EscrowReleaseService.js
const { ethers } = require('ethers');
const winston = require('winston');

class EscrowReleaseService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL
    );

    this.wallet = new ethers.Wallet(
      process.env.ORACLE_PRIVATE_KEY,
      this.provider
    );

    this.contract = new ethers.Contract(
      process.env.ESCROW_CONTRACT_ADDRESS,
      require('../contracts/BillHavenEscrow.json').abi,
      this.wallet
    );

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'escrow-releases.log' })
      ]
    });
  }

  async releaseEscrow(escrowId, paymentDetails) {
    this.logger.info('Starting escrow release', { escrowId, paymentDetails });

    try {
      // Step 1: Verify payment in database
      const payment = await this.verifyPaymentRecord(paymentDetails);
      if (!payment) {
        throw new Error('Payment not found or invalid');
      }

      // Step 2: Check escrow state on-chain
      const escrow = await this.contract.getEscrow(escrowId);
      if (escrow.released) {
        this.logger.warn('Escrow already released', { escrowId });
        return { success: false, reason: 'already_released' };
      }

      // Step 3: Verify amounts match
      if (payment.amount !== escrow.expectedFiatAmount) {
        throw new Error('Amount mismatch');
      }

      // Step 4: Mark payment as being processed (prevent double-spend)
      await this.markPaymentProcessing(payment.id);

      // Step 5: Estimate gas
      const gasEstimate = await this.contract.estimateGas.confirmFiatPayment(
        escrowId,
        payment.transaction_id,
        ethers.utils.parseUnits(payment.amount.toString(), 2),
        Math.floor(payment.timestamp / 1000)
      );

      // Step 6: Execute transaction with 20% gas buffer
      const tx = await this.contract.confirmFiatPayment(
        escrowId,
        payment.transaction_id,
        ethers.utils.parseUnits(payment.amount.toString(), 2),
        Math.floor(payment.timestamp / 1000),
        {
          gasLimit: gasEstimate.mul(120).div(100),
          maxFeePerGas: ethers.utils.parseUnits('50', 'gwei'),
          maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei')
        }
      );

      this.logger.info('Transaction sent', {
        escrowId,
        txHash: tx.hash
      });

      // Step 7: Wait for confirmation
      const receipt = await tx.wait(2); // 2 confirmations

      if (receipt.status === 1) {
        // Step 8: Mark payment as released
        await this.markPaymentReleased(payment.id, tx.hash);

        // Step 9: Update escrow record
        await this.updateEscrowStatus(escrowId, 'released', tx.hash);

        this.logger.info('Escrow released successfully', {
          escrowId,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        });

        return {
          success: true,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        };
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      this.logger.error('Escrow release failed', {
        escrowId,
        error: error.message,
        stack: error.stack
      });

      // Rollback payment processing flag
      await this.rollbackPaymentProcessing(paymentDetails.id);

      throw error;
    }
  }

  async verifyPaymentRecord(paymentDetails) {
    const payment = await db.query(`
      SELECT * FROM fiat_payments
      WHERE transaction_id = $1
      AND status = 'confirmed'
      AND used_for_release = false
    `, [paymentDetails.transaction_id]);

    return payment.rows[0];
  }

  async markPaymentProcessing(paymentId) {
    await db.query(`
      UPDATE fiat_payments
      SET processing = true, processing_started_at = NOW()
      WHERE id = $1
    `, [paymentId]);
  }

  async markPaymentReleased(paymentId, txHash) {
    await db.query(`
      UPDATE fiat_payments
      SET
        used_for_release = true,
        blockchain_tx_hash = $2,
        released_at = NOW()
      WHERE id = $1
    `, [paymentId, txHash]);
  }

  async rollbackPaymentProcessing(paymentId) {
    await db.query(`
      UPDATE fiat_payments
      SET processing = false
      WHERE id = $1
    `, [paymentId]);
  }

  async updateEscrowStatus(escrowId, status, txHash) {
    await db.query(`
      UPDATE escrows
      SET
        status = $2,
        release_tx_hash = $3,
        released_at = NOW()
      WHERE id = $1
    `, [escrowId, status, txHash]);
  }
}

module.exports = new EscrowReleaseService();
```

### 4.3 Event Monitoring (Reverse Direction)

Monitor blockchain events from backend:

```javascript
// Listen to contract events
contract.on('EscrowCreated', async (escrowId, payer, payee, amount, event) => {
  console.log(`New escrow created: ${escrowId}`);

  // Store in database
  await db.query(`
    INSERT INTO escrows (
      blockchain_id, payer, payee, crypto_amount, status
    ) VALUES ($1, $2, $3, $4, 'pending')
  `, [escrowId.toString(), payer, payee, ethers.utils.formatEther(amount)]);
});

contract.on('EscrowReleased', async (escrowId, fiatTxId, event) => {
  console.log(`Escrow released: ${escrowId}`);

  // Update database
  await db.query(`
    UPDATE escrows
    SET status = 'released'
    WHERE blockchain_id = $1
  `, [escrowId.toString()]);

  // Send notification
  await sendEmail({
    to: escrow.payee_email,
    subject: 'Payment Released',
    body: `Your escrow ${escrowId} has been released!`
  });
});
```

---

## 5. Complete Architecture

### 5.1 End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     BILLHAVEN ESCROW SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

STEP 1: ESCROW CREATION
┌──────────┐
│  Payer   │ Creates escrow on blockchain
└────┬─────┘
     │ tx: createEscrow(payee, amount, bill_details)
     ▼
┌─────────────────┐
│ Smart Contract  │ Locks crypto (WBTC/USDT)
└────┬────────────┘
     │ Event: EscrowCreated(id, payer, payee, amount)
     ▼
┌─────────────────┐
│  Backend API    │ Stores escrow in database
└────┬────────────┘
     │ Generates payment link
     ▼
┌─────────────────┐
│     Payee       │ Receives notification with payment options
└─────────────────┘


STEP 2: FIAT PAYMENT
┌──────────┐
│  Payee   │ Clicks "Pay with iDEAL"
└────┬─────┘
     │ POST /api/escrow/123/pay-ideal
     ▼
┌─────────────────┐
│  Backend API    │ Creates Mollie payment
└────┬────────────┘
     │ API call: mollie.payments.create()
     ▼
┌─────────────────┐
│  Mollie API     │ Returns checkout URL
└────┬────────────┘
     │ redirectUrl
     ▼
┌──────────┐
│  Payee   │ Redirected to iDEAL bank selection
└────┬─────┘
     │ Selects bank (e.g., ING)
     ▼
┌─────────────────┐
│  Bank Website   │ Customer authenticates & confirms
└────┬────────────┘
     │ Payment processed
     ▼
┌─────────────────┐
│  iDEAL Network  │ Confirms transaction
└────┬────────────┘
     │ Status: PAID
     ▼
┌─────────────────┐
│  Mollie API     │ Updates payment status
└─────────────────┘


STEP 3: WEBHOOK NOTIFICATION
┌─────────────────┐
│  Mollie API     │ Sends webhook
└────┬────────────┘
     │ POST /api/webhooks/mollie
     │ Body: { id: "tr_abc123" }
     ▼
┌─────────────────┐
│  Backend API    │ Receives webhook
│  (Webhook       │
│   Handler)      │
└────┬────────────┘
     │ 1. Fetch payment from Mollie API (verify)
     │ 2. Check payment status === 'paid'
     │ 3. Verify amount matches escrow
     │ 4. Check not already processed
     ▼
┌─────────────────┐
│  Database       │ Mark payment as confirmed
└────┬────────────┘
     │ UPDATE fiat_payments SET status='confirmed'
     ▼
┌─────────────────┐
│  Message Queue  │ Enqueue release job
│  (Bull/Redis)   │
└────┬────────────┘
     │ Job: { escrowId: 123, paymentId: "tr_abc123" }
     ▼


STEP 4: SMART CONTRACT RELEASE
┌─────────────────┐
│  Release Worker │ Processes job from queue
└────┬────────────┘
     │ 1. Load escrow details
     │ 2. Verify payment one more time
     │ 3. Check escrow not already released
     ▼
┌─────────────────┐
│  Oracle Service │ Signs transaction
└────┬────────────┘
     │ contract.confirmFiatPayment(escrowId, txId, amount, timestamp)
     ▼
┌─────────────────┐
│ Smart Contract  │ Validates call from oracle
└────┬────────────┘
     │ 1. Check msg.sender == oracle
     │ 2. Check escrow not released
     │ 3. Release crypto to payee
     ▼
┌─────────────────┐
│  Blockchain     │ Execute transfer
└────┬────────────┘
     │ Event: EscrowReleased(id, fiatTxId, timestamp)
     ▼
┌──────────┐
│  Payee   │ Receives crypto in wallet
└──────────┘


STEP 5: NOTIFICATIONS
┌─────────────────┐
│  Event Listener │ Monitors blockchain events
└────┬────────────┘
     │ Detects: EscrowReleased(123, ...)
     ▼
┌─────────────────┐
│  Backend API    │ Updates database
└────┬────────────┘
     │ UPDATE escrows SET status='released'
     ▼
┌─────────────────┐
│  Notification   │ Send emails/SMS
│  Service        │
└────┬────────────┘
     │
     ├──► Payee: "Payment received, crypto released"
     │
     └──► Payer: "Transaction completed, escrow released"
```

### 5.2 Database Schema

```sql
-- Escrows
CREATE TABLE escrows (
  id SERIAL PRIMARY KEY,
  blockchain_id INTEGER NOT NULL UNIQUE,
  payer_address VARCHAR(42) NOT NULL,
  payee_address VARCHAR(42) NOT NULL,
  payee_email VARCHAR(255),
  crypto_token VARCHAR(42), -- WBTC/USDT contract
  crypto_amount DECIMAL(36,18) NOT NULL,
  expected_fiat_amount DECIMAL(10,2) NOT NULL,
  fiat_currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending',
  bill_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  released_at TIMESTAMP,
  release_tx_hash VARCHAR(66),
  INDEX idx_blockchain_id (blockchain_id),
  INDEX idx_status (status)
);

-- Fiat Payments
CREATE TABLE fiat_payments (
  id SERIAL PRIMARY KEY,
  escrow_id INTEGER REFERENCES escrows(id),
  payment_provider VARCHAR(20), -- mollie, stripe, truelayer
  payment_method VARCHAR(20), -- ideal, bank_transfer
  provider_payment_id VARCHAR(100) UNIQUE,
  transaction_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending',
  processing BOOLEAN DEFAULT FALSE,
  processing_started_at TIMESTAMP,
  used_for_release BOOLEAN DEFAULT FALSE,
  blockchain_tx_hash VARCHAR(66),
  webhook_received_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  released_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_escrow_id (escrow_id),
  INDEX idx_provider_payment_id (provider_payment_id),
  INDEX idx_status (status)
);

-- Release Jobs (for queue)
CREATE TABLE release_jobs (
  id SERIAL PRIMARY KEY,
  escrow_id INTEGER REFERENCES escrows(id),
  payment_id INTEGER REFERENCES fiat_payments(id),
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Webhook Events (audit log)
CREATE TABLE webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20),
  event_type VARCHAR(50),
  payment_id VARCHAR(100),
  payload JSONB,
  signature VARCHAR(500),
  verified BOOLEAN,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_provider (provider),
  INDEX idx_payment_id (payment_id)
);
```

### 5.3 API Endpoints

```javascript
// routes/escrow.js
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

// 1. Create escrow (called after blockchain tx)
router.post('/escrow/create',
  body('blockchain_id').isInt(),
  body('payer_address').isEthereumAddress(),
  body('payee_address').isEthereumAddress(),
  body('crypto_amount').isDecimal(),
  body('expected_fiat_amount').isDecimal(),
  async (req, res) => {
    const escrow = await createEscrow(req.body);
    res.json({ escrow_id: escrow.id });
  }
);

// 2. Get escrow details
router.get('/escrow/:id',
  param('id').isInt(),
  async (req, res) => {
    const escrow = await getEscrow(req.params.id);
    res.json(escrow);
  }
);

// 3. Initiate iDEAL payment
router.post('/escrow/:id/pay-ideal',
  param('id').isInt(),
  body('return_url').isURL(),
  async (req, res) => {
    const escrow = await getEscrow(req.params.id);

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: escrow.expected_fiat_amount.toFixed(2)
      },
      description: `Bill payment - Escrow #${escrow.id}`,
      redirectUrl: req.body.return_url,
      webhookUrl: `${process.env.BASE_URL}/api/webhooks/mollie`,
      method: 'ideal',
      metadata: {
        escrow_id: escrow.id
      }
    });

    // Store payment
    await db.query(`
      INSERT INTO fiat_payments (
        escrow_id, payment_provider, payment_method,
        provider_payment_id, amount, status
      ) VALUES ($1, 'mollie', 'ideal', $2, $3, 'pending')
    `, [escrow.id, payment.id, escrow.expected_fiat_amount]);

    res.json({
      payment_id: payment.id,
      checkout_url: payment.getCheckoutUrl()
    });
  }
);

// 4. Initiate bank transfer (Open Banking)
router.post('/escrow/:id/pay-bank',
  param('id').isInt(),
  async (req, res) => {
    const escrow = await getEscrow(req.params.id);

    const payment = await TrueLayer.Payments.create({
      amount_in_minor: escrow.expected_fiat_amount * 100,
      currency: 'EUR',
      payment_method: {
        type: 'bank_transfer',
        provider_selection: { type: 'user_selected' },
        beneficiary: {
          type: 'merchant_account',
          merchant_account_id: process.env.TRUELAYER_MERCHANT_ID,
          reference: `ESCROW-${escrow.id}`
        }
      },
      metadata: {
        escrow_id: escrow.id
      }
    });

    res.json({
      payment_id: payment.id,
      authorization_url: payment.authorization_flow.url
    });
  }
);

// 5. Check payment status
router.get('/escrow/:id/payment-status',
  param('id').isInt(),
  async (req, res) => {
    const result = await db.query(`
      SELECT status, confirmed_at, released_at, blockchain_tx_hash
      FROM fiat_payments
      WHERE escrow_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.params.id]);

    res.json(result.rows[0] || { status: 'no_payment' });
  }
);

module.exports = router;
```

### 5.4 Webhook Handlers (Complete)

```javascript
// routes/webhooks.js
const express = require('express');
const router = express.Router();
const mollie = require('@mollie/api-client')({ apiKey: process.env.MOLLIE_API_KEY });
const Bull = require('bull');

// Create job queue
const releaseQueue = new Bull('escrow-release', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Mollie webhook
router.post('/webhooks/mollie', express.json(), async (req, res) => {
  const paymentId = req.body.id;

  // Return 200 immediately
  res.status(200).send('OK');

  try {
    // Fetch payment from Mollie (NEVER trust webhook body)
    const payment = await mollie.payments.get(paymentId);

    // Store webhook event
    await db.query(`
      INSERT INTO webhook_events (
        provider, event_type, payment_id, payload, verified, processed
      ) VALUES ('mollie', 'payment_update', $1, $2, true, false)
    `, [paymentId, JSON.stringify(payment)]);

    if (payment.status === 'paid') {
      const escrowId = payment.metadata.escrow_id;

      // Update payment record
      await db.query(`
        UPDATE fiat_payments
        SET
          status = 'confirmed',
          confirmed_at = NOW(),
          webhook_received_at = NOW()
        WHERE provider_payment_id = $1
      `, [paymentId]);

      // Add job to release queue
      await releaseQueue.add({
        escrow_id: escrowId,
        payment_id: paymentId,
        amount: parseFloat(payment.amount.value),
        provider: 'mollie'
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });

      console.log(`✅ Payment confirmed for escrow ${escrowId}`);
    }

  } catch (error) {
    console.error('Mollie webhook error:', error);
  }
});

// Stripe webhook
router.post('/webhooks/stripe',
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.json({received: true});

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const escrowId = paymentIntent.metadata.escrow_id;

      await db.query(`
        UPDATE fiat_payments
        SET status = 'confirmed', confirmed_at = NOW()
        WHERE provider_payment_id = $1
      `, [paymentIntent.id]);

      await releaseQueue.add({
        escrow_id: escrowId,
        payment_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        provider: 'stripe'
      });
    }
  }
);

// TrueLayer webhook
router.post('/webhooks/truelayer', express.json(), async (req, res) => {
  const signature = req.headers['tl-signature'];

  // Verify signature
  if (!TrueLayer.verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  res.status(200).send('OK');

  const event = req.body;

  if (event.type === 'payment_executed') {
    const { payment_id, metadata } = event;
    const { escrow_id } = metadata;

    await db.query(`
      UPDATE fiat_payments
      SET status = 'confirmed', confirmed_at = NOW()
      WHERE provider_payment_id = $1
    `, [payment_id]);

    await releaseQueue.add({
      escrow_id: escrow_id,
      payment_id: payment_id,
      provider: 'truelayer'
    });
  }
});

module.exports = router;
```

### 5.5 Release Worker (Job Processor)

```javascript
// workers/releaseWorker.js
const Bull = require('bull');
const EscrowReleaseService = require('../services/EscrowReleaseService');

const releaseQueue = new Bull('escrow-release', {
  redis: { host: 'localhost', port: 6379 }
});

// Process release jobs
releaseQueue.process(async (job) => {
  const { escrow_id, payment_id, amount, provider } = job.data;

  console.log(`Processing release job for escrow ${escrow_id}`);

  try {
    // Get payment details
    const payment = await db.query(`
      SELECT * FROM fiat_payments
      WHERE provider_payment_id = $1
    `, [payment_id]);

    if (!payment.rows[0]) {
      throw new Error('Payment not found');
    }

    // Check if already released
    if (payment.rows[0].used_for_release) {
      console.log(`Payment ${payment_id} already used for release`);
      return { success: true, reason: 'already_released' };
    }

    // Release escrow via smart contract
    const result = await EscrowReleaseService.releaseEscrow(
      escrow_id,
      payment.rows[0]
    );

    console.log(`✅ Escrow ${escrow_id} released via tx ${result.txHash}`);

    return result;

  } catch (error) {
    console.error(`Error processing release for escrow ${escrow_id}:`, error);

    // Log failed job
    await db.query(`
      INSERT INTO release_jobs (
        escrow_id, payment_id, status, error_message
      ) VALUES ($1, $2, 'failed', $3)
    `, [escrow_id, payment_id, error.message]);

    throw error; // Will trigger retry
  }
});

// Event handlers
releaseQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

releaseQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

console.log('Release worker started');
```

---

## 6. Security Considerations

### 6.1 Double-Spend Prevention

**Critical Vulnerabilities:**
1. Same payment triggering multiple releases
2. Race conditions in webhook processing
3. Replay attacks

**Solutions:**

```javascript
// Use database transactions with row locking
async function processPaymentWebhook(paymentId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the payment row
    const result = await client.query(`
      SELECT * FROM fiat_payments
      WHERE provider_payment_id = $1
      FOR UPDATE NOWAIT
    `, [paymentId]);

    const payment = result.rows[0];

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.used_for_release) {
      console.log('Payment already used');
      await client.query('COMMIT');
      return { success: false, reason: 'already_used' };
    }

    // Mark as used IMMEDIATELY
    await client.query(`
      UPDATE fiat_payments
      SET used_for_release = true, processing = true
      WHERE id = $1
    `, [payment.id]);

    await client.query('COMMIT');

    // Now safe to release (outside transaction)
    await releaseEscrow(payment.escrow_id);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 6.2 Webhook Security Checklist

```javascript
// Comprehensive webhook security
class WebhookSecurityMiddleware {

  // 1. Verify signature
  static verifySignature(provider, req) {
    switch (provider) {
      case 'stripe':
        return stripe.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          process.env.STRIPE_WEBHOOK_SECRET
        );

      case 'truelayer':
        return TrueLayer.verifySignature(
          req.body,
          req.headers['tl-signature']
        );

      case 'mollie':
        // Mollie doesn't use signatures - must fetch from API
        return true;
    }
  }

  // 2. Rate limiting
  static rateLimit = new Map();

  static checkRateLimit(ip) {
    const now = Date.now();
    const requests = this.rateLimit.get(ip) || [];

    // Filter requests in last minute
    const recentRequests = requests.filter(t => now - t < 60000);

    if (recentRequests.length > 100) {
      throw new Error('Rate limit exceeded');
    }

    recentRequests.push(now);
    this.rateLimit.set(ip, recentRequests);
  }

  // 3. IP whitelist (optional)
  static ALLOWED_IPS = {
    mollie: ['194.0.200.0/23'],
    stripe: ['3.18.12.0/23', '3.130.192.0/23'],
    truelayer: ['35.177.0.0/16']
  };

  static verifyIP(provider, ip) {
    const allowedRanges = this.ALLOWED_IPS[provider];
    if (!allowedRanges) return true;

    // Check if IP in allowed range (use cidr-matcher library)
    return allowedRanges.some(range => ipInRange(ip, range));
  }

  // 4. Idempotency check
  static processedWebhooks = new Set();

  static async checkIdempotency(webhookId) {
    if (this.processedWebhooks.has(webhookId)) {
      return false; // Already processed
    }

    // Check database
    const result = await db.query(`
      SELECT id FROM webhook_events
      WHERE payment_id = $1 AND processed = true
    `, [webhookId]);

    if (result.rows.length > 0) {
      return false;
    }

    this.processedWebhooks.add(webhookId);
    return true;
  }
}

// Apply middleware
app.post('/webhooks/:provider', async (req, res) => {
  const provider = req.params.provider;

  try {
    // 1. Rate limit
    WebhookSecurityMiddleware.checkRateLimit(req.ip);

    // 2. Verify IP
    if (!WebhookSecurityMiddleware.verifyIP(provider, req.ip)) {
      return res.status(403).send('Forbidden');
    }

    // 3. Verify signature
    WebhookSecurityMiddleware.verifySignature(provider, req);

    // 4. Idempotency
    const webhookId = req.body.id;
    if (!await WebhookSecurityMiddleware.checkIdempotency(webhookId)) {
      return res.status(200).send('Already processed');
    }

    // 5. Process webhook
    await processWebhook(provider, req.body);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(error.message);
  }
});
```

### 6.3 Oracle Security

```solidity
// Multi-sig oracle with timelock
contract SecureOracle {
    address public primaryOracle;
    address public backupOracle;
    address public admin;

    mapping(uint256 => PendingRelease) public pendingReleases;

    struct PendingRelease {
        uint256 escrowId;
        uint256 amount;
        uint256 timestamp;
        bool confirmed;
    }

    uint256 public constant TIMELOCK = 10 minutes;

    function initiateRelease(
        uint256 escrowId,
        uint256 amount
    ) external {
        require(
            msg.sender == primaryOracle || msg.sender == backupOracle,
            "Not authorized"
        );

        uint256 releaseId = uint256(keccak256(abi.encodePacked(
            escrowId, amount, block.timestamp
        )));

        pendingReleases[releaseId] = PendingRelease({
            escrowId: escrowId,
            amount: amount,
            timestamp: block.timestamp,
            confirmed: false
        });

        emit ReleaseInitiated(releaseId, escrowId, amount);
    }

    function executeRelease(uint256 releaseId) external {
        PendingRelease storage release = pendingReleases[releaseId];

        require(release.timestamp > 0, "Release not found");
        require(!release.confirmed, "Already confirmed");
        require(
            block.timestamp >= release.timestamp + TIMELOCK,
            "Timelock not expired"
        );

        release.confirmed = true;

        // Execute actual release
        _releaseEscrow(release.escrowId);
    }

    // Emergency cancel (admin only)
    function cancelRelease(uint256 releaseId) external {
        require(msg.sender == admin, "Admin only");
        delete pendingReleases[releaseId];
    }
}
```

---

## 7. Cost Analysis

### 7.1 Payment Provider Comparison

| Provider | Setup Fee | Per Transaction | Monthly Fee | iDEAL Support | Bank Transfer | Webhooks | Best For |
|----------|-----------|-----------------|-------------|---------------|---------------|----------|----------|
| **Mollie** | €0 | 0.29€ (iDEAL) | €0 | ✅ Excellent | ❌ | ✅ Yes | Netherlands/EU startups |
| **Stripe** | €0 | 0.29€ (iDEAL) | €0 | ✅ Good | ❌ | ✅ Yes | Global businesses |
| **Adyen** | €500-2,000 | 0.10€ + 0.5% | €50+ | ✅ Excellent | ✅ Via PIS | ✅ Yes | Enterprise/high volume |
| **TrueLayer** | €0 | 0.30€ - 1.00€ | €0 | ✅ Via PIS | ✅ Yes | ✅ Yes | Open Banking focus |
| **Plaid** | €0 | $0.25 - $2.50 | Varies | ❌ | ✅ Limited EU | ✅ Yes | US market primarily |

### 7.2 Total Cost Per Transaction

**Example: €500 bill payment**

**Option 1: Mollie (iDEAL)**
- Payment fee: €0.29
- Blockchain gas (Base): ~$0.10 (0.000002 ETH)
- Total cost: ~€0.39 (0.08%)

**Option 2: Stripe (iDEAL)**
- Payment fee: €0.29
- Blockchain gas: ~$0.10
- Total cost: ~€0.39 (0.08%)

**Option 3: TrueLayer (Open Banking)**
- Payment fee: €0.50
- Blockchain gas: ~$0.10
- Total cost: ~€0.60 (0.12%)

**Option 4: Adyen (Enterprise)**
- Setup: €1,000 (one-time)
- Monthly: €50
- Per tx: €2.60 (0.10€ + 0.5%)
- Blockchain gas: ~$0.10
- Total cost: €2.70 + overhead
- Break-even: ~200 tx/month

### 7.3 Blockchain Gas Costs (2025)

**Base Network (Recommended):**
- Release escrow tx: ~100,000 gas
- Gas price: ~0.02 Gwei
- Cost: ~$0.10 per release

**Ethereum Mainnet:**
- Release escrow tx: ~100,000 gas
- Gas price: ~30 Gwei
- Cost: ~$15 per release (TOO EXPENSIVE)

**Polygon:**
- Release escrow tx: ~100,000 gas
- Gas price: ~50 Gwei
- Cost: ~$0.02 per release

**Arbitrum:**
- Release escrow tx: ~100,000 gas
- Gas price: ~0.1 Gwei
- Cost: ~$0.05 per release

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Choose payment provider (Recommend: Mollie)
- [ ] Set up Mollie account & get API keys
- [ ] Implement basic webhook handler
- [ ] Set up PostgreSQL database
- [ ] Create database schema
- [ ] Implement EscrowReleaseService
- [ ] Deploy test smart contract on testnet

### Phase 2: Integration (Week 3-4)
- [ ] Build API endpoints for payment initiation
- [ ] Implement Mollie webhook processing
- [ ] Set up Bull job queue
- [ ] Build release worker
- [ ] Implement oracle service
- [ ] Add event monitoring from blockchain
- [ ] Build admin dashboard for monitoring

### Phase 3: Security (Week 5)
- [ ] Add webhook signature verification
- [ ] Implement rate limiting
- [ ] Add database transaction locking
- [ ] Implement idempotency checks
- [ ] Add comprehensive logging
- [ ] Set up monitoring & alerts
- [ ] Security audit

### Phase 4: Testing (Week 6)
- [ ] End-to-end testing on testnet
- [ ] Load testing webhooks
- [ ] Test double-spend scenarios
- [ ] Test race conditions
- [ ] Test failure scenarios
- [ ] User acceptance testing

### Phase 5: Launch (Week 7-8)
- [ ] Deploy smart contracts to mainnet
- [ ] Set up production environment
- [ ] Configure production webhooks
- [ ] Go live with small limits
- [ ] Monitor first real transactions
- [ ] Gradually increase limits
- [ ] Full production launch

---

## 9. Recommended Architecture

### 9.1 Technology Stack

**Backend:**
- Node.js + Express
- PostgreSQL database
- Bull + Redis (job queue)
- ethers.js (blockchain interaction)

**Payment Processing:**
- Mollie (primary - iDEAL)
- TrueLayer (optional - Open Banking)
- Stripe (backup - card payments)

**Blockchain:**
- Base Network (low fees)
- Custom oracle (centralized but fast)
- Option to upgrade to Chainlink later

**Infrastructure:**
- AWS/DigitalOcean for backend
- RDS for PostgreSQL
- ElastiCache for Redis
- CloudWatch for monitoring

### 9.2 Minimum Viable Product (MVP)

**Core Features:**
1. Escrow creation on blockchain
2. iDEAL payment via Mollie
3. Webhook handling with verification
4. Automatic smart contract release
5. Basic admin dashboard

**MVP Code Structure:**
```
billhaven-backend/
├── src/
│   ├── contracts/
│   │   └── BillHavenEscrow.sol
│   ├── services/
│   │   ├── EscrowReleaseService.js
│   │   ├── MollieService.js
│   │   └── BlockchainService.js
│   ├── routes/
│   │   ├── escrow.js
│   │   └── webhooks.js
│   ├── workers/
│   │   └── releaseWorker.js
│   ├── models/
│   │   ├── Escrow.js
│   │   └── Payment.js
│   └── app.js
├── migrations/
│   └── 001_initial_schema.sql
├── tests/
│   ├── escrow.test.js
│   ├── webhooks.test.js
│   └── release.test.js
├── .env.example
├── package.json
└── README.md
```

### 9.3 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/billhaven
REDIS_URL=redis://localhost:6379

# Blockchain
BLOCKCHAIN_RPC_URL=https://mainnet.base.org
ESCROW_CONTRACT_ADDRESS=0x...
ORACLE_PRIVATE_KEY=0x...
CHAIN_ID=8453

# Mollie
MOLLIE_API_KEY=test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM
MOLLIE_WEBHOOK_SECRET=whsec_...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# TrueLayer (optional)
TRUELAYER_CLIENT_ID=...
TRUELAYER_CLIENT_SECRET=...
TRUELAYER_MERCHANT_ID=...

# App
BASE_URL=https://api.billhaven.com
PORT=3000
NODE_ENV=production

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

---

## 10. Next Steps

### Immediate Actions:
1. **Create Mollie account** → Get test API keys
2. **Deploy test smart contract** → Sepolia or Base Goerli
3. **Build webhook handler** → Test with Mollie webhooks
4. **Test end-to-end flow** → Fake iDEAL payment → Release

### Key Decisions:
1. **Primary payment provider:** Mollie (recommended)
2. **Oracle pattern:** Custom oracle (fast, cheap)
3. **Blockchain network:** Base (low fees)
4. **Job queue:** Bull + Redis

### Success Metrics:
- Webhook processing time: < 2 seconds
- Smart contract release time: < 30 seconds
- Total flow completion: < 1 minute
- Zero double-spends
- 99.9% uptime

---

## Conclusion

The recommended architecture for BillHaven's auto-release system:

1. **iDEAL payments via Mollie** (best Netherlands integration)
2. **Webhook-based confirmation** (instant notification)
3. **Bull job queue** (reliable processing)
4. **Custom oracle** (fast, cheap releases)
5. **Base blockchain** (low gas fees)

This provides:
- ✅ Real-time payment confirmation
- ✅ Automatic crypto release
- ✅ Low costs (~€0.39 per transaction)
- ✅ High security (with proper implementation)
- ✅ Scalable architecture

**Estimated Timeline:** 6-8 weeks from start to production
**Estimated Cost:** ~€500 setup + €0.39 per transaction
**Risk Level:** Medium (requires careful security implementation)

Ready to implement! 🚀
