# PROJECT CHIMERA: BillHaven Marktleider Plan

**Doel:** €50.000 MRR + #1 P2P Crypto Escrow Platform
**Huidige Status:** 70% compleet, Security 6.8/10
**Geschatte tijd tot launch:** 4-5 weken
**Plan Datum:** 2025-12-06

---

## EXECUTIVE SUMMARY

BillHaven heeft een solide basis maar mist **3 kritieke items** voor productie:
1. **Wallet Setup** - Oracle + Deployer wallets niet geconfigureerd
2. **Security Gaps** - Tests ontbreken, geen audit, single Oracle risk
3. **Revenue Features** - Money Streaming, DeFi, AI Tax tools niet gebouwd

---

## HUIDIGE STATUS OVERZICHT

### Deployment Status
| Component | Status | Details |
|-----------|--------|---------|
| Frontend (Vercel) | ✅ LIVE | https://billhaven.vercel.app |
| Backend (Render) | ⚠️ Incomplete | ORACLE_PRIVATE_KEY ontbreekt |
| Polygon Contract V3 | ✅ Deployed | 0x8beED27aA6d28FE42a9e792d81046DD1337a8240 |
| Andere chains | ❌ Niet deployed | Ethereum, BSC, Arbitrum, Optimism, Base |
| Deployer Wallet | ❌ MOET AANGEMAAKT | Nodig voor contract deployment |
| Oracle Wallet | ❌ MOET AANGEMAAKT | Nodig voor payment verification |

### Feature Implementation Status
| Feature | Completeness | Files | Impact on €50k MRR |
|---------|--------------|-------|-------------------|
| Premium Subscriptions | 95% | premiumService.js, Premium.jsx | €15k/mo target |
| Invoice Factoring | 90% | invoiceFactoringService.js | €7.5k/mo target |
| Referral System (3-tier) | 92% | referralService.js | Growth driver |
| Multi-Chain Support | 85% | 7 payment adapters | - |
| Gamification/Quests | 85% | questService.js | Retention |
| Reputation System | 88% | reputationService.js | Trust |
| P2P Chat | 80% | chatService.js | UX |
| **Money Streaming** | 0% | NOT BUILT | €5k/mo MISSING |
| **Tax Benefit Simulator** | 5% | MINIMAL | KILLER FEATURE |
| **DeFi Integration** | 0% | NOT BUILT | €2.5k/mo MISSING |
| **AI Accountant** | 0% | NOT BUILT | Premium driver |

### Security Scores
| Category | Score | Status |
|----------|-------|--------|
| Smart Contracts | 5.5/10 | ⚠️ V4 fixt critical issues |
| Backend Security | 7.5/10 | ✅ Good, needs logging |
| Frontend Security | 7.0/10 | ✅ Good sanitization |
| Database (Supabase) | 6.0/10 | ⚠️ RLS needs verification |
| Testing Infrastructure | 2.0/10 | ❌ CRITICAL - No tests |
| Production Infrastructure | 4.0/10 | ❌ Missing key components |
| **OVERALL** | **6.8/10** | **NOT PRODUCTION READY** |

---

## FASE 1: KRITIEKE BLOKKADES (Vandaag - 2 uur)

### 1.1 Deployer Wallet Aanmaken
```
□ Nieuwe wallet aanmaken (MetaMask of hardware wallet)
□ Private key veilig opslaan (NOOIT delen!)
□ Toevoegen aan .env: DEPLOYER_PRIVATE_KEY=0x...
□ Funden met ~$5 POL voor gas fees
```

### 1.2 Oracle Wallet Aanmaken
```
□ APARTE wallet voor backend signing
□ Private key veilig opslaan
□ Toevoegen aan Render env: ORACLE_PRIVATE_KEY=0x...
□ Public address noteren voor smart contract
```

### 1.3 Backend Environment Fixen
**File:** `server/index.js` + Render Dashboard
```
□ ORACLE_PRIVATE_KEY instellen op Render
□ ESCROW_CONTRACT_ADDRESS=0x8beED27aA6d28FE42a9e792d81046DD1337a8240
□ Backend herstarten en logs checken
□ Geen "ORACLE_PRIVATE_KEY not configured" errors
```

---

## FASE 2: SECURITY HARDENING (Week 1)

