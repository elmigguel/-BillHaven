# EPIC MEGA PROMPT - BillHaven Complete System Guide

## START VAN ELKE CHAT: Kopieer dit hele bestand!

---

## INSTANT PROJECT SCANNER - Roep dit aan bij elke nieuwe chat

```
Als je deze prompt krijgt, start dan METEEN met het volgende:

1. Lees deze bestanden PARALLEL:
   - /home/elmigguel/SESSION_SUMMARY.md
   - /home/elmigguel/BillHaven/package.json
   - /home/elmigguel/BillHaven/src/App.jsx

2. Geef een korte status update:
   - Wat is de huidige git HEAD?
   - Wat was de laatste sessie?
   - Wat moet nog gedaan worden?

3. Vraag: "Wat wil je vandaag doen?"
```

---

# BILLHAVEN - COMPLETE SYSTEEM DOCUMENTATIE

## Project Overview

| Veld | Waarde |
|------|--------|
| **Naam** | BillHaven - P2P Fiat-to-Crypto Escrow Platform |
| **Locatie** | `/home/elmigguel/BillHaven` |
| **Status** | 99%+ Production Ready |
| **Live URL** | https://billhaven-clbkt4gdc-mikes-projects-f9ae2848.vercel.app |
| **GitHub** | https://github.com/elmigguel/-BillHaven |
| **Laatste Update** | 2025-12-02 Session 4 |

---

## Wat is BillHaven?

BillHaven is een **multi-chain P2P fiat-to-crypto escrow platform**:

1. **Bill Makers** locken crypto in smart contract escrow
2. **Payers** betalen fiat (iDEAL, SEPA, etc.) voor die crypto
3. Na bevestiging van fiat ontvangst → crypto wordt vrijgegeven

**Ondersteunde Chains (11):**
- EVM: Polygon, Ethereum, BSC, Arbitrum, Optimism, Base
- Non-EVM: Bitcoin, Lightning, Solana, TON, Tron

---

## Tech Stack

### Frontend
- React 18.3.1 + Vite 5.3.1
- Tailwind CSS 3.4.4
- Framer Motion 12.23.25
- shadcn/ui (13 components)
- React Router 6.24.1
- TanStack React Query 5.51.1

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Express 5.2.0 (webhook server)
- Stripe 20.0.0

### Blockchain
- Ethers.js 6.15.0 + Viem 2.40.3
- Solana Web3.js 1.98.4
- TON SDK 16.0.0
- TronWeb 6.1.0
- Hardhat 2.27.1
- Solidity 0.8.20

---

## Folder Structuur (Belangrijkste)

```
/home/elmigguel/BillHaven/
├── src/
│   ├── pages/              # 12 pagina's
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SubmitBill.jsx
│   │   ├── MyBills.jsx
│   │   ├── PublicBills.jsx
│   │   ├── ReviewBills.jsx
│   │   ├── FeeStructure.jsx
│   │   ├── Referral.jsx
│   │   ├── Settings.jsx
│   │   ├── DisputeAdmin.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   │
│   ├── components/         # 28 components
│   │   ├── bills/          # BillCard, PaymentFlow, FeeCalculator
│   │   ├── wallet/         # ConnectWalletButton, TokenSelector
│   │   ├── ui/             # shadcn components
│   │   └── dashboard/      # StatsCard
│   │
│   ├── services/           # 14 services (~6000 lines)
│   │   ├── referralService.js      # 526 lines - Affiliate system
│   │   ├── escrowService.js        # 486 lines - Smart contract
│   │   ├── escrowServiceV3.js      # V3 multi-confirmation
│   │   ├── paymentService.js       # 257 lines - Unified payments
│   │   ├── trustScoreService.js    # 691 lines - Trust system
│   │   ├── evmPayment.js           # EVM chains
│   │   ├── solanaPayment.js        # Solana
│   │   ├── tonPayment.js           # TON
│   │   ├── tronPayment.js          # Tron
│   │   ├── bitcoinPayment.js       # Bitcoin
│   │   ├── lightningPayment.js     # Lightning Network
│   │   └── creditCardPayment.js    # Stripe
│   │
│   ├── contexts/           # 4 context providers
│   │   ├── AuthContext.jsx
│   │   ├── WalletContext.jsx
│   │   ├── SolanaWalletContext.jsx
│   │   └── TonWalletContext.jsx
│   │
│   ├── config/             # 6 config files
│   │   ├── networks.js     # EVM networks
│   │   ├── contracts.js    # Contract addresses
│   │   └── animations.js   # Framer Motion
│   │
│   ├── utils/              # Utilities
│   │   ├── sanitize.js     # Input sanitization
│   │   ├── index.js        # Route mappings (pageUrlMap)
│   │   └── logger.js
│   │
│   └── lib/
│       └── supabase.js     # Supabase client
│
├── contracts/              # Smart Contracts (1,779 lines)
│   ├── BillHavenEscrowV3.sol   # 1,046 lines - PRODUCTION
│   ├── BillHavenEscrowV2.sol   # ERC20 support
│   └── BillHavenEscrow.sol     # V1 basic
│
├── server/                 # Backend Express server
│   ├── index.js
│   └── webhooks/
│
├── supabase/
│   └── migrations/         # 3 migration files
│       ├── 20251129_payment_verifications.sql
│       ├── 20251130_trust_system.sql
│       └── 20251202_referral_tables.sql
│
└── docs/                   # 149 markdown files
```

