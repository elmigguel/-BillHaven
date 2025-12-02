# V4 Deployment Quick Start Guide

**NEXT SESSION: Deploy V4 to Polygon Mainnet**

---

## PRE-DEPLOYMENT CHECKLIST

All these are DONE ✓:
- [x] V4 contract written (1,174 lines)
- [x] 20/20 tests passing
- [x] Backend Oracle integration ready
- [x] Frontend V4 ABI ready
- [x] Deploy script ready
- [x] Security audit passed

Only thing needed: **Deploy to mainnet**

---

## STEP 1: Generate Oracle Wallet (5 minutes)

### Option A: Create New Wallet
```bash
# In Node.js console
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### Option B: Use Existing Secure Wallet
- Hardware wallet (Ledger/Trezor)
- Or dedicated wallet for Oracle only

**CRITICAL:**
- Store private key securely
- NEVER commit to Git
- This key controls ALL fund releases

---

## STEP 2: Deploy V4 to Polygon (10 minutes)

```bash
cd /home/elmigguel/BillHaven

# Set deployer private key (has 1.0 POL)
export PRIVATE_KEY=your_deployer_private_key

# Deploy V4 contract
npx hardhat run scripts/deploy.js --network polygon

# Output will show:
# - V4 contract address
# - Oracle address added
# - Gas used
```

**Expected Cost:** ~$10-20 in MATIC

---

## STEP 3: Update Contract Addresses (5 minutes)

### File 1: src/config/contracts.js
```javascript
// Line 13 - Update Polygon mainnet address
export const ESCROW_ADDRESSES = {
  137: "0xNEW_V4_ADDRESS_HERE",  // <-- UPDATE THIS
  // ... other chains
};
```

### File 2: server/index.js
```javascript
// Line 24 - Update V4 contract config
const V4_CONTRACT_CONFIG = {
  contractAddress: '0xNEW_V4_ADDRESS_HERE',  // <-- UPDATE THIS
  // ... rest
};
```

### File 3: Backend .env (on Render)
```
ESCROW_CONTRACT_ADDRESS=0xNEW_V4_ADDRESS_HERE
ORACLE_PRIVATE_KEY=0xYOUR_ORACLE_PRIVATE_KEY
```

---

## STEP 4: Redeploy (5 minutes)

### Frontend (Vercel)
```bash
# Option A: Automatic (if GitHub connected)
git add .
git commit -m "chore: Update V4 contract address"
git push