### 2.1 Smart Contract Upgrade V3 → V4
**Waarom:** V4 fixt 3 KRITIEKE vulnerabilities:
- Cross-chain replay attack (chain ID binding)
- Timestamp window 1h → 5min
- Signature replay prevention

```
□ V4 deployen naar Polygon Mainnet
□ Contract address updaten in frontend config
□ Oude V3 contract deprecaten
□ Testen op testnet eerst!
```

**Critical Issues Fixed in V4:**
1. **CRITICAL-1:** Cross-Chain Signature Replay Attack - V4 adds `block.chainid` and `address(this)` to signature hash
2. **CRITICAL-2:** Timestamp Validation Window - Reduced from 1 hour to 5 minutes
3. **CRITICAL-3:** Signature Replay Prevention - Added `usedSignatures` mapping

### 2.2 Backend Security Fixes
```
□ CORS fixen - specifieke domains, geen regex
□ Admin endpoint rate limiting toevoegen
□ Request logging implementeren (Sentry/ELK)
□ Content Security Policy (CSP) enablen
□ Audit logging voor admin acties
□ Constant-time comparison for admin key
```

**Current CORS Issue (server/index.js line 138-145):**
```javascript
// VULNERABLE - matches ANY Vercel deployment
origin: /\.vercel\.app$/

// SHOULD BE:
origin: ['https://billhaven.vercel.app', 'https://www.billhaven.com']
```

### 2.3 Multi-Signature Oracle (Aanbevolen)
```
□ 2-of-3 oracle signatures voor >$10k transacties
□ Backup oracle wallet aanmaken
□ Time-lock op kritieke operaties
```

### 2.4 Testing Infrastructure
**Huidige coverage:** ~2% (KRITIEK!)
```
□ Smart contract unit tests schrijven (Hardhat + Chai)
□ Backend integration tests (Jest)
□ Frontend E2E tests (Cypress)
□ Minimaal 50% coverage voor launch
□ CI/CD pipeline opzetten
```

**Test Files Needed:**
- `test/BillHavenEscrowV4.test.js`
- `test/TokenStreamer.test.js`
- `test/integration/payment-flow.test.js`
- `cypress/e2e/bill-creation.cy.js`

---

## FASE 3: MISSING FEATURES (Week 2-3)

### 3.1 Money Streaming (Sablier/LlamaPay competitor)
**Revenue Impact:** +15-20% MRR
**Files te maken:**
```
□ contracts/TokenStreamer.sol
□ src/services/streamingService.js
□ src/pages/Streaming.jsx
□ src/components/streaming/StreamCreate.jsx
□ src/components/streaming/StreamDashboard.jsx
□ Database: streaming_contracts table
```

**Features:**
- Stream aanmaken (salaris, abonnementen)
- Withdraw beschikbaar bedrag
- Stream annuleren
- Vesting schema's (lineair, cliff, exponentieel)
- Payment splitting (40% operationeel, 10% belasting, 50% oprichters)

**Smart Contract Spec (TokenStreamer.sol):**
```solidity
struct Stream {
    address sender;
    address recipient;
    uint256 totalAmount;
    uint256 withdrawnAmount;
    address tokenAddress;
    uint256 startTime;
    uint256 stopTime;
}

// Core functions:
- createStream(recipient, amount, token, startTime, stopTime)
- withdrawFromStream(streamId)
- cancelStream(streamId)
- getStream(streamId)
```

### 3.2 Tax Benefit Simulator (Killer Feature!)
**Revenue Impact:** Premium tier driver
**Files te maken:**
```
□ src/components/tax/TaxBenefitSimulator.jsx
□ src/utils/taxCalculations.js (uitbreiden)
□ src/pages/TaxTools.jsx
□ Backend: tax scenario API endpoints
```

**Features:**
- Interactieve belastingvoordeel calculator
- Scenario vergelijking (crypto vs fiat)
- Export naar PDF voor accountant
- Per-land belastingregels (NL, BE, DE, US)
- "Hoeveel kun je besparen?" marketing hook

### 3.3 DeFi Treasury Integration
**Revenue Impact:** Passieve inkomsten + sticky users
```
□ Aave lending integratie
□ Lido staking integratie
□ Yield dashboard
□ Auto-compound functie
□ Performance fee (kleine % op yield)
```

### 3.4 AI Accountant (Premium Feature)
```
□ Automatische transactie categorisatie
□ BTW berekening
□ Expense tracking
□ Smart insights ("Je hebt €480 aan gas fees betaald, switch naar Polygon")
□ Export voor boekhouding (CSV, QIF)
```

