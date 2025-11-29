# BillHaven Escrow Smart Contract

A production-ready Tact smart contract for P2P bill payment escrow on TON blockchain with support for both TON and Jetton (USDT/WBTC) payments.

## Features

### Core Functionality
- **Create Bill**: Lock funds (TON or Jettons) in escrow
- **Claim Bill**: Payer claims the bill to initiate payment
- **Release Funds**: Bill maker confirms fiat receipt and releases crypto
- **Dispute Resolution**: Admin can resolve disputes between parties
- **Auto-Refund**: Automatic refund after 7-day expiry
- **Platform Fee**: Configurable fee (default 4.4%)

### Security Features
- Owner/Admin access control using `Ownable` trait
- Status validation (prevent double-spending)
- Expiry timestamp validation
- Replay protection with queryId
- Excess TON refund mechanism
- Gas optimization with proper message modes

### Supported Assets
- **TON**: Native cryptocurrency
- **Jettons**: TEP-74 standard (USDT, WBTC, etc.)

## Contract Architecture

### Bill States
```
STATUS_CREATED (1)    -> Bill created, awaiting claim
STATUS_CLAIMED (2)    -> Payer claimed, awaiting fiat payment
STATUS_RELEASED (3)   -> Funds released to payer (final)
STATUS_DISPUTED (4)   -> Dispute raised, awaiting admin resolution
STATUS_REFUNDED (5)   -> Funds refunded to maker (final)
STATUS_CANCELLED (6)  -> Bill cancelled by maker (final)
```

### Message Flow

#### Happy Path (TON)
```
1. Bill Maker -> CreateBill (with TON)
2. Payer -> ClaimBill
3. Payer sends fiat off-chain
4. Bill Maker -> ReleaseFunds
5. Contract -> Transfer to Payer (amount - fee)
6. Contract -> Keep platform fee
```

#### Refund Path
```
1. Bill Maker -> CreateBill
2. Wait 7 days (expiry)
3. Anyone -> RefundBill
4. Contract -> Refund to Bill Maker
```

#### Dispute Path
```
1. Bill Maker -> CreateBill
2. Payer -> ClaimBill
3. Either Party -> DisputeBill
4. Admin -> ResolveDispute (choose winner)
5. Contract -> Transfer to winner
```

## Messages Reference

### CreateBill
```typescript
message CreateBill {
    billId: Int;              // Unique ID (0 for auto-increment)
    payerAddress: Address;    // Who can claim this bill
    amount: Int;              // Amount in nanotons/jettons
    jettonWallet: Address?;   // null for TON, jetton wallet for tokens
    expiryTimestamp: Int;     // Unix timestamp (0 for 7 days default)
    description: String;      // Human-readable description
}
```

### ClaimBill
```typescript
message ClaimBill {
    billId: Int;
    queryId: Int;  // For replay protection
}
```

### ReleaseFunds
```typescript
message ReleaseFunds {
    billId: Int;
    queryId: Int;
}
```

### RefundBill
```typescript
message RefundBill {
    billId: Int;
    queryId: Int;
}
```

### DisputeBill
```typescript
message DisputeBill {
    billId: Int;
    reason: String;    // Dispute reason
    queryId: Int;
}
```

### ResolveDispute (Admin Only)
```typescript
message ResolveDispute {
    billId: Int;
    releaseToMaker: Bool;  // true = refund maker, false = release to payer
    queryId: Int;
}
```

### UpdatePlatformFee (Admin Only)
```typescript
message UpdatePlatformFee {
    newFeeBasisPoints: Int;  // e.g., 440 = 4.4%
}
```

### WithdrawPlatformFees (Admin Only)
```typescript
message WithdrawPlatformFees {
    amount: Int;  // Amount to withdraw in nanotons
}
```

## Getter Methods

```typescript
// Get bill details
getBill(billId: Int): Bill?

// Get current platform fee (basis points)
getPlatformFee(): Int

// Get total fees collected
getTotalFeesCollected(): Int

// Get next auto-increment bill ID
getNextBillId(): Int

// Get contract balance
getContractBalance(): Int

// Check if bill is expired
isBillExpired(billId: Int): Bool

// Check if bill can be refunded
canRefund(billId: Int): Bool

// Get contract owner
owner(): Address
```

## Events

All major operations emit events for off-chain indexing:

- `BillCreatedEvent`
- `BillClaimedEvent`
- `FundsReleasedEvent`
- `BillRefundedEvent`
- `DisputeRaisedEvent`
- `DisputeResolvedEvent`

## Deployment Guide

### Prerequisites

```bash
# Install Blueprint (TON development framework)
npm install -g @ton/blueprint

# Create new project
npm create ton@latest

# Or add to existing project
npm install --save-dev @ton/blueprint
```

### Project Structure

