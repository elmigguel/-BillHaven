# BillHaven Deployment Guide

> **Complete step-by-step instructions for deploying BillHaven to production**

This guide covers deploying all three components: Frontend (Vercel), Backend (Railway), and Smart Contracts (Hardhat).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Railway)](#backend-deployment-railway)
5. [Smart Contract Deployment](#smart-contract-deployment)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [ ] **GitHub Account** - For repository hosting
- [ ] **Vercel Account** - For frontend hosting (free tier)
- [ ] **Railway Account** - For backend hosting ($5 free credit)
- [ ] **Supabase Account** - For database (free tier)
- [ ] **Stripe Account** - For payment processing (test mode)
- [ ] **OpenNode Account** - For Lightning Network (free tier)
- [ ] **Alchemy/Infura Account** - For blockchain RPC (optional, free tier)

### Required Software

- Node.js v14+ (recommended: v22.21.1)
- npm or yarn
- Git
- MetaMask wallet with test funds

### Wallet Preparation

You'll need **two wallets** with private keys:

1. **Deployer Wallet** - For deploying smart contracts
   - Needs testnet/mainnet gas tokens (POL, ETH, BNB)
   - Estimated costs: $8-$50 depending on networks

2. **Fee Wallet** - For receiving platform fees
   - No initial funding required
   - Will receive platform fees (2.5-4.4%)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/BillHaven.git
cd BillHaven
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` with your values:

```bash
# ============================================
# SUPABASE (Database)
# ============================================
# Get from: https://supabase.com/dashboard
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# STRIPE (Payment Processing)
# ============================================
# Get from: https://dashboard.stripe.com/test/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

# Get from: https://dashboard.stripe.com/test/webhooks
# (Create webhook endpoint first - see Backend Deployment section)
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# OPENNODE (Lightning Network)
# ============================================
# Get from: https://opennode.com/dashboard/api-keys
VITE_OPENNODE_API_KEY=your-api-key-here

# ============================================
# SMART CONTRACTS
# ============================================
# Deployer wallet (KEEP SECRET!)
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...

# Fee collection wallet (where platform fees go)
FEE_WALLET_ADDRESS=0x596b95782d98295283c5d72142e477d92549cde3

# Contract addresses (fill after deployment)
VITE_POLYGON_MAINNET_CONTRACT=0x...
VITE_POLYGON_AMOY_CONTRACT=0x...
VITE_ETHEREUM_MAINNET_CONTRACT=0x...
VITE_BSC_MAINNET_CONTRACT=0x...
VITE_ARBITRUM_MAINNET_CONTRACT=0x...
VITE_OPTIMISM_MAINNET_CONTRACT=0x...
VITE_BASE_MAINNET_CONTRACT=0x...

# ============================================
# BLOCKCHAIN RPC URLs (Optional - uses free public RPCs by default)
# ============================================
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ETH_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_RPC=https://bsc-dataseed1.binance.org
ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC=https://mainnet.base.org

# ============================================
# BLOCK EXPLORERS (For contract verification)
# ============================================
# Get from each explorer's API settings
POLYGONSCAN_API_KEY=ABC123...
ETHERSCAN_API_KEY=ABC123...
BSCSCAN_API_KEY=ABC123...
ARBISCAN_API_KEY=ABC123...
OPTIMISM_ETHERSCAN_API_KEY=ABC123...
BASESCAN_API_KEY=ABC123...

# ============================================
# SENTRY (Error Monitoring - Optional)
# ============================================
VITE_SENTRY_DSN=https://...@sentry.io/...

# ============================================
# ADMIN SETTINGS
# ============================================
VITE_ADMIN_EMAIL=admin@billhaven.com
VITE_APP_NAME=BillHaven
VITE_FEE_PERCENTAGE=2.5
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Build

```bash
# Test build locally
npm run build

# Should see:
# ✓ built in 1m 54s
# dist/index.html                   x KB
# dist/assets/index-xxxxxx.js       862 KB gzipped
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import from GitHub
4. Select `BillHaven` repository
5. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. Add Environment Variables:
   - Click **"Environment Variables"**
   - Add all `VITE_*` variables from your `.env`
   - ⚠️ **Do NOT** add `STRIPE_SECRET_KEY` or `DEPLOYER_PRIVATE_KEY` here
7. Click **"Deploy"**

### Step 3: Configure Domain (Optional)

1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add custom domain (e.g., `billhaven.app`)
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (5-10 minutes)

### Vercel Deployment Checklist

- [ ] Build succeeds without errors
- [ ] All `VITE_*` environment variables added
- [ ] No sensitive keys (STRIPE_SECRET_KEY) in Vercel env vars
- [ ] Custom domain configured (optional)
- [ ] HTTPS working
- [ ] Site loads without errors

---

## Backend Deployment (Railway)

The backend is an Express.js server that handles payment webhooks from Stripe and OpenNode.

### Step 1: Prepare Backend

```bash
cd server

# Test locally
npm install
node index.js

# Should see:
# Webhook server running on port 3001
```

### Step 2: Deploy to Railway

#### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm i -g railway

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
railway variables set VITE_SUPABASE_URL="https://..."
railway variables set VITE_SUPABASE_ANON_KEY="eyJ..."
railway variables set OPENNODE_API_KEY="your-key"

# Deploy
railway up
```

#### Option B: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `BillHaven` repository
5. Configure:
   - **Root Directory:** `/server`
   - **Start Command:** `node index.js`
6. Add Environment Variables:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (get after creating webhook)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   OPENNODE_API_KEY=your-key
   PORT=3001
   ```
7. Click **"Deploy"**
8. Wait for deployment (2-3 minutes)
9. Copy the public URL: `https://billhaven-production.up.railway.app`

### Step 3: Configure Stripe Webhook

Now that backend is deployed, set up Stripe webhook:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter webhook URL: `https://your-railway-url.railway.app/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
5. Click **"Add endpoint"**
6. Copy **Signing secret** (starts with `whsec_`)
7. Add to Railway environment variables:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```
8. Redeploy: `railway up` or click **"Redeploy"** in dashboard

### Step 4: Configure OpenNode Webhook (Optional)

For Lightning Network payment confirmations:

1. Go to [OpenNode Dashboard](https://opennode.com/dashboard/webhooks)
2. Add webhook URL: `https://your-railway-url.railway.app/webhooks/opennode`
3. Events: `charge:completed`, `charge:failed`
4. Copy callback URL from dashboard

### Railway Deployment Checklist

- [ ] Server starts without errors
- [ ] All environment variables added
- [ ] Railway URL accessible
- [ ] Stripe webhook configured
- [ ] OpenNode webhook configured (optional)
- [ ] Health check endpoint working: `GET /health`

---

## Smart Contract Deployment

### Step 1: Fund Deployer Wallet

Your deployer wallet needs gas tokens for each network:

| Network | Token | Amount | Cost (USD) | Faucet |
|---------|-------|--------|------------|--------|
| **Polygon Amoy** | POL | 0.5 | FREE | [faucet.polygon.technology](https://faucet.polygon.technology/) |
| **Polygon Mainnet** | POL | 0.5 | $0.50 | Buy on exchange |
| **Ethereum Sepolia** | ETH | 0.5 | FREE | [sepoliafaucet.com](https://sepoliafaucet.com/) |
| **BSC Testnet** | BNB | 0.1 | FREE | [testnet.bnbchain.org/faucet](https://testnet.bnbchain.org/faucet-smart) |
| **Arbitrum Sepolia** | ETH | 0.1 | FREE | [faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia) |
| **Base Sepolia** | ETH | 0.1 | FREE | [docs.base.org/tools/network-faucets](https://docs.base.org/tools/network-faucets) |
| **Ethereum Mainnet** | ETH | 0.01 | $35 | Buy on exchange |
| **BSC Mainnet** | BNB | 0.005 | $3 | Buy on exchange |
| **Arbitrum One** | ETH | 0.0005 | $1.50 | Bridge from Ethereum |
| **Optimism** | ETH | 0.0005 | $1.50 | Bridge from Ethereum |
| **Base Mainnet** | ETH | 0.0005 | $1.50 | Bridge from Ethereum |

**Total Estimated Cost:** $8-$50 (depending on networks chosen)

### Step 2: Compile Contracts

```bash
# Compile all contracts
npx hardhat compile

# Should see:
# Compiled 15 Solidity files successfully
```

### Step 3: Run Tests

```bash
# Run all tests
npx hardhat test

# Should see:
# 40 passing (7s)
```

### Step 4: Deploy to Testnet (Recommended First)

Start with Polygon Amoy testnet:

```bash
# Deploy to Polygon Amoy
npx hardhat run scripts/deploy-v3.cjs --network polygonAmoy

# Output:
# BillHavenEscrowV3 deployed to: 0x792B01c5965D94e2875DeFb48647fB3b4dd94e15
# Fee wallet: 0x596b95782d98295283c5d72142e477d92549cde3
```

**Save the contract address!** You'll need it for frontend configuration.

### Step 5: Verify Contract on Block Explorer

```bash
npx hardhat verify --network polygonAmoy 0x792B01c5965D94e2875DeFb48647fB3b4dd94e15 "0x596b95782d98295283c5d72142e477d92549cde3"

# Should see:
# Successfully verified contract on Polygonscan
# https://amoy.polygonscan.com/address/0x792B...#code
```

### Step 6: Deploy to Mainnets

Deploy to production networks **one at a time**:

```bash
# Polygon Mainnet (Priority - lowest fees)
npx hardhat run scripts/deploy-v3.cjs --network polygon
npx hardhat verify --network polygon <CONTRACT_ADDRESS> "<FEE_WALLET>"

# BSC Mainnet (Fast & cheap)
npx hardhat run scripts/deploy-v3.cjs --network bsc
npx hardhat verify --network bsc <CONTRACT_ADDRESS> "<FEE_WALLET>"

# Arbitrum One (L2 - very low fees)
npx hardhat run scripts/deploy-v3.cjs --network arbitrum
npx hardhat verify --network arbitrum <CONTRACT_ADDRESS> "<FEE_WALLET>"

# Optimism Mainnet (L2 - very low fees)
npx hardhat run scripts/deploy-v3.cjs --network optimism
npx hardhat verify --network optimism <CONTRACT_ADDRESS> "<FEE_WALLET>"

# Base Mainnet (Coinbase L2)
npx hardhat run scripts/deploy-v3.cjs --network base
npx hardhat verify --network base <CONTRACT_ADDRESS> "<FEE_WALLET>"

# Ethereum Mainnet (LAST - high fees)
npx hardhat run scripts/deploy-v3.cjs --network ethereum
npx hardhat verify --network ethereum <CONTRACT_ADDRESS> "<FEE_WALLET>"
```

### Step 7: Update Frontend with Contract Addresses

Edit `src/config/contracts.js`:

```javascript
export const ESCROW_CONTRACT_ADDRESSES = {
  // Testnets
  80002: '0x792B01c5965D94e2875DeFb48647fB3b4dd94e15', // Polygon Amoy
  11155111: '0x...', // Sepolia

  // Mainnets
  137: '0x...', // Polygon
  1: '0x...', // Ethereum
  56: '0x...', // BSC
  42161: '0x...', // Arbitrum
  10: '0x...', // Optimism
  8453: '0x...', // Base
};
```

Also update `.env`:

```bash
VITE_POLYGON_MAINNET_CONTRACT=0x...
VITE_ETHEREUM_MAINNET_CONTRACT=0x...
# ... etc
```

### Smart Contract Deployment Checklist

- [ ] All contracts compiled successfully
- [ ] All 40 tests passing
- [ ] Deployed to testnet (Polygon Amoy)
- [ ] Contract verified on testnet explorer
- [ ] Tested on testnet (create bill, claim, confirm)
- [ ] Deployed to mainnet(s)
- [ ] Contracts verified on mainnet explorers
- [ ] Contract addresses updated in `contracts.js`
- [ ] Environment variables updated

---

## Post-Deployment Configuration

### 1. Supabase Database Setup

The database should already be configured from development, but verify:

```bash
# Connect to Supabase
# Dashboard: https://supabase.com/dashboard

# Verify tables exist:
# - profiles
# - bills
# - platform_settings

# Verify RLS policies are enabled

# Create admin user (if needed):
# 1. Sign up through your app
# 2. In Supabase dashboard, go to Authentication > Users
# 3. Find your user, note the ID
# 4. Go to Table Editor > profiles
# 5. Update your user: SET role = 'admin'
```

### 2. Stripe Dashboard Configuration

Enable payment methods:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/settings/payment_methods)
2. Enable:
   - ✅ Cards (already enabled)
   - ✅ iDEAL (Netherlands)
   - ✅ Bancontact (Belgium)
   - ✅ SEPA Direct Debit (Europe)
   - ✅ SOFORT (Germany/Austria)
   - ✅ Klarna (Europe)
   - ✅ Google Pay
   - ✅ Apple Pay (requires domain verification)

### 3. Update CORS Settings

Update `server/index.js` to allow your Vercel domain:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app',
    'https://billhaven.app', // your custom domain
  ],
  credentials: true
};
```

Redeploy backend after changes.

### 4. Update Frontend API URLs

Update frontend to use production backend:

```javascript
// In src/services/*.js files, replace:
const API_URL = 'http://localhost:3001';

// With:
const API_URL = process.env.VITE_BACKEND_URL || 'https://billhaven-production.up.railway.app';
```

Add to Vercel environment variables:
```
VITE_BACKEND_URL=https://billhaven-production.up.railway.app
```

### Post-Deployment Checklist

- [ ] Supabase database accessible
- [ ] Admin user created
- [ ] Stripe payment methods enabled
- [ ] Stripe webhook working
- [ ] OpenNode webhook working (if using Lightning)
- [ ] CORS configured for production domains
- [ ] Frontend points to production backend
- [ ] All environment variables verified

---

## Verification & Testing

### 1. Health Checks

Test all endpoints are responding:

```bash
# Frontend health
curl https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app

# Backend health
curl https://billhaven-production.up.railway.app/health

# Should return:
# {"status":"ok","timestamp":"...","services":{"database":"ok","stripe":"ok"}}
```

### 2. Test User Flow

1. **Sign Up**
   - Go to your frontend URL
   - Click "Sign Up"
   - Create test account
   - Verify email confirmation

2. **Create Bill**
   - Navigate to "Submit Bill"
   - Fill form with test data
   - Upload receipt image
   - Submit

3. **Admin Approval**
   - Login as admin
   - Go to "Review Bills"
   - Approve test bill
   - Verify status changes

4. **Payment Flow**
   - Login as second test user
   - Go to "Public Bills"
   - Claim the test bill
   - Select payment method

### 3. Test Payment Methods

#### Test iDEAL Payment

```bash
# Use Stripe test bank account
Bank: TESTNL99TEST0123456789
Amount: €1.00

# Should succeed instantly
# Check Stripe Dashboard > Payments
# Verify webhook received in Railway logs
# Verify bill status updated in Supabase
```

#### Test Credit Card Payment

```bash
# Use Stripe test card
Card: 4000 0027 6000 3184 (requires 3D Secure)
Expiry: 12/34
CVC: 123

# Should trigger 3D Secure popup
# Complete authentication
# Verify payment succeeds
# Check hold period applied (7 days for NEW_USER)
```

#### Test Lightning Payment

```bash
# Create Lightning invoice via OpenNode
# Pay with test Lightning wallet
# Verify instant confirmation (<5 seconds)
# Check OpenNode dashboard for payment
# Verify webhook received
```

### 4. Test Smart Contract

Using Hardhat console:

```bash
npx hardhat console --network polygon

# In console:
const Escrow = await ethers.getContractFactory("BillHavenEscrowV3");
const escrow = await Escrow.attach("0x...");

// Check deployment
console.log(await escrow.feeWallet());
console.log(await escrow.owner());

// Test creating a bill
const tx = await escrow.createBill(
  "Test Bill",
  ethers.parseEther("0.1"),
  ethers.ZeroAddress, // native token
  "NEW_USER",
  "IDEAL",
  { value: ethers.parseEther("0.1") }
);

await tx.wait();
console.log("Bill created:", tx.hash);
```

### Verification Checklist

- [ ] Frontend loads without errors
- [ ] Backend /health endpoint responds
- [ ] User registration works
- [ ] Bill submission works
- [ ] Admin approval works
- [ ] Payment flow works
- [ ] At least one payment method tested successfully
- [ ] Smart contract interaction works
- [ ] Webhook confirmations received
- [ ] Database updates correctly

---

## Troubleshooting

### Frontend Issues

#### Build Fails

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build

# Check for missing environment variables
grep VITE_ .env
```

#### White Screen on Load

```bash
# Check browser console for errors
# Common issues:
# - Missing VITE_SUPABASE_URL
# - Incorrect contract addresses
# - CORS errors (check backend CORS settings)
```

### Backend Issues

#### Server Not Starting

```bash
# Check logs
railway logs

# Common issues:
# - Port already in use (Railway assigns automatically)
# - Missing environment variables
# - Database connection failed
```

#### Webhook Not Receiving Events

```bash
# Test webhook manually
curl -X POST https://your-backend.railway.app/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"payment_intent.succeeded"}'

# Check Railway logs for errors
# Verify webhook URL in Stripe dashboard
# Verify STRIPE_WEBHOOK_SECRET is correct
```

### Smart Contract Issues

#### Deployment Fails

```bash
# Check gas funds
npx hardhat run scripts/check-balance.js --network polygon

# Increase gas limit in hardhat.config.cjs
polygon: {
  gas: 5000000,
  gasPrice: 50000000000 // 50 gwei
}

# Try again
npx hardhat run scripts/deploy-v3.cjs --network polygon
```

#### Transaction Fails

```bash
# Check transaction on block explorer
# Common issues:
# - Insufficient gas
# - Contract paused
# - Invalid parameters
# - Hold period not elapsed
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Backend not running | Check Railway deployment status |
| `Unauthorized` | Wrong API key | Verify environment variables |
| `Contract not deployed` | Missing contract address | Update contracts.js |
| `Invalid signature` | Wrong webhook secret | Update STRIPE_WEBHOOK_SECRET |
| `Insufficient funds` | Not enough gas | Fund deployer wallet |
| `CORS error` | Backend CORS misconfigured | Update corsOptions in server/index.js |

---

## Production Checklist

Before going live with real users:

### Security

- [ ] All private keys secured (not in version control)
- [ ] Environment variables use secrets management
- [ ] HTTPS enabled on all domains
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Input sanitization enabled
- [ ] Error monitoring (Sentry) configured

### Performance

- [ ] Build optimized (npm run build)
- [ ] Code splitting enabled
- [ ] Images optimized (WebP)
- [ ] CDN configured (Vercel CDN)
- [ ] Database indexes created
- [ ] Caching headers set

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database monitoring (Supabase Dashboard)
- [ ] Webhook monitoring (Stripe Dashboard)

### Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] GDPR compliance (EU users)
- [ ] KYC requirements reviewed (if applicable)

### Testing

- [ ] All payment methods tested
- [ ] All user flows tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested
- [ ] Smart contracts audited (for mainnet)
- [ ] Load testing completed

---

## Support

If you encounter issues during deployment:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review logs:
   - Vercel: `vercel logs`
   - Railway: `railway logs`
   - Hardhat: Check terminal output
3. Consult documentation:
   - [Vercel Docs](https://vercel.com/docs)
   - [Railway Docs](https://docs.railway.app)
   - [Hardhat Docs](https://hardhat.org/docs)
   - [Stripe Docs](https://stripe.com/docs)
4. Contact support:
   - Email: dev@billhaven.com
   - Discord: [discord.gg/billhaven](https://discord.gg/billhaven)

---

**Deployment Guide Version:** 1.0
**Last Updated:** 2025-12-02
**Estimated Time:** 3-4 hours (full deployment)
