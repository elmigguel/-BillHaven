/**
 * TON Network Configuration
 * The Open Network - Ultra-low fee blockchain ($0.025/tx)
 */

// TON Network configs
export const TON_NETWORKS = {
  mainnet: {
    id: 'ton-mainnet',
    name: 'TON',
    shortName: 'TON',
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    explorer: 'https://tonscan.org',
    isTestnet: false,
    nativeCurrency: {
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9
    }
  },
  testnet: {
    id: 'ton-testnet',
    name: 'TON Testnet',
    shortName: 'tTON',
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    explorer: 'https://testnet.tonscan.org',
    isTestnet: true,
    nativeCurrency: {
      name: 'Test Toncoin',
      symbol: 'TON',
      decimals: 9
    }
  }
};

// USDT Jetton addresses (official Tether contracts)
export const TON_USDT = {
  mainnet: {
    masterAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6, // CRITICAL: USDT uses 6 decimals, not 9!
    symbol: 'USDT',
    name: 'Tether USD'
  },
  testnet: {
    masterAddress: 'kQD0GKBM8ZbryVk2aESmzfU6b9b_8era_IkvBSELujFZPsyy',
    decimals: 6,
    symbol: 'USDT',
    name: 'Test USDT'
  }
};

// Fee constants
export const TON_FEES = {
  // Gas amount to send with jetton transfers
  jettonTransferGas: '0.05', // 0.05 TON
  // Forward amount for TEP-74 compliance (MUST be 1 nanoton!)
  forwardAmount: '0.000000001', // 1 nanoton
  // Average transfer fee
  averageTransferFee: '0.0145' // ~$0.10 USD
};

// Faucets for testnet
export const TON_FAUCETS = {
  ton: 'https://faucet.tonxapi.com/',
  chainstack: 'https://faucet.chainstack.com/ton-testnet-faucet'
};

// Get network config
export const getTonNetwork = (isTestnet = false) => {
  return isTestnet ? TON_NETWORKS.testnet : TON_NETWORKS.mainnet;
};

// Get USDT config for network
export const getTonUSDT = (isTestnet = false) => {
  return isTestnet ? TON_USDT.testnet : TON_USDT.mainnet;
};

export default TON_NETWORKS;
