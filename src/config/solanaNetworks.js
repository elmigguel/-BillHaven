/**
 * Solana Network Configuration
 *
 * BillHaven multi-chain support for Solana ecosystem
 * Supports: Native SOL, USDC, USDT (SPL tokens)
 */

// Solana Program IDs (will be updated after deployment)
export const PROGRAM_IDS = {
  mainnet: '', // Will be set after mainnet deployment
  devnet: '',  // Will be set after devnet deployment
  localnet: 'BillHaven11111111111111111111111111111111' // For local testing
};

// Network configurations
export const SOLANA_NETWORKS = {
  mainnet: {
    name: 'Solana Mainnet',
    endpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    explorer: 'https://solscan.io',
    explorerTx: (tx) => `https://solscan.io/tx/${tx}`,
    explorerAddress: (addr) => `https://solscan.io/account/${addr}`,
    programId: PROGRAM_IDS.mainnet,
    isTestnet: false
  },
  devnet: {
    name: 'Solana Devnet',
    endpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
    explorer: 'https://solscan.io',
    explorerTx: (tx) => `https://solscan.io/tx/${tx}?cluster=devnet`,
    explorerAddress: (addr) => `https://solscan.io/account/${addr}?cluster=devnet`,
    programId: PROGRAM_IDS.devnet,
    isTestnet: true
  },
  localnet: {
    name: 'Localhost',
    endpoint: 'http://127.0.0.1:8899',
    wsEndpoint: 'ws://127.0.0.1:8900',
    explorer: null,
    explorerTx: () => null,
    explorerAddress: () => null,
    programId: PROGRAM_IDS.localnet,
    isTestnet: true
  }
};

// SPL Token addresses (mainnet)
export const SOLANA_TOKENS = {
  mainnet: {
    USDC: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
    },
    USDT: {
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
    },
    SOL: {
      mint: 'So11111111111111111111111111111111111111112', // Wrapped SOL
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      isNative: true
    }
  },
  devnet: {
    // Devnet tokens (for testing)
    USDC: {
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Devnet)',
      logo: null
    },
    USDT: {
      mint: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS', // Devnet USDT
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD (Devnet)',
      logo: null
    },
    SOL: {
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      logo: null,
      isNative: true
    }
  }
};

// Transaction fees estimation
export const SOLANA_FEES = {
  baseFee: 5000, // 5000 lamports = 0.000005 SOL
  priorityFee: 10000, // Optional priority fee
  rentExemption: {
    tokenAccount: 2039280, // ~0.00203928 SOL for token account
    escrowAccount: 3000000  // ~0.003 SOL for escrow PDA (estimated)
  }
};

// Confirmation levels
export const CONFIRMATION_LEVELS = {
  processed: 'processed',   // Transaction processed (fastest, ~400ms)
  confirmed: 'confirmed',   // 1 confirmation (~1-2 seconds)
  finalized: 'finalized'    // Max confirmations (~30 seconds, safest)
};

// Default configuration
export const DEFAULT_SOLANA_CONFIG = {
  network: 'devnet',
  commitment: 'confirmed',
  preflightCommitment: 'processed',
  skipPreflight: false
};

// Helper functions
export function getSolanaNetwork(networkKey = 'devnet') {
  return SOLANA_NETWORKS[networkKey] || SOLANA_NETWORKS.devnet;
}

export function getSolanaToken(symbol, networkKey = 'mainnet') {
  const networkTokens = SOLANA_TOKENS[networkKey] || SOLANA_TOKENS.devnet;
  return networkTokens[symbol.toUpperCase()];
}

export function getSupportedSolanaTokens(networkKey = 'mainnet') {
  return Object.values(SOLANA_TOKENS[networkKey] || SOLANA_TOKENS.devnet);
}

export function isNativeSOL(mintAddress) {
  return mintAddress === 'So11111111111111111111111111111111111111112' ||
         mintAddress === null ||
         mintAddress === undefined;
}

export function lamportsToSOL(lamports) {
  return lamports / 1e9;
}

export function solToLamports(sol) {
  return Math.floor(sol * 1e9);
}

export function formatSOLAmount(lamports, decimals = 4) {
  const sol = lamportsToSOL(lamports);
  return sol.toFixed(decimals);
}

// Wallet adapter configuration
export const WALLET_ADAPTER_CONFIG = {
  autoConnect: true,
  wallets: [
    'phantom',
    'solflare',
    'backpack',
    'coinbase',
    'trust'
  ]
};

// RPC endpoints (fallbacks)
export const RPC_ENDPOINTS = {
  mainnet: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
  ],
  devnet: [
    'https://api.devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet'
  ]
};

// Export default
export default {
  SOLANA_NETWORKS,
  SOLANA_TOKENS,
  SOLANA_FEES,
  CONFIRMATION_LEVELS,
  DEFAULT_SOLANA_CONFIG,
  PROGRAM_IDS,
  getSolanaNetwork,
  getSolanaToken,
  getSupportedSolanaTokens,
  isNativeSOL,
  lamportsToSOL,
  solToLamports,
  formatSOLAmount
};