---

## FASE 4: MULTI-CHAIN DEPLOYMENT (Week 2)

### 4.1 Contract Deployment per Chain
| Chain | ChainId | Status | Gas Cost | Priority |
|-------|---------|--------|----------|----------|
| Polygon | 137 | ✅ Live (V3) | $0.05-0.20 | UPGRADE V4 |
| Base | 8453 | ❌ | $0.10-0.50 | HIGH |
| Arbitrum | 42161 | ❌ | $0.10-0.50 | HIGH |
| Optimism | 10 | ❌ | $0.10-0.50 | HIGH |
| BSC | 56 | ❌ | $0.20-1.00 | MEDIUM |
| Ethereum | 1 | ❌ | $30-100 | LOW |

**Deployment Command:**
```bash
npx hardhat run scripts/deploy.js --network polygon
npx hardhat run scripts/deploy.js --network base
npx hardhat run scripts/deploy.js --network arbitrum
npx hardhat run scripts/deploy.js --network optimism
```

### 4.2 Cross-Chain Features
```
□ Chain selector in UI
□ Auto-detect user's preferred chain
□ Cross-chain swap integratie (Socket/Li.Fi)
□ Unified balance dashboard
```

---

## FASE 5: PRODUCTION INFRASTRUCTURE (Week 3)

### 5.1 Security Audit
```
□ Smart contract audit aanvragen (CertiK, Trail of Bits, OpenZeppelin)
□ Budget: $5k-$15k
□ Alle findings fixen
□ Audit rapport publiceren op website
□ "Audited by [Firm]" badge op homepage
```

### 5.2 Bug Bounty Program
```
□ Immunefi programma opzetten
□ Bounty ranges:
  - Critical: $10,000 - $50,000
  - High: $2,000 - $10,000
  - Medium: $500 - $2,000
  - Low: $100 - $500
□ Scope definiëren (smart contracts, backend, frontend)
□ Responsible disclosure policy
```

### 5.3 Monitoring & Alerts
```
□ Sentry voor errors (al geïntegreerd)
□ On-chain monitoring (Forta)
□ Telegram alerts voor:
  - Grote transacties (>$10k)
  - Nieuwe disputes
  - Contract pauses
  - Unusual activity
  - Failed webhook deliveries
□ PagerDuty voor critical alerts
□ Daily summary reports
```

### 5.4 Insurance Fund
```
□ 3% van platform fees naar insurance wallet
□ Multi-sig wallet (3-of-5 signers)
□ Publiceer insurance fund address transparant
□ Transparantie dashboard op website
□ Clear payout policy documenteren
```

### 5.5 DDoS Protection
```
□ Cloudflare setup
□ Rate limiting at edge
□ Bot protection
□ WAF rules
□ Geographic restrictions (if needed)
```

### 5.6 Key Management
```
□ HashiCorp Vault for secrets
□ Key rotation policy (90 days)
□ No plaintext keys in code/logs
□ Hardware security module for Oracle (optional)
```

---

## FASE 6: MARKETING & LAUNCH (Week 4-5)

### 6.1 Pre-Launch Marketing
```
□ Landing page optimaliseren met Tax Simulator
□ Waitlist opzetten (email capture)
□ Social media accounts:
  - Twitter/X (@BillHavenPay)
  - Discord (community)
  - Telegram (announcements)
  - LinkedIn (B2B)
□ Content calendar maken (30 dagen)
□ Press kit voorbereiden
```

### 6.2 Launch Strategie (Gemini's 3-Phase Plan)

**Fase A: Crypto-Native Invasie (Maand 0-3)**
```
□ Product Hunt launch (#1 of the Day target)
  - Prepare 1 week before
  - Hunter network activeren
  - Upvote army ready
□ 50 DAOs/Web3 startups 6 maanden gratis Pro tier
  - Direct outreach to DAO treasuries
  - Partnership proposals
□ Mirror.xyz artikelen publiceren
  - "The Future of Business Payments"
  - "Why DAOs Need Better Treasury Tools"
□ Bankless/The Defiant nieuwsbrief features
  - Pitch exclusive stories
□ Twitter Spaces met DeFi builders
  - Weekly AMAs
  - Guest appearances
□ Crypto influencer partnerships
  - Tier 1: 100k+ followers
  - Sponsored threads
```

