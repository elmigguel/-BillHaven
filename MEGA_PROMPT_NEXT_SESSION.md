# BILLHAVEN MEGA PROMPT - Next Session Continuation

## CRITICAL: READ THESE FILES FIRST

Before doing ANYTHING, read these files to understand the complete context:

```
1. /home/elmigguel/BillHaven/SESSION_REPORT_2025-12-02_V4_SECURITY.md
2. /home/elmigguel/BillHaven/MEGA_EXPERT_AUDIT_REPORT_2025-12-02.md
3. /home/elmigguel/BillHaven/SMART_CONTRACT_SECURITY_AUDIT_V3_FINAL.md
4. /home/elmigguel/BillHaven/contracts/BillHavenEscrowV4.sol
5. /home/elmigguel/BillHaven/server/index.js
6. /home/elmigguel/BillHaven/src/config/contracts.js
7. /home/elmigguel/BillHaven/.env
8. /home/elmigguel/BillHaven/test/BillHavenEscrowV4.test.cjs
```

Also scan ALL .md files in the project:
```bash
find /home/elmigguel/BillHaven -name "*.md" -type f | head -50
```

---

## PROJECT STATUS

### COMPLETED:
- [x] Frontend deployed: https://billhaven.vercel.app
- [x] Backend deployed: https://billhaven.onrender.com
- [x] Database configured: Supabase
- [x] V3 contract on Polygon: 0x8beED27aA6d28FE42a9e792d81046DD1337a8240
- [x] V4 contract written and tested (20/20 tests passing)
- [x] Backend Oracle signing ready
- [x] Frontend V4 ABI ready
- [x] All security fixes applied

### PENDING (THIS SESSION):
- [ ] Deploy V4 to Polygon Mainnet
- [ ] Update contract addresses everywhere
- [ ] Test complete payment flow
- [ ] YouTube launch preparation
- [ ] Final QA testing

---

## V4 SECURITY FEATURES (IMPORTANT!)

The V4 contract has these CRITICAL security improvements:

1. **Oracle Verification MANDATORY** - No release without backend signature
2. **makerConfirmAndRelease() BLOCKED** - Always reverts
3. **24-hour minimum hold period** - All fiat payments
4. **Cross-chain replay protection** - ChainId in signature
5. **5-minute signature window** - Reduced from 1 hour
6. **Signature replay tracking** - Prevents reuse

---

## DEPLOYMENT COMMANDS

```bash
# 1. First, ensure Oracle wallet private key is set
# IMPORTANT: Use a NEW wallet just for Oracle signing!
export ORACLE_PRIVATE_KEY=0x...

# 2. Deploy V4 to Polygon
cd /home/elmigguel/BillHaven
npx hardhat run scripts/deploy.js --network polygon

# 3. After deployment, update contract address in:
#    - src/config/contracts.js (line 13: ESCROW_ADDRESSES[137])
#    - server/index.js (line 24: V4_CONTRACT_CONFIG.contractAddress)

# 4. Redeploy frontend
vercel --prod

# 5. Backend will auto-deploy on Render after git push
```

---

## KEY FILES TO UPDATE AFTER DEPLOYMENT

### src/config/contracts.js
```javascript
// Line 13 - Update with new V4 address
137: "0xNEW_V4_ADDRESS_HERE",
```

### server/index.js
```javascript
// Line 24 - Update with new V4 address
contractAddress: process.env.ESCROW_CONTRACT_ADDRESS || '0xNEW_V4_ADDRESS_HERE',
```

### .env (backend on Render)
```
ESCROW_CONTRACT_ADDRESS=0xNEW_V4_ADDRESS_HERE
ORACLE_PRIVATE_KEY=0x...
```

---

## TESTING CHECKLIST

After deployment, test these scenarios:

### Happy Path:
1. Create bill (seller locks crypto)
2. Claim bill (buyer)
3. Mark payment sent (buyer)
4. Stripe payment succeeds
5. Backend Oracle verifies on-chain
6. Wait 24 hours (or use time manipulation for testing)
7. Auto-release triggers
8. Buyer receives crypto

### Security Tests:
1. Try makerConfirmAndRelease() - should ALWAYS revert
2. Try releaseFunds() without Oracle - should revert
3. Try makerConfirmPayment() without Oracle - should revert
4. Verify Oracle signing works

---

## AGENTS TO USE

For comprehensive testing, spawn these agents:

1. **gemini-researcher** - Research Polygon gas optimization
2. **Explore** - Find any remaining issues in codebase
3. **Plan** - Plan YouTube launch content

---

## YOUTUBE LAUNCH CHECKLIST

- [ ] V4 deployed and working
- [ ] Complete payment flow tested
- [ ] All error cases handled
- [ ] Mobile responsive verified
- [ ] Wallet connections tested (MetaMask, TON, Solana)
- [ ] Landing page polished
- [ ] Demo video ready

---

## CRITICAL REMINDERS

1. **NEVER share Oracle private key** - It controls fund releases
2. **Test on mainnet with small amounts first**
3. **Monitor first few transactions closely**
4. **Have emergency pause ready if issues arise**

---

## CONVERSATION CONTEXT

The user is Dutch and prefers:
- Direct, practical instructions
- Step-by-step guidance
- Running agents autonomously
- Thorough testing before launch
- Getting to 100% production ready

Last session ended with V4 code complete, awaiting deployment.

---

## START COMMAND

Begin the session by:

1. Reading all .md files listed above
2. Checking current deployment status
3. Deploying V4 to Polygon
4. Testing complete flow
5. Preparing for YouTube launch

Use world-class expert agents for every critical step!

---

*Generated: 2025-12-02*
*For: BillHaven V4 Deployment Session*
