// Blockchain network configurations for multi-chain support

export const EVM_NETWORKS = {
  ethereum: {
    chainId: 1,
    hexChainId: '0x1',
    name: 'Ethereum',
    shortName: 'ETH',
    rpc: import.meta.env.VITE_ETH_RPC_URL,
    explorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        symbol: 'USDT'
      },
      USDC: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        decimals: 8,
        symbol: 'WBTC'
      }
    }
  },
  polygon: {
    chainId: 137,
    hexChainId: '0x89',
    name: 'Polygon',
    shortName: 'MATIC',
    rpc: import.meta.env.VITE_POLYGON_RPC_URL,
    explorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        symbol: 'USDT'
      },
      USDC: {
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        decimals: 8,
        symbol: 'WBTC'
      }
    }
  },
  bsc: {
    chainId: 56,
    hexChainId: '0x38',
    name: 'BNB Smart Chain',
    shortName: 'BNB',
    rpc: import.meta.env.VITE_BSC_RPC_URL,
    explorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
        symbol: 'USDT'
      },
      USDC: {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        decimals: 18,
        symbol: 'USDC'
      },
      BTCB: {
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        decimals: 18,
        symbol: 'BTCB'
      }
    }
  },
  arbitrum: {
    chainId: 42161,
    hexChainId: '0xa4b1',
    name: 'Arbitrum One',
    shortName: 'ARB',
    rpc: import.meta.env.VITE_ARBITRUM_RPC_URL,
    explorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
        symbol: 'USDT'
      },
      USDC: {
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        decimals: 8,
        symbol: 'WBTC'
      }
    }
  },
  optimism: {
    chainId: 10,
    hexChainId: '0xa',
    name: 'Optimism',
    shortName: 'OP',
    rpc: import.meta.env.VITE_OPTIMISM_RPC_URL,
    explorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        decimals: 6,
        symbol: 'USDT'
      },
      USDC: {
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
        decimals: 8,
        symbol: 'WBTC'
      }
    }
  },
  base: {
    chainId: 8453,
    hexChainId: '0x2105',
    name: 'Base',
    shortName: 'BASE',
    rpc: import.meta.env.VITE_BASE_RPC_URL,
    explorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: {
      USDC: {
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
        decimals: 8,
        symbol: 'WBTC'
      }
    }
  }
}

// Bitcoin network configuration
export const BITCOIN_CONFIG = {
  network: import.meta.env.VITE_BTC_NETWORK || 'mainnet',
  mempoolApi: import.meta.env.VITE_MEMPOOL_API,
  explorer: 'https://mempool.space'
}

// Tron network configuration
export const TRON_CONFIG = {
  gridApi: import.meta.env.VITE_TRON_GRID_API,
  explorer: 'https://tronscan.org',
  tokens: {
    USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
  }
}

// Helper to get all supported networks
export const ALL_NETWORKS = {
  ...Object.keys(EVM_NETWORKS).reduce((acc, key) => {
    acc[key] = { ...EVM_NETWORKS[key], type: 'evm' }
    return acc
  }, {}),
  bitcoin: { ...BITCOIN_CONFIG, type: 'bitcoin', name: 'Bitcoin', shortName: 'BTC' },
  tron: { ...TRON_CONFIG, type: 'tron', name: 'Tron', shortName: 'TRX' }
}

// Helper to check if network is EVM compatible
export const isEVMNetwork = (networkKey) => {
  return Object.keys(EVM_NETWORKS).includes(networkKey)
}

// Helper to get network by chain ID
export const getNetworkByChainId = (chainId) => {
  return Object.values(EVM_NETWORKS).find(network => network.chainId === chainId)
}