---

## Routes & Pages

| Route | Component | Toegang | Doel |
|-------|-----------|---------|------|
| `/` | Home | Public | Landing page |
| `/login` | Login | Public | Inloggen |
| `/signup` | Signup | Public | Registreren |
| `/dashboard` | Dashboard | Protected | Gebruiker dashboard |
| `/submit-bill` | SubmitBill | Protected | Bill aanmaken |
| `/my-bills` | MyBills | Protected | Mijn bills |
| `/public-bills` | PublicBills | Protected | Bills claimen |
| `/review-bills` | ReviewBills | Admin | Bills goedkeuren |
| `/fee-structure` | FeeStructure | Public | Fee informatie |
| `/referral` | Referral | Protected | Affiliate programma |
| `/settings` | Settings | Admin | Platform settings |
| `/dispute-admin` | DisputeAdmin | Admin | Disputes oplossen |

**BELANGRIJK - Route Mappings:**
Alle routes moeten in `src/utils/index.js` staan:
```javascript
const pageUrlMap = {
  Home: '/',
  Dashboard: '/dashboard',
  SubmitBill: '/submit-bill',
  MyBills: '/my-bills',
  ReviewBills: '/review-bills',
  FeeStructure: '/fee-structure',
  PublicBills: '/public-bills',
  Settings: '/settings',
  DisputeAdmin: '/dispute-admin',
  Referral: '/referral',
  Login: '/login',
  Signup: '/signup',
};
```

---

## Fee Structure (6 Tiers)

| Bedrag | Standaard Fee | Met Affiliate |
|--------|---------------|---------------|
| < $10,000 | 4.4% | **2.2%** (50% off) |
| $10K - $20K | 3.5% | 3.5% |
| $20K - $50K | 2.8% | 2.8% |
| $50K - $500K | 1.7% | 1.7% |
| $500K - $1M | 1.2% | 1.2% |
| > $1,000,000 | 0.8% | 0.8% |

**Affiliate Discount Rules:**
- 50% korting ALLEEN op <$10K tier
- 3 transacties per succesvolle referral
- $10,000 volume cap over die 3 transacties
- Referral activeert wanneer vriend >$500 transactie doet

---

## Smart Contract V3 - Key Info

**Deployed:**
- Polygon Mainnet: `0x8beED27aA6d28FE42a9e792d81046DD1337a8240`

**Features:**
- Multi-confirmation (Payer + Oracle/Maker)
- Hold periods per payment method
- Trust levels (NEW_USER → TRUSTED → VERIFIED → ELITE)
- Velocity limits (daily/weekly)
- Dispute resolution
- Reentrancy protection

**Hold Periods:**
| Payment Method | Hold Period |
|----------------|-------------|
| CRYPTO | Instant |
| CASH_DEPOSIT | 1 hour |
| iDEAL | 24 hours |
| WIRE_TRANSFER | 2 days |
| SEPA | 3 days |
| BANK_TRANSFER | 5 days |
| OTHER | 7 days |

**Blocked Methods:**
- PayPal Goods & Services (180-day chargeback)
- Credit Cards (120-day chargeback)

---

## Database Tables (Supabase)

| Tabel | Doel |
|-------|------|
| `profiles` | User profiles met roles |
| `bills` | Bill records |
| `referrals` | Referral tracking |
| `discount_usage` | Affiliate discount gebruik |
| `user_trust_profiles` | Trust scores |
| `platform_settings` | Platform config |

**User Roles:**
- `admin` - Alles
- `user` - Bills maken
- `payer` - Bills betalen

---

## Belangrijke Services

### referralService.js (526 lines)
```javascript
// Key functions:
generateReferralCode(userId)        // Maak 8-char code
getReferralCode(userId)             // Get of create code
applyReferralCode(newUserId, code)  // Link referral
getReferralStats(userId)            // Stats ophalen
checkDiscountEligibility(userId, amount)  // Check korting
recordDiscountUsage(userId, txId, amount) // Log gebruik
```

