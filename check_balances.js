import { ethers } from 'ethers';

// Wallet addresses
const WALLET_1 = '0x79fd43109b6096f892706B16f9f750fcaFe5C5d2'; // Original deployer
const WALLET_2 = '0x39b18e4a437673e0156f16dcf5fa4557ba9ab669'; // User's wallet with ETH

// Network configurations
const networks = [
  {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpc: 'https://polygon-rpc.com',
    symbol: 'POL',
    decimals: 18
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpc: 'https://arb1.arbitrum.io/rpc',
    symbol: 'ETH',
    decimals: 18
  },
  {
    name: 'Optimism',
    chainId: 10,
    rpc: 'https://mainnet.optimism.io',
    symbol: 'ETH',
    decimals: 18
  },
  {
    name: 'Base',
    chainId: 8453,
    rpc: 'https://mainnet.base.org',
    symbol: 'ETH',
    decimals: 18
  },
  {
    name: 'BSC',
    chainId: 56,
    rpc: 'https://bsc-dataseed1.binance.org',
    symbol: 'BNB',
    decimals: 18
  },
  {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpc: 'https://cloudflare-eth.com',
    symbol: 'ETH',
    decimals: 18
  },
  {
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    rpc: 'https://rpc-amoy.polygon.technology',
    symbol: 'POL',
    decimals: 18
  }
];

async function getBalance(provider, address, networkName) {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Error getting balance for ${networkName}:`, error.message);
    return 'ERROR';
  }
}

async function checkAllBalances() {
  console.log('='.repeat(80));
  console.log('WALLET BALANCE CHECK');
  console.log('='.repeat(80));
  console.log('\nWallet 1 (Original Deployer):', WALLET_1);
  console.log('Wallet 2 (User\'s Wallet):    ', WALLET_2);
  console.log('\n' + '='.repeat(80));

  for (const network of networks) {
    console.log(`\n${network.name} (Chain ID: ${network.chainId})`);
    console.log('-'.repeat(80));

    try {
      const provider = new ethers.JsonRpcProvider(network.rpc);

      // Get balances
      const balance1 = await getBalance(provider, WALLET_1, network.name);
      const balance2 = await getBalance(provider, WALLET_2, network.name);

      console.log(`  Wallet 1: ${balance1} ${network.symbol}`);
      console.log(`  Wallet 2: ${balance2} ${network.symbol}`);

      // Check if sufficient for deployment (rough estimate: 0.01 for L2, 0.1 for L1)
      const minRequired = [1, 56].includes(network.chainId) ? 0.1 : 0.01;

      if (parseFloat(balance1) >= minRequired) {
        console.log(`  ✓ Wallet 1 has sufficient balance for deployment`);
      }
      if (parseFloat(balance2) >= minRequired) {
        console.log(`  ✓ Wallet 2 has sufficient balance for deployment`);
      }
      if (parseFloat(balance1) < minRequired && parseFloat(balance2) < minRequired) {
        console.log(`  ✗ Neither wallet has sufficient balance (min ~${minRequired} ${network.symbol})`);
      }

    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEPLOYMENT RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('\nEstimated deployment costs:');
  console.log('  - Ethereum Mainnet: ~0.05-0.15 ETH (expensive!)');
  console.log('  - L2s (Arbitrum/Optimism/Base/Polygon): ~0.001-0.01 ETH/POL (cheap!)');
  console.log('  - BSC: ~0.005-0.02 BNB (moderate)');
  console.log('\nRecommended deployment order:');
  console.log('  1. Polygon Amoy Testnet - Test everything first!');
  console.log('  2. Polygon/Arbitrum/Optimism/Base - Cheap L2s for production');
  console.log('  3. BSC - If targeting BSC users');
  console.log('  4. Ethereum - Only if necessary (very expensive)');
  console.log('\n' + '='.repeat(80));
}

checkAllBalances().catch(console.error);
