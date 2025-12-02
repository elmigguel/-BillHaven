# CRITICAL FIXES REQUIRED - BILLHAVEN
**Priority:** IMMEDIATE - Fix before any production use
**Date:** 2025-12-01

---

## FIX 1: Credit Card Hold Periods = 0 (CRITICAL)

### Problem
Credit card payments have 0-day hold periods, but chargebacks can occur up to 180 days later.

### Location
`/home/elmigguel/BillHaven/src/services/trustScoreService.js`

### Current Code (BROKEN)
```javascript
CREDIT_CARD: {
  [TrustLevel.NEW_USER]: 0,      // ❌ INSTANT - DANGEROUS
  [TrustLevel.VERIFIED]: 0,      // ❌ INSTANT
  [TrustLevel.TRUSTED]: 0,       // ❌ INSTANT
  [TrustLevel.POWER_USER]: 0     // ❌ INSTANT
}
```

### Required Fix
```javascript
CREDIT_CARD: {
  [TrustLevel.NEW_USER]: 7 * 24 * 3600,    // 7 days
  [TrustLevel.VERIFIED]: 3 * 24 * 3600,    // 3 days
  [TrustLevel.TRUSTED]: 24 * 3600,         // 1 day
  [TrustLevel.POWER_USER]: 12 * 3600       // 12 hours
}
```

### Impact Without Fix
- 2-5% fraud rate on credit cards
- 180-day chargeback window
- Platform liable for ALL chargebacks
- Potential loss of payment processor

---

## FIX 2: Missing SolanaWalletProvider (CRITICAL)

### Problem
Solana payments will crash because the provider is not in the component tree.

### Location
`/home/elmigguel/BillHaven/src/App.jsx`

### Current Code (BROKEN)
```jsx
<WalletProvider>
  <TonWalletProvider>
    <Routes>...
    // ❌ SolanaWalletProvider MISSING
```

### Required Fix
```jsx
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';

// In component tree:
<WalletProvider>
  <TonWalletProvider>
    <SolanaWalletProvider>  {/* ✅ ADD THIS */}
      <Routes>...
    </SolanaWalletProvider>
  </TonWalletProvider>
</WalletProvider>
```

### Impact Without Fix
- All Solana payments crash immediately
- Error: "useSolanaWallet must be used within SolanaWalletProvider"

---

## FIX 3: V3 Contract Address Not in contracts.js

### Problem
V3 contract is deployed but not referenced in the config.

### Location
`/home/elmigguel/BillHaven/src/config/contracts.js`

### Current Code (OUTDATED)
```javascript
export const ESCROW_ADDRESSES = {
  137: "",  // Polygon Mainnet - EMPTY
```

### Required Fix
```javascript
export const ESCROW_ADDRESSES = {
  137: "0x8beED27aA6d28FE42a9e792d81046DD1337a8240",  // Polygon Mainnet - V3 LIVE
```

### Note
escrowServiceV3.js already has this address, but contracts.js needs syncing for consistency.

---

## FIX 4: SEPA Regular Hold Period

### Problem
SEPA regular takes 1-2 business days to settle but has 0 hold period.

### Location
`/home/elmigguel/BillHaven/src/services/trustScoreService.js`

### Current Code
```javascript
SEPA: {
  [TrustLevel.NEW_USER]: 0,      // ❌ Bank hasn't confirmed yet!
```

### Note
The comments say "INSTANT after bank settlement" which is correct philosophy.
BUT need webhook integration to know WHEN bank settles.

### Recommendation
Keep as 0 BUT add comment clarifying this requires Mollie/Stripe webhook to confirm actual settlement before release is possible.

---

## VERIFICATION COMMANDS

After fixing, run:

```bash
# Build check
cd /home/elmigguel/BillHaven
npm run build

# Test check
npx hardhat test

# Manual verification
grep -n "CREDIT_CARD" src/services/trustScoreService.js
grep -n "SolanaWalletProvider" src/App.jsx
grep -n "0x8beED27aA6d28FE42a9e792d81046DD1337a8240" src/config/contracts.js
```

---

## DEPLOYMENT CHECKLIST

After fixes:
- [ ] npm run build succeeds
- [ ] npx hardhat test passes (40/40)
- [ ] Credit card hold periods > 0
- [ ] SolanaWalletProvider in App.jsx
- [ ] V3 address in contracts.js
- [ ] Deploy to Vercel
- [ ] Test live app loads
- [ ] Test wallet connection works

---

**Document Version:** 1.0
**Status:** ACTION REQUIRED
