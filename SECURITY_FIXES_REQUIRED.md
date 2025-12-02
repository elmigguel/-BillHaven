# BILLHAVEN SECURITY FIXES - CRITICAL PRIORITY

## OVERALL SECURITY SCORE: 42/100 ⚠️

**Status:** DO NOT LAUNCH - Critical vulnerabilities present
**Vulnerabilities:** 30 total (3 critical, 8 high, 12 medium, 7 low)

---

## CRITICAL FIXES (Must Complete Before ANY Launch)

### 1. CLIENT-SIDE AMOUNT VALIDATION ⚠️ HIGHEST PRIORITY
**Files:** `creditCardPayment.js`, `lightningPayment.js`, backend API
**Risk:** Attacker can pay $10 for $10,000 bill

**Current Code (VULNERABLE):**
```javascript
// Client calculates amount - CAN BE MODIFIED
const fees = calculateFees(amountCents);
await createPaymentIntent(amountCents, currency, billId);
```

**Fix Required:**
```javascript
// BACKEND MUST VALIDATE:
app.post('/api/payments/create-intent', async (req, res) => {
  const bill = await db.bills.findById(req.body.billId);

  // CRITICAL: Use DB amount, NOT client amount
  if (req.body.amount !== bill.amountCents) {
    return res.status(400).json({ error: 'Amount mismatch' });
  }

  // Create payment with VERIFIED amount from database
  const intent = await stripe.paymentIntents.create({
    amount: bill.amountCents, // From DB, not client
    metadata: { billId: bill.id }
  });
});
```

---

### 2. NO PAYMENT VERIFICATION WEBHOOKS ⚠️ HIGHEST PRIORITY
**Files:** Backend webhook handlers (MISSING)
**Risk:** Attacker can fake payment confirmations

**Fix Required:**
```javascript
// STRIPE WEBHOOK (REQUIRED):
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Verify webhook is from Stripe
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;

    // ONLY NOW mark payment as confirmed in database
    await db.bills.update({
      id: pi.metadata.billId,
      paymentStatus: 'confirmed',
      paymentIntentId: pi.id
    });
  }

  res.json({ received: true });
});
```

**NEVER trust client-side payment status!**

---

### 3. CLIENT-SIDE TRUST SCORE CALCULATION ⚠️ CRITICAL
**Files:** `trustScoreService.js`
**Risk:** Attacker can fake POWER_USER status → instant release

**Current Code (VULNERABLE):**
```javascript
// Client calculates trust score - CAN BE MODIFIED
export function calculateTrustScore(profile) {
  let score = 0;
  score += (profile.successful_trades || 0) * 10;
  return score;
}
```

**Fix Required:**
```javascript
// MOVE TO BACKEND:
app.get('/api/users/:id/trust', async (req, res) => {
  // Fetch from database (client can't modify)
  const profile = await db.trustProfiles.findById(req.params.id);

  // Calculate on server
  const score = calculateTrustScore(profile);
  const level = calculateTrustLevel(profile);
  const holdPeriod = getHoldPeriod(paymentMethod, level);

  res.json({ score, level, holdPeriod });
});
```

---

### 4. INSTANT RELEASE FOR HIGH-RISK PAYMENTS ⚠️ CRITICAL
**Files:** `trustScoreService.js:84-185`
**Risk:** Credit cards have 120-day chargeback window, yet release is instant

**Current Code (DANGEROUS):**
```javascript
CREDIT_CARD: {
  [TrustLevel.NEW_USER]: 0,      // INSTANT - Should be 14 days!
  [TrustLevel.VERIFIED]: 0,
  [TrustLevel.TRUSTED]: 0,
  [TrustLevel.POWER_USER]: 0
}
```