**Fase B: Web2 Bridge (Maand 3-9)**
```
□ Tax Simulator als lead magnet
  - "Calculate Your Savings" CTA
  - Email capture before results
□ LinkedIn/YouTube advertenties
  - Target: Freelancers, CFOs, Accountants
  - Budget: €2k-5k/month
□ Freelance platform partnerships
  - Upwork, Fiverr, Toptal integrations
□ Accountantskantoor partnerships
  - White-label options
  - Referral commissions
□ TechCrunch/Bloomberg PR
  - Funding announcements
  - Milestone press releases
```

**Fase C: Dominantie (Maand 9+)**
```
□ On-chain referral programma volledig activeren
  - Real-time commission payouts
  - Leaderboard visibility
□ Geografische expansie
  - Southeast Asia (high crypto adoption)
  - Latin America (remittance market)
  - Localized content & support
□ Enterprise tier lanceren
  - Custom contracts
  - Dedicated support
  - SLA guarantees
□ White-label oplossing
  - For payment processors
  - For banks (crypto-friendly)
```

### 6.3 Content Marketing
```
□ Blog posts (SEO optimized):
  - "Hoe je belastingvoordeel behaalt met crypto facturatie"
  - "De toekomst van salary streaming"
  - "P2P escrow uitgelegd voor beginners"
  - "Invoice Factoring: Verkoop je facturen voor crypto"
  - "Multi-chain payments: One platform, all blockchains"
□ Video tutorials (YouTube)
  - Platform walkthrough
  - Feature deep-dives
  - Use case stories
□ Webinars met accountants
  - "Crypto for CFOs"
  - Monthly Q&A sessions
□ Case studies van early adopters
  - DAO treasury management
  - Freelancer success stories
```

### 6.4 Referral Program Boost
**Al geïmplementeerd (92% complete):**
- Tier 1: 40% commissie (direct referrals)
- Tier 2: 10% (indirect)
- Tier 3: 5% (3rd level)
- Signup bonus: $5
- First trade bonus: $10
- Volume bonuses: $25-$1000

**Still Needed:**
```
□ Marketing materiaal voor affiliates
  - Banners, social images
  - Email templates
  - Referral link generator
□ Affiliate dashboard verbeteren
  - Real-time earnings
  - Conversion tracking
  - Payout history
□ Payout systeem live zetten
  - Weekly payouts
  - Minimum threshold: $50
□ Top referrer rewards
  - Monthly leaderboard
  - Bonus for top 10
```

---

## FASE 7: COMPLIANCE & LEGAL (Parallel)

### 7.1 GDPR Compliance
```
□ Privacy policy publiceren
□ Data processing agreement met Supabase
□ Cookie consent banner (CookieBot/OneTrust)
□ Right to deletion mechanisme
□ Data breach notification plan (72 hours)
□ Data retention policy (5 years for financial)
```

### 7.2 KYC/AML (Future - when required)
```
□ KYC provider integreren (Jumio/Veriff/Onfido)
□ Transaction monitoring system
□ Sanctions list checking (OFAC, EU)
□ SAR (Suspicious Activity Report) mechanism
□ Risk-based approach documentation
```

### 7.3 Legal Structuur
```
□ Terms of Service updaten
  - User responsibilities
  - Platform limitations
  - Dispute resolution
□ Risk disclaimers
  - Crypto volatility
  - Smart contract risks
  - Not financial advice
□ Jurisdictie kiezen (EU-friendly)
  - Netherlands (crypto-friendly)
  - Estonia (e-residency)
  - Switzerland (Crypto Valley)
□ Legal counsel consulteren
  - Money transmission licensing
  - Payment services directive (PSD2)
```

---

## REVENUE MODEL - €50K MRR BREAKDOWN

| Revenue Stream | % of Goal | Current Status | Monthly Target |
|----------------|-----------|----------------|----------------|
| Transaction Fees (1.5-4.4%) | 40% | ✅ Ready | €20,000 |
| Premium Subscriptions | 30% | ✅ Ready | €15,000 |
| Invoice Factoring (2%) | 15% | ✅ Ready | €7,500 |
| Money Streaming Fees | 10% | ❌ Build | €5,000 |
| DeFi Yield Fees | 5% | ❌ Build | €2,500 |

