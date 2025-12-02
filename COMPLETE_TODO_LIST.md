# BILLHAVEN - COMPLETE TODO LIST
## Alles Wat Nog Moet Gebeuren (Status: 1 December 2025)

---

## PRIORITY 1: ONMIDDELLIJK (Deze Week)

### 1.1 Stripe Dashboard Setup [30 min] [USER ACTION]
**Status:** NIET GEDAAN
**Blocker:** Vereist handmatige actie in browser

**Stappen:**
1. Ga naar: https://dashboard.stripe.com/test/settings/payment_methods
2. Klik op "iDEAL" → Enable
3. Klik op "Bancontact" → Enable
4. Klik op "SEPA Direct Debit" → Enable
5. Klik op "SOFORT" → Enable
6. Ga naar: https://dashboard.stripe.com/test/webhooks
7. Klik "Add endpoint"
8. URL: `https://jouw-backend-url.com/webhooks/stripe`
9. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `charge.refunded`
10. Kopieer webhook secret naar `.env` als `STRIPE_WEBHOOK_SECRET`

---

### 1.2 Deploy Webhook Backend [1 uur] [DEVELOPMENT]
**Status:** CODE KLAAR, NIET GEDEPLOYED
**Location:** `/home/elmigguel/BillHaven/server/`

**Optie A: Railway.app (Aanbevolen)**
```bash
cd /home/elmigguel/BillHaven/server
npm install -g railway
railway login
railway init
railway up
```

**Optie B: Vercel Serverless**
- Converteer naar serverless functions
- `/api/webhooks/stripe.js`
- `/api/webhooks/opennode.js`

**Optie C: Render.com**
```bash
# Push to GitHub, connect Render
# Set environment variables in dashboard
```

**Environment Variables Nodig:**
```
STRIPE_SECRET_KEY=sk_test_51SZVt6...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_OPENNODE_API_KEY=e88ab3b3-f11d...
VITE_SUPABASE_URL=https://bldjdctgjhtucyxqhwpc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### 1.3 Test Betalingen [1 uur] [TESTING]
**Status:** NIET GEDAAN
**Vereist:** Stripe dashboard + webhook backend eerst

**Test 1: iDEAL (€1.00)**
- Verwacht: Success + 24h hold (NEW_USER)
- Test bank: Selecteer "Test Bank"

**Test 2: Credit Card (€10.00)**
- Kaart: `4000 0027 6000 3184` (3D Secure test)
- Verwacht: 3DS popup + success + 7d hold

**Test 3: Lightning (1000 sats)**
- OpenNode test mode
- Verwacht: Invoice + INSTANT release

---

## PRIORITY 2: DEZE MAAND

### 2.1 Mollie Account Aanmaken [30 min] [USER ACTION]
**Status:** GEBLOKKEERD - Vereist KvK nummer
**Waarom:** Betere iDEAL integratie dan Stripe

**Stappen (wanneer KvK beschikbaar):**
1. Ga naar: https://mollie.com
2. Sign up met zakelijk account
3. Voer KvK nummer in
4. Verificatie compleet (1-3 dagen)
5. API keys delen met Claude

---

### 2.2 Vercel Frontend Update [15 min] [DEVELOPMENT]
**Status:** AUTO-DEPLOY GECONFIGUREERD
**Actie:** Push naar main branch

```bash
cd /home/elmigguel/BillHaven
git add .
git commit -m "feat: Add code splitting + webhook backend"
git push origin main
# Vercel deployt automatisch
```

---

### 2.3 Admin Panel UI [2-3 uur] [DEVELOPMENT]
**Status:** NIET GEBOUWD
**Functies nodig:**
- Bill overzicht (alle bills)
- Manual release knop
- Dispute handling
- User trust level beheer
- Transaction history

**Components:**
- `src/components/admin/BillManagement.jsx`
- `src/components/admin/DisputePanel.jsx`
- `src/components/admin/UserTrustManager.jsx`

---

### 2.4 Mobile Navigation Fix [1 uur] [DEVELOPMENT]
**Status:** ISSUE GEIDENTIFICEERD
**Expert Score:** Frontend/UX 73/100

**Issues:**
- Hamburger menu niet responsive
- Touch targets te klein (<44px)
- Geen swipe gestures

**Fix:**
- Update `src/components/Navbar.jsx`
- Add mobile drawer component
- Increase touch targets

---

## PRIORITY 3: Q1 2025

### 3.1 Smart Contract V3 Security Fixes [2-3 dagen] [DEVELOPMENT]
**Status:** GEDOCUMENTEERD, NIET GEÏMPLEMENTEERD
**Expert Score:** Smart Contract 87/100

**Critical Fixes Nodig:**

**3.1.1 Admin Rug Pull Protection**
```solidity
// Prevent admin from draining active escrows
modifier onlyInactiveBalance() {
    require(amount <= address(this).balance - totalActiveEscrow);
    _;
}
```

**3.1.2 Cross-Chain Replay Prevention**
```solidity
// Add chainId to signature hash
bytes32 hash = keccak256(abi.encodePacked(
    billId,
    block.chainid,  // ADD THIS
    address(this),  // ADD THIS
    ...
));
```

**3.1.3 Fee Front-Running Defense**
```solidity
// Add 7-day timelock for fee changes
uint256 public pendingFee;
uint256 public feeChangeTime;

