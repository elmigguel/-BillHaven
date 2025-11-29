# BillHaven Escrow - Deployment Guide

Complete step-by-step guide to deploy and use the BillHaven escrow smart contract.

## Prerequisites

### 1. Install Node.js and npm

```bash
# Check versions
node --version  # Should be v18 or higher
npm --version

# Install if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install Blueprint

```bash
# Install globally
npm install -g @ton/blueprint

# Or use npx (recommended)
npx @ton/blueprint --version
```

### 3. Get TON Wallet

- **Testnet**: Use [Tonkeeper](https://tonkeeper.com/) or [Tonhub](https://tonhub.com/)
- **Mainnet**: Same, but switch to mainnet mode

### 4. Get Testnet TON

- Faucet: https://testnet.toncenter.com/
- Request ~10 TON for testing

## Project Setup

### Option 1: New Blueprint Project

```bash
# Create new project
npm create ton@latest billhaven-escrow

# Follow prompts:
# - Select "An empty contract (FunC)"
# - Enter contract name: BillHavenEscrow
# - Choose TypeScript

cd billhaven-escrow

# Copy the contract files
cp /path/to/billhaven_escrow.tact contracts/
cp /path/to/billhaven_wrapper.ts wrappers/BillHavenEscrow.ts
cp /path/to/billhaven_test.spec.ts tests/BillHavenEscrow.spec.ts
```

### Option 2: Add to Existing Project

```bash
# Navigate to your project
cd /home/elmigguel/BillHaven

# Initialize npm if needed
npm init -y

# Install dependencies
npm install --save-dev @ton/blueprint @ton/core @ton/crypto @ton/sandbox
npm install --save-dev @tact-lang/compiler
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev typescript ts-node
```

## Project Structure

```
billhaven-escrow/
├── contracts/
│   └── billhaven_escrow.tact       # Main contract
├── wrappers/
│   └── BillHavenEscrow.ts          # TypeScript wrapper
├── tests/
│   └── BillHavenEscrow.spec.ts     # Test suite
├── scripts/
│   ├── deployBillHavenEscrow.ts    # Deployment script
│   └── interactWithContract.ts     # Interaction examples
├── build/                           # Compiled contracts (generated)
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Configuration Files

### package.json

```json
{
  "name": "billhaven-escrow",
  "version": "1.0.0",
  "scripts": {
    "build": "blueprint build",
    "test": "jest",
    "deploy": "blueprint run deployBillHavenEscrow",
    "deploy:testnet": "blueprint run deployBillHavenEscrow --testnet",
    "deploy:mainnet": "blueprint run deployBillHavenEscrow --mainnet"
  },
  "dependencies": {
    "@ton/core": "^0.56.0",
    "@ton/crypto": "^3.2.0",
    "@ton/ton": "^13.11.0"
  },
  "devDependencies": {
    "@ton/blueprint": "^0.18.0",
    "@ton/sandbox": "^0.16.0",
    "@ton/test-utils": "^0.4.0",
    "@tact-lang/compiler": "^1.4.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["contracts/**/*", "wrappers/**/*", "tests/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        resolveJsonModule: true,
      },
    },
  },
};
```

## Compilation

### 1. Compile Contract

```bash
# Build with Blueprint
npx blueprint build

# Select contract: BillHavenEscrow
# This generates:
# - build/BillHavenEscrow/billhaven_escrow.compiled.json
# - build/BillHavenEscrow/billhaven_escrow.pkg
# - build/BillHavenEscrow/billhaven_escrow.code.fc (FunC output)
# - build/BillHavenEscrow/billhaven_escrow.ts (TypeScript wrapper)
```

### 2. Verify Compilation

```bash
# Check build directory
ls -la build/BillHavenEscrow/

# Should see:
# - billhaven_escrow.compiled.json (compiled contract)
# - billhaven_escrow.pkg (package file)
# - billhaven_escrow.code.fc (FunC code)
```

## Testing

### 1. Run Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test BillHavenEscrow.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### 2. Expected Test Output