```
ton-contracts/
├── billhaven_escrow.tact    # Main contract
├── wrappers/
│   └── BillHavenEscrow.ts   # TypeScript wrapper
├── tests/
│   └── BillHavenEscrow.spec.ts
└── scripts/
    └── deployBillHavenEscrow.ts
```

### Compilation

```bash
# Compile Tact contract
npx blueprint build

# This generates:
# - build/BillHavenEscrow.compiled.json
# - build/BillHavenEscrow.pkg
```

### Deployment

```bash
# Deploy to testnet
npx blueprint run

# Deploy to mainnet
npx blueprint run --mainnet
```

## Testing

### Unit Tests (Jest + Blueprint)

```typescript
import { Blockchain, SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { BillHavenEscrow } from '../wrappers/BillHavenEscrow';
import '@ton/test-utils';

describe('BillHavenEscrow', () => {
    let blockchain: Blockchain;
    let escrow: SandboxContract<BillHavenEscrow>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        escrow = blockchain.openContract(await BillHavenEscrow.fromInit(owner.address));

        const deployer = await blockchain.treasury('deployer');
        await escrow.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy' });
    });

    it('should deploy', async () => {
        // Check contract deployed successfully
    });

    it('should create bill with TON', async () => {
        const maker = await blockchain.treasury('maker');
        const payer = await blockchain.treasury('payer');

        await escrow.send(maker.getSender(),
            { value: toNano('10.1') },
            {
                $$type: 'CreateBill',
                billId: 1n,
                payerAddress: payer.address,
                amount: toNano('10'),
                jettonWallet: null,
                expiryTimestamp: BigInt(Math.floor(Date.now() / 1000) + 604800),
                description: 'Test bill'
            }
        );

        const bill = await escrow.getGetBill(1n);
        expect(bill?.amount).toBe(toNano('10'));
    });

    // Add more tests...
});
```

### Integration Tests

```bash
# Test on local blockchain
npx blueprint test

# Test on testnet
npx blueprint test --testnet
```

## Gas Optimization

### Storage Costs
- Contract stores bills in a map (efficient lookup)
- Minimum balance maintained: 0.05 TON
- Bills auto-purge after finalization (optional feature)

### Message Modes
- `SendIgnoreErrors`: Continue on error
- Excess TON automatically refunded
- Gas fees deducted from sender

## Security Considerations

### Implemented
- ✅ Owner-only admin functions
- ✅ Status validation (prevent double-spending)
- ✅ Expiry validation
- ✅ Amount validation (> 0)
- ✅ Replay protection (queryId)
- ✅ Excess TON refund
- ✅ Platform fee limits (max 100%)

### Best Practices
- Always use unique queryId for each transaction
- Validate bill exists before operations
- Check status before state changes
- Use events for off-chain monitoring
- Test on testnet before mainnet

## Platform Fee Calculation

```typescript
// Example: 4.4% fee on 100 TON
platformFee = (100 * 440) / 10000 = 4.4 TON
payerReceives = 100 - 4.4 = 95.6 TON
```

## Jetton Support

### Creating Bill with Jettons

1. Transfer Jettons to contract with forward payload:
```typescript
// Transfer USDT to escrow
await jettonWallet.sendTransfer({
    to: escrowAddress,
    amount: '1000000', // 1 USDT (6 decimals)
    forwardTonAmount: toNano('0.3'),
    forwardPayload: beginCell()
        .storeUint(1, 64)  // billId
        .storeAddress(payerAddress)
        .storeUint(expiryTimestamp, 64)
        .endCell()
});
```

2. Contract receives `JettonTransferNotification`
3. Contract creates bill with jetton details

### Releasing Jettons

Contract sends `JettonTransfer` message to its jetton wallet to transfer to payer.

## Upgrade Path

This contract is immutable. For upgrades:
1. Deploy new version
2. Migrate active bills manually
3. Update frontend to new contract address

## Support

For issues or questions:
- GitHub: [Your Repo]
- Telegram: [Your Channel]
- Email: [Your Email]

## License

MIT License - See LICENSE file

---

## Quick Reference Card

| Operation | Min TON Required | Who Can Call | Status Required |
|-----------|------------------|--------------|-----------------|
| CreateBill | amount + 0.1 | Anyone | - |
| ClaimBill | 0.05 | Payer only | CREATED |
| ReleaseFunds | 0.05 | Maker only | CLAIMED |
| RefundBill | 0.05 | Anyone (if expired) | Any (except finalized) |
| DisputeBill | 0.05 | Maker or Payer | CLAIMED |
| ResolveDispute | 0.05 | Admin only | DISPUTED |
| CancelBill | 0.05 | Maker only | CREATED |
| UpdatePlatformFee | 0.05 | Admin only | - |
| WithdrawPlatformFees | 0.05 | Admin only | - |

---

**Built with ❤️ for the TON ecosystem**