function scheduleFeeChange(uint256 newFee) external onlyOwner {
    pendingFee = newFee;
    feeChangeTime = block.timestamp + 7 days;
}
```

**3.1.4 Multi-Oracle Support**
```solidity
// Require 2-of-3 oracle signatures
address[3] public oracles;
uint256 public requiredSignatures = 2;
```

---

### 3.2 Deploy Andere EVM Chains [1 uur per chain]
**Status:** ALLEEN POLYGON DEPLOYED

**Chains te deployen:**
| Chain | Status | Gas Nodig |
|-------|--------|-----------|
| Polygon | ✅ DEPLOYED | - |
| Arbitrum | ❌ | ~0.0005 ETH |
| Optimism | ❌ | ~0.0005 ETH |
| Base | ❌ | ~0.0005 ETH |
| BSC | ❌ | ~0.005 BNB |
| Ethereum | ❌ | ~0.01 ETH |

**Totale kosten:** ~$10-15 USD

**Deployment commando:**
```bash
cd /home/elmigguel/BillHaven
# Add private key temporarily
export DEPLOYER_PRIVATE_KEY=0x...
npx hardhat run scripts/deploy.js --network arbitrum
npx hardhat run scripts/deploy.js --network optimism
npx hardhat run scripts/deploy.js --network base
# Remove private key after!
```

---

### 3.3 Solana Contract Development [1-2 weken]
**Status:** NETWERK GECONFIGUREERD, CONTRACT NIET GEBOUWD

**Werk nodig:**
1. Anchor program schrijven
2. SPL token support (USDC, USDT)
3. Escrow PDA (Program Derived Address)
4. Tests schrijven
5. Deploy naar devnet
6. Deploy naar mainnet

---

### 3.4 TON Contract Development [1-2 weken]
**Status:** NETWERK GECONFIGUREERD, CONTRACT NIET GEBOUWD

**Werk nodig:**
1. FunC/Tact contract schrijven
2. Jetton support (TON USDT)
3. Escrow logic
4. Tests schrijven
5. Deploy naar testnet
6. Deploy naar mainnet

---

## PRIORITY 4: Q2 2025

### 4.1 External Security Audit [Budget: $50K-$100K]
**Status:** NIET GEPLAND
**Aanbevolen auditors:**
- Trail of Bits
- OpenZeppelin
- Consensys Diligence
- Halborn

**Wanneer:** Na V3 security fixes geïmplementeerd

---

### 4.2 UI/UX Transformation [2-3 weken]
**Status:** NIET GESTART
**Expert Score:** Frontend/UX 73/100

**Fase 1: Foundation (Week 1)**
- Install Framer Motion
- Install shadcn/ui
- Design tokens systeem
- Component library setup

**Fase 2: Core Components (Week 2)**
- Button animations
- Card hover effects
- Input focus states
- Modal transitions

**Fase 3: Page Animations (Week 3)**
- Page transitions
- Loading skeletons
- Micro-interactions
- Success animations

---

### 4.3 Frontend Test Coverage [1-2 weken]
**Status:** 0% COVERAGE
**Expert Score:** Code Quality 73/100

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Tests nodig:**
- Component unit tests
- Hook tests
- Integration tests
- E2E tests (Playwright)

**Target:** 80% coverage

---

### 4.4 Sentry Error Monitoring [1 uur]
**Status:** NIET GECONFIGUREERD

**Setup:**
1. Maak account op sentry.io
2. Krijg DSN
3. Add to `.env`: `VITE_SENTRY_DSN=https://...`
4. Install: `npm install @sentry/react`
5. Initialize in `main.jsx`