### Premium Tiers (Already Implemented)
| Tier | Price | Transaction Fee | Features |
|------|-------|-----------------|----------|
| Free | €0 | 4.4% | 5 bills/mo, 48h support |
| Silver | €14/mo | 3.5% | 25 bills/mo, 24h support |
| Gold | €29/mo | 2.5% | 100 bills/mo, Priority support |
| Platinum | €79/mo | 1.5% | Unlimited, Dedicated support |

### Volume Needed for €50k MRR
- ~€500k monthly transaction volume (at 4% avg fee)
- ~750 premium subscribers (at €20 avg)
- ~€375k factoring volume (at 2% fee)

---

## TECHNICAL IMPLEMENTATION DETAILS

### Smart Contracts
| Contract | Status | File | Purpose |
|----------|--------|------|---------|
| BillHavenEscrowV4.sol | Ready | contracts/ | Main escrow (secure) |
| BillHavenEscrowV3.sol | Deployed | contracts/ | Current mainnet |
| TokenStreamer.sol | TO BUILD | contracts/ | Salary streaming |

### Key Backend Endpoints (server/index.js)
```
POST /api/create-payment-intent     - Stripe payment
POST /api/create-lightning-invoice  - Lightning payment
POST /api/webhook/stripe            - Stripe webhook
POST /api/webhook/opennode          - OpenNode webhook
POST /api/auth/verify-signature     - Wallet auth
GET  /api/csrf-token                - CSRF protection
POST /api/escrow/v4/verify-payment  - Oracle verification
```

### Frontend Pages
| Page | Status | File | Purpose |
|------|--------|------|---------|
| Home | ✅ | pages/Home.jsx | Landing |
| Premium | ✅ | pages/Premium.jsx | Subscriptions |
| InvoiceFactoring | ✅ | pages/InvoiceFactoring.jsx | Marketplace |
| Referral | ✅ | pages/Referral.jsx | Affiliate |
| Trust | ✅ | pages/Trust.jsx | Reputation |
| Streaming | ❌ BUILD | pages/Streaming.jsx | Salary streams |
| TaxTools | ❌ BUILD | pages/TaxTools.jsx | Tax simulator |

### Database Tables (Supabase)
**Existing (20+ tables):**
- bills, profiles, transactions
- premium_subscriptions, invoice_factoring
- referrals, referral_earnings, discount_usage
- user_reputations, user_quests, user_streaks
- chat_rooms, chat_messages
- dispute_evidence, admin_audit_log

**To Add:**
- streaming_contracts
- tax_records
- kyc_verification (future)

---

## WALLET ADDRESSES OVERVIEW

| Wallet | Purpose | Address | Status |
|--------|---------|---------|--------|
| Fee Wallet | Platform fees | 0x596b95782d98295283c5d72142e477d92549cde3 | ✅ Set |
| Oracle Wallet | Payment signing | TBD | ❌ CREATE |
| Deployer Wallet | Contract deployment | TBD | ❌ CREATE |
| Insurance Fund | User protection | TBD | ❌ CREATE |
| Multi-sig Admin | Critical ops | TBD | ❌ CREATE |

---

## FILES TO CREATE/MODIFY

### New Files to Create
```
contracts/TokenStreamer.sol           - Streaming smart contract
src/services/streamingService.js      - Streaming service layer
src/pages/Streaming.jsx               - Streaming UI page
src/pages/TaxTools.jsx                - Tax simulator page
src/components/tax/TaxBenefitSimulator.jsx - Tax calculator component
src/components/streaming/StreamCreate.jsx  - Create stream form
src/components/streaming/StreamDashboard.jsx - Stream management
test/TokenStreamer.test.js            - Contract tests
test/BillHavenEscrowV4.test.js        - V4 contract tests
test/integration/payment-flow.test.js - Integration tests
cypress/e2e/bill-creation.cy.js       - E2E tests
```

### Files to Modify
```
.env                      - Add DEPLOYER_PRIVATE_KEY, ORACLE_PRIVATE_KEY
server/index.js           - Oracle config, logging, CORS fix
src/config/contracts.js   - Multi-chain addresses
src/utils/taxCalculations.js - Expand calculations
hardhat.config.js         - Test network configs
package.json              - Add test scripts
```

---

## SUCCESS METRICS & MILESTONES

