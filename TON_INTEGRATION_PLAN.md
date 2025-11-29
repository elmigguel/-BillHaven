# TON Network Integration Plan - BillHaven

**Created:** 2025-11-29
**Status:** READY FOR IMPLEMENTATION
**Estimated Time:** 18-25 hours

---

## Executive Summary

TON integration adds ultra-low fee payments ($0.025/tx vs $15-50 on Ethereum) to BillHaven. Uses TonConnect 2.0 for wallet connection and Tact language for smart contracts.

---

## Phase 1: Setup (3-4 hours)

### NPM Packages Required

```bash
npm install @tonconnect/ui-react @ton/ton @ton/core @ton/crypto
npm install --save-dev @ton/blueprint
```

### File Structure

```
src/
├── contexts/
│   └── TonWalletContext.jsx      # NEW
├── components/
│   └── wallet/
│       └── TonConnectButton.jsx  # NEW
├── services/
│   └── tonPayment.js             # NEW
└── config/
    └── tonNetworks.js            # NEW

ton-contracts/                     # NEW Blueprint project
├── contracts/
│   └── BillHavenEscrow.tact
└── tests/
    └── BillHavenEscrow.spec.ts
```

---

## Phase 2: Wallet Integration (2-3 hours)

### TonWalletContext.jsx

```jsx
import { TonConnectUIProvider, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

export function TonWalletProvider({ children }) {
  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
```

### Manifest File (public/tonconnect-manifest.json)

```json
{
  "url": "https://billhaven.com",
  "name": "BillHaven",
  "iconUrl": "https://billhaven.com/logo.png"
}
```

---

## Phase 3: Smart Contract (6-8 hours)

### Escrow Contract (Tact Language)

```tact
contract BillHavenEscrow with Deployable {
    owner: Address;
    bills: map<Int, Bill>;

    receive(msg: Deposit) {
        // Lock funds in escrow
    }

    receive(msg: Release) {
        // Release to recipient
    }

    receive(msg: Refund) {
        // Refund to sender
    }

    receive(msg: DisputeResolve) {
        // Admin resolution
    }
}
```

### Deployment Commands

```bash
cd ton-contracts
npx blueprint build
npx blueprint test
npx blueprint run          # Testnet
npx blueprint run --mainnet # Mainnet
```

---

## Phase 4: Token Support

### USDT on TON
- **Contract:** `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`
- **Decimals:** 6
- **Transfer Fee:** ~0.037 TON (~$0.17)

### Jetton Transfer Code

```javascript
const body = beginCell()
  .storeUint(0xf8a7ea5, 32)  // Jetton transfer op
  .storeUint(0, 64)
  .storeCoins(amount)
  .storeAddress(recipient)
  .endCell();
```

---

## Phase 5: Testing

### Testnet Faucets
- https://faucet.chainstack.com/ton-testnet-faucet (1 TON/24h)
- https://faucet.tonxapi.com/ (Every 12h)

### Checklist
- [ ] Connect Tonkeeper wallet
- [ ] Deposit to escrow
- [ ] Release funds
- [ ] Refund flow
- [ ] USDT transfers
- [ ] Fee verification

---

## Cost Comparison

| Chain | Avg TX Fee | vs TON |
|-------|-----------|--------|
| Ethereum | $15-50 | 600-2000x more |
| Polygon | $0.10 | 4x more |
| BSC | $0.20 | 8x more |
| **TON** | **$0.025** | **Cheapest** |

---

## Timeline

| Week | Tasks |
|------|-------|
| 1 | Setup + Wallet integration |
| 2 | Smart contract + Testing |
| 3 | Security audit + Fixes |
| 4 | Mainnet launch |

---

## Resources

- [TON Docs](https://docs.ton.org/)
- [Tact Language](https://docs.tact-lang.org/)
- [TonConnect SDK](https://github.com/ton-connect/sdk)
- [TON Explorer](https://tonscan.org/)
