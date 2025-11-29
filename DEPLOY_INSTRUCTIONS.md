# BillHaven Deployment Instructions

**Last Updated:** 2025-11-29
**Status:** Ready for Mainnet

---

## Quick Start (3 Steps)

### Step 1: Deploy to Polygon Mainnet
```bash
cd /home/elmigguel/BillHaven

# Deploy V2 Escrow to Polygon Mainnet
npx hardhat run scripts/deploy-v2.js --network polygon

# Save the contract address!
# Example: 0x1234...5678
```

### Step 2: Update Frontend Config
Edit `src/config/contracts.js` and add your mainnet address:
```javascript
// Find the ESCROW_CONTRACTS object and update:
137: '0xYOUR_NEW_MAINNET_ADDRESS_HERE',  // Polygon Mainnet
```

### Step 3: Rebuild & Deploy
```bash
npm run build
git add .
git commit -m "feat: Polygon mainnet deployment"
git push
```
Vercel auto-deploys from git push.

---

## Your Wallet Info

| Wallet | Address | Balance |
|--------|---------|---------|
| **Deployer** | `0x79fd43109b6096f892706B16f9f750fcaFe5C5d2` | 1.0 POL |
| **User Test** | `0x39b18e4a437673e0156f16dcf5fa4557ba9ab669` | 2.4 POL |
| **Fee Wallet** | `0x596b95782d98295283c5d72142e477d92549cde3` | - |
| **Private Key** | In `.env` line 27 | - |

---

## Deployed Contracts

| Network | Chain ID | Contract | Status |
|---------|----------|----------|--------|
| Polygon Amoy (testnet) | 80002 | `0x792B01c5965D94e2875DeFb48647fB3b4dd94e15` | DEPLOYED |
| Polygon Mainnet | 137 | - | READY TO DEPLOY |

---

## After Mainnet Deploy: Whitelist Tokens

After deploying to mainnet, whitelist the ERC20 tokens:

```bash
# Run the whitelist script (creates it if needed)
npx hardhat run scripts/whitelist-tokens.js --network polygon
```

Or manually via PolygonScan:
1. Go to your contract on PolygonScan
2. Write Contract → addSupportedToken
3. Add each token address:
   - USDT: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
   - USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
   - WBTC: `0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6`

---

## Test First Transaction

1. Open: https://billhaven-96oq9519q-mikes-projects-f9ae2848.vercel.app
2. Login with your account
3. Connect wallet `0x39b18e4a437673e0156f16dcf5fa4557ba9ab669`
4. Create a bill with 0.5 POL
5. Check the escrow on PolygonScan

---

## TON Integration (Optional)

TON is ready but not deployed yet. To enable:

1. Deploy TON contract (see `ton-contracts/README.md`)
2. Update `src/config/tonNetworks.js` with contract address
3. The frontend already supports TON payments!

---

## Troubleshooting

### "Insufficient funds"
- Check deployer wallet has enough POL for gas (~0.01 POL)

### "Network not configured"
- Check `.env` has correct RPC URLs

### "Transaction failed"
- Check you're on the right network in MetaMask

---

## Support

- Live App: https://billhaven-96oq9519q-mikes-projects-f9ae2848.vercel.app
- Contract (testnet): https://amoy.polygonscan.com/address/0x792B01c5965D94e2875DeFb48647fB3b4dd94e15
- Supabase: https://supabase.com/dashboard/project/bldjdctgjhtucyxqhwpc

---

*Deployment takes ~2 minutes. Good luck!*