### escrowService.js (486 lines)
```javascript
// Key functions:
createBill(signer, amount, platformFee)
createBillWithToken(signer, tokenAddress, amount, platformFee)
claimBill(signer, billId)
confirmFiatPayment(signer, billId)
calculateFee(amount, hasAffiliateDiscount)
```

### trustScoreService.js (691 lines)
```javascript
// Trust Levels:
NEW_USER:    0 points   | Standard holds
VERIFIED:    50 points  | 10% fee discount
TRUSTED:     200 points | 25% fee discount
POWER_USER:  500 points | Instant release
```

---

## Bekende Bugs & Fixes

### White Screen Bug (OPGELOST)
**Probleem:** `motion(Component)` pattern crasht met forwardRef

**Fix:**
```jsx
// BAD:
const MotionCard = motion(Card);
<MotionCard>...</MotionCard>

// GOOD:
<motion.div initial={{...}} animate={{...}}>
  <Card>...</Card>
</motion.div>
```

**Getroffen bestanden (al gefixed):**
- src/components/dashboard/StatsCard.jsx
- src/components/bills/BillCard.jsx
- src/components/ui/button.jsx

---

## Build & Deploy Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy naar Vercel
vercel --prod --yes

# Smart contract tests
npx hardhat test

# Deploy contract
npx hardhat run scripts/deployV3.cjs --network polygon
```

---

## Environment Variables (.env.example)

**96 variabelen**, belangrijkste:
```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=

# Blockchain RPC
VITE_POLYGON_RPC_URL=
VITE_ETHEREUM_RPC_URL=

# Contract
PRIVATE_KEY=
FEE_WALLET=0x596b95782d98295283c5d72142e477d92549cde3
```

---

## Git Commits (Session 4)

```
e643175 docs: Add Session 4 report + MEGA PROMPT
4884855 fix: Add missing route mappings for Referral, Login, Signup, DisputeAdmin
0131171 feat: Complete referral system + tiered fee verification
0d07e0c docs: Add Session 3 daily reports and EOD documentation
7fb5f55 feat: Update fee structure with tiered pricing and affiliate discount
b3ac9f6 fix: Resolve white screen bug by replacing motion() with motion.div
```

---

## Pending Tasks

### Must Do (Manual)
1. **Supabase Migration:**
   ```
   Dashboard → SQL Editor → Run:
   /home/elmigguel/BillHaven/supabase/migrations/20251202_referral_tables.sql
   ```

### Optional
- [ ] Deploy contract naar andere networks (Ethereum, BSC, etc.)
- [ ] End-to-end testing referral flow
- [ ] Marketing content

---

## Key Documentation Files

| Bestand | Inhoud |
|---------|--------|
| `/home/elmigguel/SESSION_SUMMARY.md` | Master project status |
| `/home/elmigguel/BillHaven/DAILY_REPORT_2025-12-02_SESSION4.md` | Laatste session |
| `/home/elmigguel/BillHaven/MEGA_PROMPT_SESSION5.md` | Korte versie |
| `/home/elmigguel/BillHaven/EOD_SYNC_2025-12-02_SESSION4_FINAL.md` | EOD sync |
| `/home/elmigguel/BillHaven/supabase-schema.sql` | Database schema |

---

## Statistics

| Metric | Waarde |
|--------|--------|
| Total Files | 76,489 (incl node_modules) |
| Frontend Components | 81 files |
| React Components | 28 |
| Services | 14 |
| Smart Contracts | 4 (EVM) + 3 (TON) |
| Database Migrations | 3 |
| Documentation | 149 markdown files |
| Lines of Code | ~24,000 (excl node_modules) |
| Bundle Size | ~2.9MB / 900KB gzipped |

---

## Quick Reference Commands

```bash
# Start development
cd ~/BillHaven && npm run dev

# Build for production
npm run build

# Deploy
vercel --prod --yes

# Run tests
npx hardhat test

# Check git status
git status && git log --oneline -5

# View recent changes
git diff HEAD~3
```

---

## AGENT INSTRUCTIES

Als je een nieuwe chat start met deze prompt:

1. **Lees eerst** de master files:
   - `SESSION_SUMMARY.md` - Waar zijn we?
   - `package.json` - Dependencies
   - `App.jsx` - Routes

2. **Check git status:**
   ```bash
   cd ~/BillHaven && git status && git log --oneline -3
   ```

3. **Geef status update** aan gebruiker

4. **Vraag** wat er gedaan moet worden

---

## CONTACT & LINKS

- **Production:** https://billhaven-clbkt4gdc-mikes-projects-f9ae2848.vercel.app
- **GitHub:** https://github.com/elmigguel/-BillHaven
- **Supabase:** Check .env

---

**EINDE EPIC MEGA PROMPT**

**Last Updated:** 2025-12-02 Session 4
**Git HEAD:** e643175
**Status:** 99%+ PRODUCTION READY