```
PASS  tests/BillHavenEscrow.spec.ts
  BillHavenEscrow
    Deployment
      ✓ should deploy successfully (123ms)
      ✓ should initialize with correct platform fee (45ms)
      ✓ should start with bill ID 1 (38ms)
    Create Bill
      ✓ should create bill with TON (156ms)
      ✓ should auto-increment bill ID (234ms)
    Claim Bill
      ✓ should allow payer to claim bill (98ms)
    Release Funds
      ✓ should release funds to payer with platform fee (187ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
```

## Deployment

### 1. Create Deployment Script

Create `scripts/deployBillHavenEscrow.ts`:

```typescript
import { toNano } from '@ton/core';
import { BillHavenEscrow } from '../wrappers/BillHavenEscrow';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const adminAddress = provider.sender().address!;

    const escrow = provider.open(
        await BillHavenEscrow.createFromConfig(
            { owner: adminAddress },
            await compile('BillHavenEscrow')
        )
    );

    await escrow.sendDeploy(provider.sender(), toNano('0.5'));

    await provider.waitForDeploy(escrow.address);

    console.log('Contract deployed at:', escrow.address.toString());
    console.log('Owner address:', adminAddress.toString());

    // Verify deployment
    const platformFee = await escrow.getPlatformFee();
    console.log('Platform fee:', platformFee / 100, '%');

    const nextBillId = await escrow.getNextBillId();
    console.log('Next bill ID:', nextBillId.toString());
}
```

### 2. Deploy to Testnet

```bash
# Deploy to testnet
npx blueprint run deployBillHavenEscrow --testnet

# Follow prompts:
# - Select wallet type (e.g., TON Connect 2.0)
# - Scan QR code with Tonkeeper
# - Confirm transaction
```

### 3. Deploy to Mainnet

```bash
# IMPORTANT: Test thoroughly on testnet first!

# Deploy to mainnet
npx blueprint run deployBillHavenEscrow --mainnet

# WARNING: This uses real TON!
```

### 4. Verify Deployment

```bash
# Check contract on explorer
# Testnet: https://testnet.tonscan.org/address/YOUR_CONTRACT_ADDRESS
# Mainnet: https://tonscan.org/address/YOUR_CONTRACT_ADDRESS
```

## Interaction Examples

### 1. Create Interaction Script

Create `scripts/interactWithContract.ts`:

```typescript
import { Address, toNano } from '@ton/core';
import { BillHavenEscrow, getDefaultExpiry } from '../wrappers/BillHavenEscrow';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const escrowAddress = Address.parse('EQC...'); // Your deployed contract
    const escrow = provider.open(BillHavenEscrow.createFromAddress(escrowAddress));

    // Example 1: Create bill
    console.log('Creating bill...');
    await escrow.sendCreateBill(provider.sender(), {
        payerAddress: Address.parse('EQD...'), // Payer address
        amount: toNano('10'),
        description: 'Electricity bill payment',
        expiryTimestamp: getDefaultExpiry(7),
    });

    // Wait for transaction
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Example 2: Get bill info
    const bill = await escrow.getBill(1n);
    console.log('Bill created:', {
        id: bill!.billId.toString(),
        maker: bill!.maker.toString(),
        payer: bill!.payer.toString(),
        amount: bill!.amount.toString(),
        status: bill!.status,
    });

    // Example 3: Claim bill (run as payer)
    console.log('Claiming bill...');
    await escrow.sendClaimBill(provider.sender(), 1n);

    // Example 4: Release funds (run as maker)
    console.log('Releasing funds...');
    await escrow.sendReleaseFunds(provider.sender(), 1n);

    // Example 5: Check platform fees
    const feesCollected = await escrow.getTotalFeesCollected();
    console.log('Platform fees collected:', feesCollected.toString());
}
```

### 2. Run Interaction

```bash
npx blueprint run interactWithContract --testnet
```

## Frontend Integration

### 1. Install TON Connect

