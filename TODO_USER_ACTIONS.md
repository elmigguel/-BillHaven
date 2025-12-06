# BillHaven - Jouw Acties (Doe dit in 1x)

**Datum:** 2025-12-06
**Status:** Wallets aangemaakt, wacht op funding

---

## STAP 1: Fund de Deployer Wallet

**Stuur 0.1-0.5 POL naar:**
```
0xA636b7AcC8a91d24e56816Daf6d6Fb0FEdb1Fe02
```

**Hoe:**
- Binance/Kraken: Koop POL → Withdraw naar bovenstaand adres (POLYGON netwerk!)
- Of bridge via https://wallet.polygon.technology

**Kosten:** ~€0.10-0.50

---

## STAP 2: Render Dashboard Configureren

**Ga naar:** https://dashboard.render.com
**Selecteer:** BillHaven service
**Klik:** Environment → Add Environment Variable

**Voeg deze 2 toe:**

| Key | Value |
|-----|-------|
| `ORACLE_PRIVATE_KEY` | `0x0f28de456fc2a44488afacfc25eab1ed214e5a8071731abe7dcd7d90ca282757` |
| `ESCROW_CONTRACT_ADDRESS` | `0x8beED27aA6d28FE42a9e792d81046DD1337a8240` |

**Klik:** Save Changes → Manual Deploy → Deploy latest commit

---

## STAP 3: Verifieer

Na beide stappen, kom terug en zeg **"funded"** of **"klaar"**.

Dan doe ik:
1. ✅ V4 contract deployen naar Polygon
2. ✅ Contract address updaten
3. ✅ Multi-chain deployment (Base, Arbitrum, Optimism)
4. ✅ Money Streaming feature bouwen
5. ✅ Tax Benefit Simulator bouwen

---

## WALLET OVERZICHT (BEWAAR DIT VEILIG!)

### Deployer Wallet
```
Address:     0xA636b7AcC8a91d24e56816Daf6d6Fb0FEdb1Fe02
Private Key: 0x2463d2b80ae49c08b80711f1aad9f86d8388f255efd5644017bf96f2eaa471c0
Mnemonic:    over pipe orchard approve crisp gold moral another that tourist east bottom
Purpose:     Smart contract deployment
Fund with:   0.1-0.5 POL
```

### Oracle Wallet
```
Address:     0x5517CA6A6eaD28aa0A57eDb92E58949FB399379D
Private Key: 0x0f28de456fc2a44488afacfc25eab1ed214e5a8071731abe7dcd7d90ca282757
Mnemonic:    govern orchard emotion short depth pudding rough stumble travel toss buddy paper
Purpose:     Backend payment signing
Fund with:   Nothing needed
```

### Insurance Fund Wallet
```
Address:     0xAAC995440E1C747C9CaeE504855d3403a095e4dA
Private Key: 0x33075f1f6cbabf39d551668e5947e38aae7a353d4f214620f62c0bea8091ceec
Mnemonic:    bright taste quiz soap caught hazard race topple expect total praise nephew
Purpose:     User protection fund
Fund with:   Automatic (3% of fees)
```

### Fee Wallet (al geconfigureerd)
```
Address:     0x596b95782d98295283c5d72142e477d92549cde3
Purpose:     Platform fee collection
```

---

## HUIDIGE CONTRACT ADRESSEN

| Chain | Contract | Status |
|-------|----------|--------|
| Polygon V3 | `0x8beED27aA6d28FE42a9e792d81046DD1337a8240` | ✅ Live |
| Polygon V4 | TBD (na funding) | ⏳ Pending |
| Base | TBD | ⏳ Pending |
| Arbitrum | TBD | ⏳ Pending |
| Optimism | TBD | ⏳ Pending |

---

## VOLGENDE SESSIE

Kom terug en zeg:
- **"funded"** - als je POL hebt gestuurd
- **"render klaar"** - als je Render hebt geconfigureerd
- **"alles klaar"** - als je beide hebt gedaan

Dan gaan we direct door met V4 deployment en feature building!

---

*Gegenereerd: 2025-12-06*
