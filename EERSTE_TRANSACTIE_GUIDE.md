# BILLHAVEN - EERSTE TRANSACTIE GUIDE

**Datum:** 2025-11-29
**Status:** KLAAR VOOR TESTNET & MAINNET

---

## SNELLE START - WAT JE MOET DOEN

### STAP 1: FUND DEPLOYER WALLET (~5 minuten)

**Deployer Wallet:** `0x79fd43109b6096f892706B16f9f750fcaFe5C5d2`

Stuur de volgende bedragen naar dit adres:

| Network | Bedrag | Kosten | Hoe te krijgen |
|---------|--------|--------|----------------|
| **Polygon** | 0.5 POL | ~$0.25 | Binance, Coinbase, of bridge |
| **Arbitrum** | 0.0005 ETH | ~$1.50 | Bridge van Ethereum |
| **Optimism** | 0.0005 ETH | ~$1.50 | Bridge van Ethereum |
| **Base** | 0.0005 ETH | ~$1.50 | Bridge van Ethereum |
| **BSC** | 0.005 BNB | ~$3.00 | Binance |
| **TOTAAL** | | **~$8** | |

**Optioneel (duur):**
| Ethereum | 0.01 ETH | ~$35 | Alleen als je ETH mainnet wilt |

---

### STAP 2: DEPLOY NAAR MAINNETS (~10 minuten)

```bash
cd ~/BillHaven

# Zorg dat je .env correct is
cat .env | grep DEPLOYER

# Deploy naar alle networks (interactief)
./scripts/deploy-all-networks.sh
```

**Volgorde:** Base → Arbitrum → Optimism → Polygon → BSC → (optioneel: Ethereum)

**Na elke deploy:**
1. Kopieer het contract adres
2. Verificeer op block explorer
3. Noteer in `src/config/contracts.js`

---

### STAP 3: UPDATE FRONTEND CONFIG (~2 minuten)

Na deployment, update `src/config/contracts.js`:

```javascript
export const ESCROW_ADDRESSES = {
  // Mainnets (vul in na deployment)
  137: "0x...",      // Polygon
  1: "0x...",        // Ethereum (optioneel)
  56: "0x...",       // BSC
  42161: "0x...",    // Arbitrum
  10: "0x...",       // Optimism
  8453: "0x...",     // Base

  // Testnets (al deployed)
  80002: "0x792B01c5965D94e2875DeFb48647fB3b4dd94e15", // Amoy
};
```

---

### STAP 4: WHITELIST TOKENS (~5 minuten per network)

Na deployment moet je USDT, USDC en WBTC whitelisten:

```bash
# Open Hardhat console
npx hardhat console --network polygon

# In console:
const Escrow = await ethers.getContractFactory("BillHavenEscrowV2")
const escrow = await Escrow.attach("0xYOUR_CONTRACT_ADDRESS")

# Whitelist USDT
await escrow.addSupportedToken("0xc2132D05D31c914a87C6611C10748AEb04B58e8F")

# Whitelist USDC
await escrow.addSupportedToken("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359")

# Whitelist WBTC
await escrow.addSupportedToken("0x1BFD67037B42Cf73acF2047067bd4f2C47D9BfD6")
```

**Token Adressen per Network:**

| Network | USDT | USDC | WBTC |
|---------|------|------|------|
| Polygon | 0xc2132D05D31c914a87C6611C10748AEb04B58e8F | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 | 0x1BFD67037B42Cf73acF2047067bd4f2C47D9BfD6 |
| Ethereum | 0xdAC17F958D2ee523a2206206994597C13D831ec7 | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 | 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599 |
| BSC | 0x55d398326f99059fF775485246999027B3197955 | 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d | 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c |
| Arbitrum | 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 | 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f |
| Optimism | 0x94b008aA00579c1307B0EF2c499aD98a8ce58e58 | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 | 0x68f180fcCe6836688e9084f035309E29Bf0A2095 |
| Base | N/A | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | 0x0555E30da8f98308EdB960aa94C0Db47230d2B9c |

---

### STAP 5: REBUILD & REDEPLOY (~3 minuten)

```bash
# Rebuild met nieuwe adressen
npm run build

# Deploy naar Vercel
vercel --prod

# Of via git push (auto-deploy)
git add -A
git commit -m "feat: Add mainnet contract addresses"
git push
```

---

### STAP 6: TEST EERSTE TRANSACTIE (~10 minuten)

#### A. TEST OP TESTNET EERST (Polygon Amoy)

1. **Ga naar:** https://billhaven-qvrr49qg1-mikes-projects-f9ae2848.vercel.app
2. **Login met:** mikedufour@hotmail.com
3. **Verbind wallet:** MetaMask op Polygon Amoy (80002)
4. **Krijg test POL:** https://faucet.polygon.technology/

#### B. MAAK TEST BILL