### Week 1
- [ ] All wallets created and funded
- [ ] V4 deployed to Polygon Mainnet
- [ ] Backend running without errors
- [ ] 20% test coverage
- [ ] CORS vulnerability fixed

### Week 2
- [ ] Money Streaming MVP live
- [ ] Tax Simulator beta
- [ ] 3+ chains deployed (Base, Arbitrum, Optimism)
- [ ] 40% test coverage
- [ ] Monitoring alerts configured

### Week 3
- [ ] Security audit initiated
- [ ] Bug bounty program live (Immunefi)
- [ ] Full monitoring stack
- [ ] 60% test coverage
- [ ] Insurance fund established

### Week 4
- [ ] Production launch
- [ ] 100 beta users onboarded
- [ ] First €1k revenue
- [ ] Zero security incidents
- [ ] Press coverage

### Month 3
- [ ] €10k MRR achieved
- [ ] 1000 active users
- [ ] YouTube monetization eligible
- [ ] First DAO partnership

### Month 6
- [ ] €30k MRR achieved
- [ ] 5000 active users
- [ ] Series A ready (if desired)
- [ ] 3+ enterprise clients

### Year 1
- [ ] €50k+ MRR achieved
- [ ] Market leader position
- [ ] Profitable operations
- [ ] International expansion

---

## COMPETITOR ANALYSIS (From Gemini Report)

### Direct Competitors
| Platform | Focus | Strengths | BillHaven Advantage |
|----------|-------|-----------|---------------------|
| Request Network | Decentralized invoicing | On-chain tracking, accounting integrations | Hybrid fiat/crypto, Tax simulator |
| Sablier | Money streaming | NFT streams, DeFi composability | All-in-one platform |
| LlamaPay | Salary streaming | Simple UX, multi-chain | More payment types |
| BitPay | Payment gateway | Brand recognition | Better P2P escrow |
| Coinbase Commerce | E-commerce | Easy integration | More features, lower fees |

### BillHaven's Unique Advantages
1. **Hybrid Architecture** - Fiat (Stripe) + Crypto in one platform
2. **Tax Benefit Simulator** - No competitor has this
3. **All-in-One** - Invoicing + Streaming + Factoring + Escrow
4. **Multi-Chain Native** - 7+ blockchains supported
5. **Gamification** - Quests, streaks, reputation system

---

## RISK MITIGATION

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Smart contract hack | Low | Critical | Audit, bug bounty, insurance |
| Oracle compromise | Medium | High | Multi-sig, time-locks |
| Database breach | Low | High | Encryption, RLS, backups |
| DDoS attack | Medium | Medium | Cloudflare, rate limiting |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Regulatory changes | Medium | High | Multiple jurisdictions, legal counsel |
| Competition | High | Medium | Unique features (Tax simulator) |
| Market downturn | Medium | Medium | Diversified revenue streams |
| Key person risk | Low | High | Documentation, team building |

---

## APPENDIX: GEMINI'S FULL ANALYSIS

### Technical Foundation
- Modern stack: React frontend, Express.js backend, Supabase database
- Multi-chain support: Ethereum, Solana, TON, Bitcoin, Tron, Lightning
- Revenue model: Transaction fees + Premium subscriptions + Specialized services

### Key Insights
1. Tax Benefit Simulator is the "killer feature" - no competitor has it
2. Hybrid fiat/crypto is a major differentiator
3. Money Streaming is essential to compete with Sablier/LlamaPay
4. Professional audit is non-negotiable for trust

### Marketing Recommendations
- Product Hunt launch for crypto community
- Tax Simulator as lead magnet for Web2
- DAO partnerships for volume
- Content marketing for SEO

---

## APPENDIX: SECURITY AUDIT FINDINGS

### Critical (Fixed in V4)
1. Cross-chain signature replay attack
2. 1-hour timestamp window (now 5 min)
3. Missing signature replay prevention

### High Priority
1. Single Oracle centralization risk
2. CORS regex too permissive
3. No admin action audit logging

### Medium Priority
1. No automated tests
2. Missing Content Security Policy
3. Velocity limits bypassable via multiple accounts

### Recommendations
1. Deploy V4 to mainnet
2. Implement multi-sig Oracle
3. Write comprehensive test suite
4. Get professional audit

---

*Plan gegenereerd door Claude Code - Project Chimera*
*Gebaseerd op analyse van 3 Expert Agents*
*Laatste update: 2025-12-06*