```bash
npm install @tonconnect/ui @tonconnect/sdk
```

### 2. React Example

```typescript
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Address, toNano } from '@ton/core';
import { BillHavenEscrow, getDefaultExpiry } from './contracts/BillHavenEscrow';

function CreateBillButton() {
    const [tonConnectUI] = useTonConnectUI();
    const userAddress = useTonAddress();

    const createBill = async () => {
        const escrowAddress = Address.parse('EQC...'); // Your contract
        const escrow = BillHavenEscrow.createFromAddress(escrowAddress);

        const payerAddress = Address.parse('EQD...'); // From UI input

        const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
                {
                    address: escrowAddress.toString(),
                    amount: toNano('10.1').toString(),
                    payload: createBillMessage({
                        billId: 0n,
                        payerAddress,
                        amount: toNano('10'),
                        expiryTimestamp: getDefaultExpiry(7),
                        description: 'Bill payment',
                    }).toBoc().toString('base64'),
                },
            ],
        };

        await tonConnectUI.sendTransaction(tx);
    };

    return (
        <button onClick={createBill}>
            Create Bill (10 TON)
        </button>
    );
}
```

## Monitoring & Analytics

### 1. Event Indexing

Use TON indexers to track events:

```bash
# Install TON indexer
npm install @ton/indexer

# Or use TonAPI
# https://tonapi.io/
```

### 2. Example Indexer

```typescript
import { TonClient } from '@ton/ton';

const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

async function monitorBills(escrowAddress: Address) {
    // Subscribe to contract transactions
    const transactions = await client.getTransactions(escrowAddress, {
        limit: 100,
    });

    for (const tx of transactions) {
        // Parse events from tx body
        // Check for BillCreatedEvent, BillClaimedEvent, etc.
        console.log('Transaction:', tx.hash().toString('hex'));
    }
}
```

## Security Checklist

Before mainnet deployment:

- [ ] All unit tests passing
- [ ] Integration tests on testnet completed
- [ ] Security audit performed (optional but recommended)
- [ ] Admin keys secured (hardware wallet recommended)
- [ ] Platform fee correctly configured
- [ ] Emergency procedures documented
- [ ] Contract verified on explorer
- [ ] Gas costs tested thoroughly
- [ ] Edge cases handled
- [ ] Documentation complete

## Upgrading Contract

Since Tact contracts are immutable:

1. **Deploy new version** with fixes/improvements
2. **Pause old contract** (if pause feature added)
3. **Migrate active bills** manually
4. **Update frontend** to new contract address
5. **Notify users** of migration

## Troubleshooting

### Compilation Errors

```bash
# Clear build cache
rm -rf build/

# Rebuild
npx blueprint build
```

### Deployment Fails

```bash
# Check wallet balance
# Check network (testnet vs mainnet)
# Verify gas fees
# Check contract size (should be < 64KB)
```

### Transaction Fails

```bash
# Check TON amount (must include gas)
# Verify message structure
# Check contract state
# Review error logs
```

## Resources

- **TON Docs**: https://docs.ton.org/
- **Tact Docs**: https://docs.tact-lang.org/
- **Blueprint**: https://github.com/ton-org/blueprint
- **TON Explorer (Testnet)**: https://testnet.tonscan.org/
- **TON Explorer (Mainnet)**: https://tonscan.org/
- **TON Community**: https://t.me/tondev_eng

## Support

For issues or questions:
- Create GitHub issue
- Join Telegram support channel
- Email: support@billhaven.com

---

**IMPORTANT SECURITY NOTES:**

1. **Never share private keys** or mnemonics
2. **Test thoroughly on testnet** before mainnet
3. **Use hardware wallet** for mainnet admin keys
4. **Implement monitoring** for unusual activity
5. **Have emergency procedures** in place
6. **Consider security audit** for mainnet deployment
7. **Start with low platform fee** and adjust based on usage
8. **Keep admin wallet secure** - it controls dispute resolution

---

**License**: MIT

**Built with ❤️ for the TON ecosystem**
