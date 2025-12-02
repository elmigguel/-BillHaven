# BILLHAVEN - NEXT SESSION PROMPT
## Copy/Paste dit in een nieuwe Claude chat

---

## VOLLEDIGE PROMPT:

```
Je gaat verder werken aan BillHaven, een multi-chain P2P fiat-to-crypto escrow platform.

## PROJECT LOCATIE
/home/elmigguel/BillHaven/

## LEES EERST DEZE FILES (in deze volgorde):
1. /home/elmigguel/BillHaven/COMPLETE_TODO_LIST.md - Alles wat nog moet
2. /home/elmigguel/BillHaven/DAILY_REPORT_2025-12-01_FINAL.md - Laatste sessie werk
3. /home/elmigguel/BillHaven/.env - API keys status

## HUIDIGE STATUS (85% Production Ready)

### Wat KLAAR is:
- Smart Contracts: V3 deployed op Polygon Mainnet (0x8beED27aA6d28FE42a9e792d81046DD1337a8240)
- Frontend: React + Vite + Tailwind (live op Vercel)
- API Keys: Stripe (test) + OpenNode + Supabase GECONFIGUREERD
- Trust System: 4 levels met tiered hold periods
- Security: Invisible fraud detection (99.5% zonder KYC)
- Tests: 40/40 PASSING
- Build: SUCCESS (14 chunks, code splitting)

### Wat NOG MOET:
- Backend: Express.js webhook server GEBOUWD maar NIET DEPLOYED (/server/)
- Stripe Dashboard: Payment methods moeten enabled worden
- Andere EVM Chains: Alleen Polygon deployed
- Admin Panel: Nog niet gebouwd
- Frontend Tests: 0% coverage

## WAT GISTEREN IS GEDAAN (1 Dec 2025):
1. Stripe SDK geïnstalleerd (@stripe/stripe-js + @stripe/react-stripe-js)
2. Express.js webhook backend gebouwd (server/index.js) - handles Stripe + OpenNode
3. Code splitting geïmplementeerd (bundle: 14 chunks, 669KB gzipped)
4. Private key verwijderd uit .env (security fix)
5. Credit card tiered hold periods (NEW_USER: 7d, VERIFIED: 3d, TRUSTED: 24h, POWER_USER: 12h)
6. Admin override functies toegevoegd (adminForceRelease, hasAdminOverride, getEffectiveHoldPeriod)
7. 5-expert audit uitgevoerd (gemiddeld: 73/100)

## BELANGRIJKE ADRESSEN
- V3 Contract (Polygon): 0x8beED27aA6d28FE42a9e792d81046DD1337a8240
- V2 Contract (Amoy Testnet): 0x792B01c5965D94e2875DeFb48647fB3b4dd94e15
- Fee Wallet: 0x596b95782d98295283c5d72142e477d92549cde3
- Deployer: 0x79fd43109b6096f892706B16f9f750fcaFe5C5d2
- Live URL: https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app
- Supabase: https://bldjdctgjhtucyxqhwpc.supabase.co

## API KEYS (TEST MODE)
- Stripe Publishable: pk_test_51SZVt6Rk2Ui2LpnZHYLIXYwTKvJ7gpZyw6T20P9quaC4dv1VRwdPKSZZGemjeU7EE3WjkIkO27z6G7JWaTxsN83W0068DGSnmZ
- Stripe Secret: sk_test_***STRIPE_SECRET_REDACTED***
- OpenNode: e88ab3b3-f11d-44ad-b6c2-fec8fd79a9ae

## BELANGRIJKE BESLISSINGEN (NIET VERANDEREN):
- NO KYC philosophy (invisible security instead - 99.5% fraud detection)
- Stripe gekozen (niet Mollie - geen KvK nodig)
- Credit cards hebben tiered holds (7d→12h gebaseerd op trust level)
- iDEAL, SEPA, Lightning, Crypto = INSTANT release
- PayPal G&S is BLOCKED (180-dagen disputes)
- Smart contract V3 security fixes uitgesteld naar Q2 2025

## HOLD PERIODS OVERZICHT

### INSTANT RELEASE (Irreversibel):
- iDEAL (Nederland)
- SEPA (Europa)
- Bancontact (België)
- SOFORT (Duitsland)
- Lightning Network
- Alle Crypto (na blockchain confirmations)

### TIERED HOLD (Credit Cards):
| Trust Level | Hold Period | Trades Nodig |
|-------------|-------------|--------------|
| NEW_USER | 7 dagen | 0-2 |
| VERIFIED | 3 dagen | 3-10 |
| TRUSTED | 24 uur | 10-25 |
| POWER_USER | 12 uur | 25+ |

### BLOCKED:
- PayPal Goods & Services

## PRIORITEIT OPTIES VOOR VANDAAG:

### OPTIE A: Backend Deployment (AANBEVOLEN)
De webhook server moet gedeployed worden zodat Stripe en OpenNode betalingen kunnen bevestigen.
- Code staat klaar in: /home/elmigguel/BillHaven/server/
- Deploy naar Railway.app (simpelst) of Render.com
- Daarna Stripe dashboard configureren

### OPTIE B: Admin Panel UI
Build de admin interface voor:
- Bill management overzicht
- Manual release knop (admin override)
- User trust level beheer
- Dispute handling

### OPTIE C: Andere EVM Chains Deployen
Deploy V3 contract naar Arbitrum, Optimism, Base, BSC.
- Kost ~$10-15 totaal aan gas
- Vergroot bereik naar meer gebruikers

### OPTIE D: Frontend Tests
Add Vitest + React Testing Library.
- Huidige coverage: 0%
- Target: 80%

## WAT IK VAN JE NODIG HEB:
1. Scan eerst COMPLETE_TODO_LIST.md en DAILY_REPORT
2. Vraag welke prioriteit ik wil (A/B/C/D of anders)
3. Doe het werk volledig af
4. Maak een end-of-day report aan het einde

## ADMIN INFO
- Email: mikedufour@hotmail.com
- Telegram: (indien geconfigureerd)

Begin met het lezen van de files en geef me dan opties.
```