**Fix Required:**
```javascript
CREDIT_CARD: {
  [TrustLevel.NEW_USER]: 14 * 24 * 3600,      // 14 days
  [TrustLevel.VERIFIED]: 7 * 24 * 3600,       // 7 days
  [TrustLevel.TRUSTED]: 3 * 24 * 3600,        // 3 days
  [TrustLevel.POWER_USER]: 24 * 3600          // 24 hours (NOT 0!)
},

SEPA: {
  [TrustLevel.NEW_USER]: 3 * 24 * 3600,       // 3 days
  [TrustLevel.VERIFIED]: 2 * 24 * 3600,
  [TrustLevel.TRUSTED]: 24 * 3600,
  [TrustLevel.POWER_USER]: 12 * 3600
}
```

---

## HIGH PRIORITY FIXES (Before Beta Launch)

### 5. RACE CONDITION - DOUBLE CLAIMING
**Files:** `PaymentFlow.jsx`, backend bill claiming
**Risk:** Same bill claimed twice simultaneously

**Fix:**
```sql
-- Add database constraint:
CREATE UNIQUE INDEX idx_bills_claimed
ON bills(id) WHERE claimed_at IS NOT NULL;

-- Use database transaction:
BEGIN;
  UPDATE bills
  SET payer_id = $1, claimed_at = NOW()
  WHERE id = $2 AND claimed_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;
COMMIT;
```

---

### 6. NO BLOCKCHAIN CONFIRMATION DEPTH
**Files:** `solanaPayment.js`, all blockchain services
**Risk:** 1-confirmation transactions can be reversed

**Fix:**
```javascript
const CONFIRMATIONS_REQUIRED = {
  solana: 32,     // ~13 seconds
  ethereum: 12,   // ~3 minutes
  polygon: 128    // ~4 minutes
};

// Wait for confirmations
while (confirmations < CONFIRMATIONS_REQUIRED[network]) {
  await sleep(1000);
  confirmations = await getConfirmations(txHash);
}
```

---

### 7. NO BACKEND TRANSACTION VERIFICATION
**Files:** Backend verification endpoints (MISSING)
**Risk:** Fake transaction hashes accepted

**Fix:**
```javascript
app.post('/api/bills/:id/claim', async (req, res) => {
  const { txHash } = req.body;

  // Verify on blockchain
  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    return res.status(400).json({ error: 'Invalid transaction' });
  }

  // Decode and verify it's a claim for this bill
  const decoded = contract.interface.parseTransaction(tx);
  if (decoded.name !== 'claimBill' ||
      decoded.args.billId !== bill.escrow_bill_id) {
    return res.status(400).json({ error: 'Wrong transaction' });
  }

  // Now update database
  await db.bills.update({ id, claimedAt: new Date() });
});
```

---

### 8. PAYMENT PROOF UPLOAD - NO VALIDATION
**Files:** `PaymentFlow.jsx`, backend upload
**Risk:** Fake screenshots waste time, enable spam

**Fix:**
```javascript
async function validatePaymentProof(file, bill) {
  // Validate file type
  if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
    throw new Error('Invalid file type');
  }

  // Validate file size
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Max 5MB');
  }

  // Extract EXIF to verify timestamp
  const exif = await extractExif(file);
  if (exif.timestamp < bill.createdAt) {
    throw new Error('Screenshot predates bill');
  }
}
```

---

## MEDIUM PRIORITY (Before Production)

### 9. localStorage AUTH TOKENS
**Risk:** XSS can steal tokens
**Fix:** Use httpOnly cookies

### 10. XSS IN PAYMENT INSTRUCTIONS
**Risk:** Malicious scripts in user input
**Fix:** Use DOMPurify.sanitize()

### 11. WALLET ADDRESS SPOOFING
**Risk:** Users can edit wallet address manually
**Fix:** Disable editing, use connected wallet only

### 12. FRAUD DETECTION MISSING
**Risk:** Collusion attacks, Sybil attacks
**Fix:** Implement pattern detection system

---

## IMPLEMENTATION TIMELINE