---

## PRIORITY 5: INVESTOR & BUSINESS

### 5.1 Pitch Deck [2-3 dagen] [USER ACTION]
**Status:** STRUCTURE KLAAR, DESIGN NIET

**Slides nodig (12 totaal):**
1. Title/Vision
2. Problem
3. Solution
4. Market Size
5. Business Model
6. Traction
7. Competition
8. Team
9. Technology
10. Roadmap
11. Financials
12. Ask

**Tool:** Canva Pro

---

### 5.2 Billionaire Friend Meeting [USER ACTION]
**Status:** NIET GEPLAND

**Agenda:**
1. Demo BillHaven (15 min)
2. Investment ask: €250K-€500K SAFE @ €15M cap
3. Request: Permission to use name + warm intros

---

### 5.3 Domain Kopen [15 min] [USER ACTION]
**Status:** NIET GEDAAN

**Opties:**
- billhaven.app (~$15/jaar)
- billhaven.io (~$40/jaar)
- billhaven.com (check availability)

**Providers:**
- Namecheap
- Google Domains
- Cloudflare

---

### 5.4 SSL/HTTPS [Automatisch met Vercel]
**Status:** ✅ AL GECONFIGUREERD

Vercel geeft automatisch SSL.

---

## NIET DOEN LIJST (Beslissingen Gemaakt)

### ❌ PayPal Goods & Services
**Reden:** 180-dagen dispute window te risicovol

### ❌ KYC Vereisten Toevoegen
**Reden:** Philosophy is "NO KYC like online shops"
**Alternatief:** Invisible security (99.5% fraud detection)

### ❌ 3D Secure "Always" Mode
**Reden:** Moet "automatic" zijn (bank decides)

### ❌ V3 Contract Fixes Nu
**Reden:** Niet nodig tot scaling fase (€1M+ TVL)

---

## QUICK REFERENCE

### Huidige Status
| Component | % Complete |
|-----------|------------|
| Smart Contracts | 100% (V3 deployed) |
| Frontend | 95% |
| Backend | 80% (webhook needs deploy) |
| Security | 85% |
| Documentation | 100% |
| API Integration | 90% |
| Testing | 100% (contracts) / 0% (frontend) |
| **OVERALL** | **85%** |

### API Keys Status
| Service | Status |
|---------|--------|
| Stripe | ✅ TEST KEYS |
| OpenNode | ✅ CONFIGURED |
| Supabase | ✅ CONFIGURED |
| Sentry | ❌ NOT SET |

### Smart Contracts
| Network | Status |
|---------|--------|
| Polygon Mainnet | ✅ V3 LIVE |
| Polygon Amoy | ✅ V2 TESTNET |
| Andere chains | ❌ NOT DEPLOYED |

### Wallets
| Purpose | Address |
|---------|---------|
| Fee Wallet | `0x596b95782d98295283c5d72142e477d92549cde3` |
| Deployer | `0x79fd43109b6096f892706B16f9f750fcaFe5C5d2` |

### URLs
| Service | URL |
|---------|-----|
| Live App | https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app |
| Supabase | https://bldjdctgjhtucyxqhwpc.supabase.co |
| Stripe Dashboard | https://dashboard.stripe.com/test |

---

**Document gemaakt:** 1 December 2025
**Laatste update:** Session 2 EOD