1. Ga naar "Submit Bill"
2. Vul in:
   - Title: "Test Bill #1"
   - Amount: $1.00
   - Payment Instructions: "Test payment"
   - Crypto: POL (native)
3. Klik "Create Bill with Escrow"
4. Bevestig in MetaMask

**Verwacht:**
- Transaction hash wordt getoond
- Bill verschijnt in "My Bills"
- Escrow ID wordt toegewezen

#### C. TEST CLAIM FLOW

1. Open incognito browser
2. Login met ander account
3. Ga naar "Public Bills"
4. Vind je test bill
5. Klik "Claim"
6. Bevestig in MetaMask

#### D. VOLLEDIGE FLOW TEST

1. **Bill Maker:** Maak bill met $1 worth POL
2. **Payer:** Claim de bill
3. **Payer:** "Betaal" fiat (simuleer) en upload screenshot
4. **Bill Maker:** Bevestig fiat ontvangen
5. **Check:** Crypto wordt released naar payer

---

## MAINNET EERSTE TRANSACTIE

### Pre-checklist

- [ ] Deployer wallet heeft funds op alle networks
- [ ] Contracts deployed en verified
- [ ] Tokens (USDT, USDC, WBTC) gewhitelist
- [ ] Frontend config updated
- [ ] App redeployed op Vercel

### Test met kleine bedragen

**Aanbevolen eerste test:**
- Network: Polygon (laagste fees)
- Token: USDC ($1 worth)
- Amount: $5.00

### Stappen:

1. **Bill Maker (jij):**
   - Login op BillHaven
   - Verbind wallet met Polygon mainnet
   - Maak bill: $5 USDC
   - Lock crypto in escrow

2. **Payer (jij in incognito):**
   - Claim de bill
   - "Betaal" $5 (naar jezelf of skip)
   - Upload screenshot

3. **Bill Maker:**
   - Confirm fiat received
   - Crypto wordt released

4. **Verify:**
   - Check transaction op Polygonscan
   - Fee wallet ontvangt 4.4% fee
   - Payer ontvangt 95.6%

---

## DOMEIN SETUP (BillHaven.app)

### Stap 1: Koop domein

**Aanbevolen: Cloudflare** ($14/jaar)
1. Ga naar https://cloudflare.com
2. Zoek "billhaven.app"
3. Registreer (at-cost pricing)
4. Gratis WHOIS privacy

### Stap 2: Verbind met Vercel

1. Ga naar Vercel Dashboard
2. Project Settings → Domains
3. Voeg toe: `billhaven.app` en `www.billhaven.app`

### Stap 3: DNS Configuratie

**Optie A: Vercel Nameservers (aanbevolen)**
```
Verander nameservers bij Cloudflare naar:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

**Optie B: Handmatige DNS**
```
A Record:
  Host: @
  Value: 76.76.21.21

CNAME Record:
  Host: www
  Value: cname.vercel-dns.com
```

### Stap 4: Wacht op SSL

- Vercel regelt automatisch Let's Encrypt SSL
- Wacht 24-48 uur voor DNS propagatie
- Check met: https://dnschecker.org

---

## TROUBLESHOOTING

### "Transaction failed"
- Check of wallet genoeg gas heeft
- Check of netwerk correct is
- Probeer gas limit te verhogen

### "Token not supported"
- Token moet gewhitelist worden door owner
- Run `addSupportedToken()` op het contract

### "Bill already claimed"
- Bill kan maar 1x geclaimed worden
- Check status in contract

### "Escrow contract not deployed"
- Check `src/config/contracts.js`
- Contract adres moet ingevuld zijn voor dat network

### Build errors na edits
```bash
# Clean rebuild
rm -rf node_modules/.vite
npm run build
```

---

## BELANGRIJKE ADRESSEN

| Item | Adres |
|------|-------|
| Fee Wallet | 0x596b95782d98295283c5d72142e477d92549cde3 |
| Deployer | 0x79fd43109b6096f892706B16f9f750fcaFe5C5d2 |
| Testnet Contract | 0x792B01c5965D94e2875DeFb48647fB3b4dd94e15 |
| Admin Email | mikedufour@hotmail.com |

---

## KOSTEN OVERZICHT

| Item | Kosten |
|------|--------|
| Mainnet Deployment (5 chains) | ~$8 |
| Ethereum Mainnet (optioneel) | ~$35 |
| BillHaven.app domein | $14/jaar |
| Vercel Hosting | GRATIS |
| Supabase | GRATIS (free tier) |
| **TOTAAL (minimum)** | **~$22** |

---

## CONTACT

Bij problemen:
- Check MASTER_DOCUMENTATION.md
- Check SESSION_SUMMARY.md
- GitHub Issues: https://github.com/anthropics/claude-code/issues

---

**Document Version:** 1.0
**Last Updated:** 2025-11-29