### Week 1 (CRITICAL)
- [ ] Backend amount validation
- [ ] Payment verification webhooks
- [ ] Trust score backend calculation
- [ ] Realistic hold periods

**Deliverable:** System safe from basic financial attacks

### Week 2 (HIGH)
- [ ] Database transaction locking
- [ ] Blockchain confirmation depth
- [ ] Backend transaction verification
- [ ] Payment proof validation

**Deliverable:** Beta-ready security

### Week 3-4 (MEDIUM)
- [ ] httpOnly cookie auth
- [ ] XSS protection
- [ ] Wallet validation
- [ ] Fraud detection system

**Deliverable:** Production-ready security

---

## TESTING CHECKLIST

Before launch, verify:

### Payment Security
- [ ] Cannot modify payment amount in DevTools
- [ ] Cannot forge payment confirmations
- [ ] Webhooks reject invalid signatures
- [ ] Backend validates ALL amounts against database

### Trust System
- [ ] Cannot modify trust scores client-side
- [ ] Hold periods enforced on-chain/backend
- [ ] Collusion attacks detected
- [ ] Velocity limits work

### Blockchain
- [ ] Fake transaction hashes rejected
- [ ] Confirmations counted correctly
- [ ] Reorganizations don't cause double-spends
- [ ] All blockchain data verified server-side

### General
- [ ] XSS attacks fail
- [ ] Auth tokens in httpOnly cookies
- [ ] Race conditions prevented
- [ ] Error messages don't leak info

---

## COST ESTIMATE

**Internal Development:**
- Backend security fixes: 80-120 hours
- Testing & QA: 40 hours
- Total: $10,000 - $15,000 (at $100/hr)

**External Security Audit (Recommended):**
- Smart contract audit: $15,000 - $25,000
- Full-stack audit: $10,000 - $20,000
- Total: $25,000 - $45,000

**Bug Bounty Program:**
- Critical: $5,000 - $10,000
- High: $1,000 - $5,000
- Medium: $500 - $1,000

---

## QUESTIONS FOR DEVELOPMENT TEAM

1. **Do you have a backend API server?**
   - If NO: Must build one (most critical fixes require backend)
   - If YES: Which framework? (Express, FastAPI, etc.)

2. **Is Supabase being used for database?**
   - If YES: Can use Supabase RLS + Edge Functions
   - If NO: Need traditional backend

3. **Are webhook endpoints configured?**
   - Stripe webhook secret set?
   - OpenNode webhook configured?
   - Endpoint URLs registered with providers?

4. **What's the deployment timeline?**
   - Testnet only: Can launch with fewer fixes
   - Mainnet: Must fix ALL critical issues

5. **Is there a bug bounty budget?**
   - Recommended: $50,000 pool
   - Helps find issues before attackers do

---

## CONTACTS FOR HELP

**Smart Contract Auditors:**
- OpenZeppelin (https://openzeppelin.com/security-audits/)
- Trail of Bits (https://www.trailofbits.com/)
- ConsenSys Diligence (https://consensys.net/diligence/)

**Web3 Security:**
- Immunefi (bug bounty platform)
- HackerOne (general bug bounty)
- Certik (automated + manual audits)

**Payment Security:**
- Stripe Support (webhook setup)
- OWASP (security best practices)
- PCI DSS Compliance (if storing card data)

---

## FINAL RECOMMENDATION

**DO NOT LAUNCH** until at minimum:
1. ✅ Backend amount validation implemented
2. ✅ Payment verification webhooks working
3. ✅ Trust scores calculated server-side
4. ✅ Hold periods set to realistic values (14d+ for credit cards)

**Estimated time to minimum viable security:** 1-2 weeks

**Current risk level:** CRITICAL
**Target risk level:** MEDIUM (acceptable for beta)
**Path to LOW risk:** External audit + bug bounty program

---

**Report Date:** 2025-12-01
**Full Report:** See `PAYMENT_SECURITY_AUDIT_REPORT.md` for detailed analysis