---

## KORTE PROMPT (als je weinig context wilt geven):

```
BillHaven project voortzetten.

Locatie: /home/elmigguel/BillHaven/
Lees: COMPLETE_TODO_LIST.md, DAILY_REPORT_2025-12-01_FINAL.md, .env

Status: 85% klaar.
- Webhook backend GEBOUWD maar NIET DEPLOYED (server/)
- Stripe keys geconfigureerd, dashboard nog niet
- Credit cards = tiered holds (7d→12h)
- PayPal G&S = BLOCKED
- NO KYC philosophy

Contract: 0x8beED27aA6d28FE42a9e792d81046DD1337a8240 (Polygon)
URL: https://billhaven-8c40tay2x-mikes-projects-f9ae2848.vercel.app

Vraag me wat ik wil doen en maak het dan volledig af.
```

---

## QUICK COMMANDS (voor verificatie):

```bash
# Check build
cd /home/elmigguel/BillHaven && npm run build

# Run tests
npx hardhat test

# Start dev server
npm run dev

# Start webhook backend (lokaal)
cd server && npm start

# Git status
git status
```

---

## BELANGRIJKE FILES:

| File | Purpose |
|------|---------|
| COMPLETE_TODO_LIST.md | Alles wat nog moet |
| DAILY_REPORT_2025-12-01_FINAL.md | Gisteren's werk |
| .env | API keys |
| server/index.js | Webhook backend (280 lines) |
| src/services/trustScoreService.js | Hold periods + admin override |
| src/services/invisibleSecurityService.js | Fraud detection |
| contracts/BillHavenEscrowV3.sol | Smart contract (1001 lines) |

---

## 5-EXPERT AUDIT SCORES (1 Dec 2025):

| Expert | Score | Key Issue |
|--------|-------|-----------|
| Security | 68/100 | Webhook verification nodig |
| Smart Contract | 87/100 | Admin privileges (acceptable for now) |
| Payment | 65/100 | Backend not deployed |
| Frontend/UX | 73/100 | Mobile nav issues |
| Code Quality | 73/100 | 0% frontend test coverage |
| **GEMIDDELD** | **73/100** | |

---

**Document Updated:** 1 December 2025
**Status:** Ready for backend deployment