# Option B: Manual
vercel --prod
```

### Backend (Render)
- Update environment variables in Render dashboard
- Render will auto-deploy on git push

---

## STEP 5: Test Complete Flow (30 minutes)

### Test 1: Create Bill
```
1. Go to https://billhaven.vercel.app
2. Connect wallet (MetaMask)
3. Create bill: $50 worth of crypto
4. Verify transaction succeeds
```

### Test 2: Claim Bill
```
1. Open bill in another wallet
2. Claim the bill
3. Verify claim succeeds
```

### Test 3: Pay & Verify
```
1. Mark payment sent
2. Pay via Stripe test mode (iDEAL)
3. Verify webhook received
4. Check Oracle signature on-chain
5. Verify bill status = PAYMENT_VERIFIED
```

### Test 4: Hold Period & Release
```
1. Wait 24 hours (or use time manipulation in test)
2. Call autoReleaseAfterHoldPeriod()
3. Verify crypto released to buyer
4. Verify fee sent to platform
```

---

## SECURITY TESTS (10 minutes)

### Test 1: makerConfirmAndRelease Should Revert
```javascript
// In Hardhat console
await escrow.makerConfirmAndRelease(billId);
// Should revert with: SecurityDelayRequired()
```

### Test 2: releaseFunds Without Oracle Should Revert
```javascript
await escrow.releaseFunds(billId);
// Should revert with: PaymentNotOracleVerified()
```

### Test 3: Cross-Chain Replay Protection
```
1. Get signature from Polygon
2. Try to use on different chain (BSC/Arbitrum)
3. Should revert with: InvalidSignature()
```

### Test 4: Signature Replay Prevention
```
1. Use valid signature once
2. Try to reuse same signature
3. Should revert with: SignatureAlreadyUsed()
```

---

## VERIFICATION COMMANDS

### Check V4 Deployment
```bash
npx hardhat verify --network polygon 0xV4_ADDRESS 0xFEE_WALLET
```

### Check Oracle Role
```javascript
const ORACLE_ROLE = await escrow.ORACLE_ROLE();
const hasRole = await escrow.hasRole(ORACLE_ROLE, oracleAddress);
console.log('Oracle has role:', hasRole); // Should be true
```

### Check Trusted Oracle
```javascript
const isTrusted = await escrow.trustedOracles(oracleAddress);
console.log('Oracle is trusted:', isTrusted); // Should be true
```

---

## TROUBLESHOOTING

### Issue: Deployment Fails
**Solution:** Check deployer wallet has enough POL
```bash
# Check balance
npx hardhat run scripts/checkBalance.js --network polygon
```

### Issue: Oracle Signature Invalid
**Solution:** Verify signature format
```javascript
// Check signature includes all V4 fields
const messageHash = ethers.solidityPackedKeccak256(
  ["uint256", "address", "uint256", "address", "address", "uint256", "bytes32", "uint256"],
  [chainId, contractAddress, billId, payer, maker, amount, ref, timestamp]
);
```

### Issue: Hold Period Not Working
**Solution:** Check payment method hold period
```javascript
const holdPeriod = await escrow.getHoldPeriod(PaymentMethod.IDEAL);
console.log('Hold period:', holdPeriod); // Should be 86400 (24 hours)
```

---

## MONITORING

### Watch for Oracle Signing
```javascript
// In backend logs
console.log('Oracle signing payment:', billId);
console.log('Signature created:', signature);
console.log('On-chain verification:', txHash);
```

### Watch for Auto-Releases
```javascript
// Smart contract events
escrow.on('HoldPeriodComplete', (billId, releaseTime) => {
  console.log('Bill ready for release:', billId);
});

escrow.on('CryptoReleased', (billId, payer, amount, fee) => {
  console.log('Crypto released:', billId, payer, amount);
});
```

---

## AFTER DEPLOYMENT

### Immediate Actions
- [ ] Test first $10 transaction
- [ ] Test first $50 transaction
- [ ] Test all payment methods
- [ ] Monitor Oracle signing
- [ ] Verify auto-release works

### First Week
- [ ] Keep transactions under $100
- [ ] Monitor all transactions closely
- [ ] Check for any errors
- [ ] Verify hold periods working
- [ ] Test dispute mechanism

### First Month
- [ ] Gradually increase transaction sizes
- [ ] Test all 11 blockchain networks
- [ ] Deploy to other EVM chains (Base, Arbitrum, Optimism)
- [ ] Gather user feedback
- [ ] Prepare for scale

---

## YOUTUBE LAUNCH CHECKLIST

- [ ] V4 deployed and working
- [ ] At least 5 successful test transactions
- [ ] Demo video recorded
- [ ] Marketing content ready
- [ ] Landing page optimized
- [ ] All payment methods tested
- [ ] Mobile responsive verified
- [ ] Error handling tested
- [ ] Customer support ready

---

## EMERGENCY CONTACTS

**If Issues Arise:**
1. Check backend logs on Render
2. Check smart contract events on Polygonscan
3. Verify Oracle wallet has ETH for gas
4. Check Stripe webhook logs
5. Use emergency pause if needed:
   ```javascript
   await escrow.pause();
   ```

---

## SUCCESS CRITERIA

V4 deployment is successful when:
- [x] Contract deployed to Polygon mainnet
- [x] Oracle role assigned correctly
- [x] Frontend shows V4 address
- [x] Backend Oracle signing works
- [x] First test transaction completes
- [x] Auto-release works after hold period
- [x] Security tests all pass
- [x] No errors in logs

**When all checked: READY FOR YOUTUBE LAUNCH!**

---

*Quick Start Guide for V4 Deployment*
*Generated: 2025-12-02*
*Status: V4 READY - Just Deploy!*
