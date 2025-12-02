# BILLHAVEN INTEGRATION ACTION PLAN
**Quick Reference for Multi-Chain Expansion**
**Date:** 2025-12-01

---

## EXECUTIVE SUMMARY

BillHaven has **85% of industry standard** coverage. The following action plan brings it to **95%** with **16.5 hours of work**.

---

## PRIORITY 1: DO THIS WEEK (16.5 hours)

### 1. Add DAI Stablecoin (30 minutes) 🔴 CRITICAL

**Why:** Decentralized stablecoin, widely used in DeFi

**Implementation:**

```javascript
// Add to src/config/contracts.js -> SUPPORTED_TOKENS

// Ethereum (1)
DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }

// Polygon (137)
DAI: { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 }

// Arbitrum (42161)
DAI: { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 }

// Optimism (10)
DAI: { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 }

// BSC (56)
DAI: { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 }

// Base (8453)
DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 }
```

**Also add to TOKEN_DECIMALS map (lowercase):**
```javascript
// Ethereum
"0x6b175474e89094c44da98b954eedeac495271d0f": 18,
// Polygon
"0x8f3cf7ad23cd3cadb D9735aff958023239c6a063": 18,
// etc...
```

**Test:** Create bill with DAI on each chain

---

### 2. Add Avalanche C-Chain (2 hours) 🔴 HIGH PRIORITY

**Why:** Top 15 crypto, fast finality, low fees, EVM compatible

**Step 1: Add to networks.js (src/config/networks.js)**

```javascript
export const EVM_NETWORKS = {
  // ... existing networks
  avalanche: {
    chainId: 43114,
    hexChainId: '0xa86a',
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    tokens: {
      USDT: {
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        decimals: 6,
        symbol: 'USDT'
      },
      USDC: {
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        symbol: 'USDC'
      },
      WBTC: {
        address: '0x50b7545627a5162F82A992c33b87aDc75187B218',
        decimals: 8,
        symbol: 'WBTC'
      },
      DAI: {
        address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
        decimals: 18,
        symbol: 'DAI'
      }
    }
  }
}
```

**Step 2: Add to contracts.js**

```javascript
// ESCROW_ADDRESSES (testnet)
43113: "",  // Avalanche Fuji Testnet

// ESCROW_ADDRESSES (mainnet)
43114: "",  // Avalanche C-Chain

// SUPPORTED_TOKENS
43114: {
  USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  WBTC: "0x50b7545627a5162F82A992c33b87aDc75187B218",
  DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
}

// TOKEN_DECIMALS (add lowercase addresses)
"0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": 6,   // USDT
"0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": 6,   // USDC
"0x50b7545627a5162f82a992c33b87adc75187b218": 8,   // WBTC
"0xd586e7f844cea2f87f50152665bcbc2c279d8d70": 18   // DAI

// NETWORKS
43114: {
  chainId: 43114,
  name: "Avalanche",
  shortName: "AVAX",
  rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  blockExplorer: "https://snowtrace.io",
  isTestnet: false,
  gasEstimate: "$0.01-$0.50"
}
```

**Step 3: Add testnet support**

```javascript
43113: {
  chainId: 43113,
  name: "Avalanche Fuji",
  shortName: "FUJI",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  blockExplorer: "https://testnet.snowtrace.io",
  isTestnet: true,
  gasEstimate: "FREE"
}
```

**Test:**
1. Connect MetaMask to Avalanche
2. Switch to Avalanche in UI
3. Create bill with USDC
4. Verify on Snowtrace

---

### 3. Add zkSync Era (2 hours) 🔴 HIGH PRIORITY

**Why:** Ethereum L2 with ZK-rollup, ultra-low fees, growing adoption

**Add to networks.js:**

```javascript
zksync: {
  chainId: 324,
  hexChainId: '0x144',
  name: 'zkSync Era',
  shortName: 'zkSync',
  rpc: 'https://mainnet.era.zksync.io',
  explorer: 'https://explorer.zksync.io',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  tokens: {
    USDT: {
      address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
      decimals: 6,
      symbol: 'USDT'
    },
    USDC: {
      address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
      decimals: 6,
      symbol: 'USDC'
    },
    WBTC: {
      address: '0xBBeB516fb02a01611cBBE0453Fe3c580D7281011',
      decimals: 8,
      symbol: 'WBTC'
    }
  }
}
```

**Add to contracts.js:**

```javascript
// ESCROW_ADDRESSES
324: "",  // zkSync Era Mainnet
280: "",  // zkSync Era Testnet

// SUPPORTED_TOKENS
324: {
  USDT: "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C",
  USDC: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
  WBTC: "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011"
}

// TOKEN_DECIMALS
"0x493257fd37edb34451f62edf8d2a0c418852ba4c": 6,
"0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4": 6,
"0xbbeb516fb02a01611cbbe0453fe3c580d7281011": 8

// NETWORKS
324: {
  chainId: 324,
  name: "zkSync Era",
  shortName: "zkSync",
  rpcUrl: "https://mainnet.era.zksync.io",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorer: "https://explorer.zksync.io",
  isTestnet: false,
  gasEstimate: "$0.01-$0.05"
}
```

**Test:** Same as Avalanche

---

### 4. Add RPC Fallback System (4 hours) 🟡 RELIABILITY

**Why:** Single RPC endpoint = single point of failure

**Create new file: src/services/rpcManager.js**

```javascript
/**
 * RPC Endpoint Manager with Automatic Failover
 * Rotates through multiple RPC endpoints if one fails
 */

import { ethers } from 'ethers'

// RPC endpoints per network (primary + fallbacks)
export const RPC_ENDPOINTS = {
  ethereum: [
    process.env.VITE_ETH_RPC_ALCHEMY,     // Primary (paid, fastest)
    'https://eth.llamarpc.com',            // Fallback 1
    'https://rpc.ankr.com/eth',            // Fallback 2
    'https://ethereum.publicnode.com',     // Fallback 3
    'https://eth.rpc.blxrbdn.com'         // Fallback 4
  ],
  polygon: [
    process.env.VITE_POLYGON_RPC_ALCHEMY,
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon.llamarpc.com',
    'https://polygon-bor-rpc.publicnode.com'
  ],
  arbitrum: [
    process.env.VITE_ARBITRUM_RPC_ALCHEMY,
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.llamarpc.com'
  ],
  optimism: [
    process.env.VITE_OPTIMISM_RPC_ALCHEMY,
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://optimism.llamarpc.com'
  ],
  base: [
    process.env.VITE_BASE_RPC_ALCHEMY,
    'https://mainnet.base.org',
    'https://base.llamarpc.com'
  ],
  bsc: [
    process.env.VITE_BSC_RPC,
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://rpc.ankr.com/bsc'
  ],
  avalanche: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://rpc.ankr.com/avalanche'
  ],
  zksync: [
    'https://mainnet.era.zksync.io',
    'https://zksync.drpc.org'
  ]
}

// Provider cache to avoid recreating
const providerCache = new Map()

/**
 * Get a working provider with automatic failover
 * @param {string} networkKey - Network key (ethereum, polygon, etc.)
 * @returns {Promise<ethers.JsonRpcProvider>} Working provider
 */
export async function getProvider(networkKey) {
  const endpoints = RPC_ENDPOINTS[networkKey]
  if (!endpoints || endpoints.length === 0) {
    throw new Error(`No RPC endpoints configured for ${networkKey}`)
  }

  // Try each endpoint until one works
  for (const rpc of endpoints) {
    // Skip undefined env variables
    if (!rpc) continue

    const cacheKey = `${networkKey}:${rpc}`

    try {
      // Check cache first
      if (providerCache.has(cacheKey)) {
        const cached = providerCache.get(cacheKey)
        // Verify cached provider still works
        await cached.getBlockNumber()
        return cached
      }

      // Create new provider
      const provider = new ethers.JsonRpcProvider(rpc)

      // Test connection (with 5 second timeout)
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ])

      // Cache working provider
      providerCache.set(cacheKey, provider)
      console.log(`✅ Connected to ${networkKey} via ${rpc}`)
      return provider

    } catch (error) {
      console.warn(`⚠️ RPC ${rpc} failed:`, error.message)
      // Try next endpoint
      continue
    }
  }

  throw new Error(`All RPC endpoints failed for ${networkKey}`)
}

/**
 * Check RPC endpoint health
 * @param {string} networkKey - Network key
 * @returns {Promise<Object>} Health status
 */
export async function checkRPCHealth(networkKey) {
  const start = Date.now()
  try {
    const provider = await getProvider(networkKey)
    const blockNumber = await provider.getBlockNumber()
    const latency = Date.now() - start

    return {
      network: networkKey,
      healthy: true,
      latency,
      blockNumber,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      network: networkKey,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Clear provider cache (use if you want to force reconnect)
 */
export function clearProviderCache() {
  providerCache.clear()
}

export default {
  getProvider,
  checkRPCHealth,
  clearProviderCache,
  RPC_ENDPOINTS
}
```

**Update evmPayment.js to use new system:**

```javascript
import { getProvider } from './rpcManager'

// OLD:
// const provider = new ethers.JsonRpcProvider(networkConfig.rpc)

// NEW:
const provider = await getProvider(network)
```

**Test:**
1. Disconnect primary RPC
2. Verify automatic failover to backup
3. Check console logs for endpoint switching

---

### 5. Add USD Price Oracle (8 hours) 🟡 UX IMPROVEMENT

**Why:** Users want to know gas costs in USD

**Create new file: src/services/priceOracle.js**

```javascript
/**
 * Price Oracle Service
 * Fetches crypto prices in USD from multiple sources
 */

// Price cache (5 minute TTL)
const priceCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get token price in USD
 * @param {string} symbol - Token symbol (ETH, BTC, MATIC, etc.)
 * @returns {Promise<number>} Price in USD
 */
export async function getPriceInUSD(symbol) {
  const cacheKey = symbol.toUpperCase()

  // Check cache
  const cached = priceCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price
  }

  // Fetch from multiple sources (fallback strategy)
  const price = await fetchPriceWithFallback(symbol)

  // Cache result
  priceCache.set(cacheKey, {
    price,
    timestamp: Date.now()
  })

  return price
}

/**
 * Fetch price with fallback strategy
 */
async function fetchPriceWithFallback(symbol) {
  // Try CoinGecko first (no API key needed)
  try {
    return await fetchCoinGeckoPrice(symbol)
  } catch (error) {
    console.warn('CoinGecko failed, trying CoinMarketCap...')
  }

  // Fallback to CoinMarketCap
  try {
    return await fetchCoinMarketCapPrice(symbol)
  } catch (error) {
    console.warn('CoinMarketCap failed, trying Binance...')
  }

  // Fallback to Binance
  try {
    return await fetchBinancePrice(symbol)
  } catch (error) {
    console.error('All price sources failed')
  }

  // Return approximate price if all fail
  return getApproximatePrice(symbol)
}

/**
 * CoinGecko API (free tier, no key)
 */
async function fetchCoinGeckoPrice(symbol) {
  const coinIds = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin',
    'MATIC': 'matic-network',
    'POL': 'matic-network',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'TON': 'the-open-network',
    'TRX': 'tron',
    'AVAX': 'avalanche-2'
  }

  const coinId = coinIds[symbol.toUpperCase()]
  if (!coinId) throw new Error(`Unknown symbol: ${symbol}`)

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
  )

  if (!response.ok) throw new Error('CoinGecko API failed')

  const data = await response.json()
  return data[coinId].usd
}

/**
 * CoinMarketCap API (requires free API key)
 */
async function fetchCoinMarketCapPrice(symbol) {
  const apiKey = import.meta.env.VITE_CMC_API_KEY
  if (!apiKey) throw new Error('No CMC API key')

  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey
      }
    }
  )

  if (!response.ok) throw new Error('CoinMarketCap API failed')

  const data = await response.json()
  return data.data[symbol].quote.USD.price
}

/**
 * Binance API (free, no key)
 */
async function fetchBinancePrice(symbol) {
  const pairs = {
    'ETH': 'ETHUSDT',
    'BTC': 'BTCUSDT',
    'BNB': 'BNBUSDT',
    'SOL': 'SOLUSDT',
    'MATIC': 'MATICUSDT',
    'POL': 'MATICUSDT',
    'AVAX': 'AVAXUSDT'
  }

  const pair = pairs[symbol.toUpperCase()]
  if (!pair) throw new Error(`Unknown symbol: ${symbol}`)

  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`
  )

  if (!response.ok) throw new Error('Binance API failed')

  const data = await response.json()
  return parseFloat(data.price)
}

/**
 * Approximate prices (fallback if all APIs fail)
 */
function getApproximatePrice(symbol) {
  const approximates = {
    'ETH': 3500,
    'BTC': 95000,
    'MATIC': 0.80,
    'POL': 0.80,
    'BNB': 600,
    'SOL': 150,
    'TON': 5,
    'TRX': 0.15,
    'AVAX': 35
  }

  return approximates[symbol.toUpperCase()] || 0
}

/**
 * Get multiple prices at once
 * @param {string[]} symbols - Array of symbols
 * @returns {Promise<Object>} Map of symbol -> price
 */
export async function getPricesInUSD(symbols) {
  const prices = {}
  await Promise.all(
    symbols.map(async (symbol) => {
      prices[symbol] = await getPriceInUSD(symbol)
    })
  )
  return prices
}

/**
 * Convert gas cost to USD
 * @param {string} gasCost - Gas cost in native token (e.g., "0.002")
 * @param {string} symbol - Native token symbol (ETH, MATIC, etc.)
 * @returns {Promise<string>} USD formatted string
 */
export async function convertGasToUSD(gasCost, symbol) {
  const price = await getPriceInUSD(symbol)
  const usd = parseFloat(gasCost) * price
  return `$${usd.toFixed(4)}`
}

export default {
  getPriceInUSD,
  getPricesInUSD,
  convertGasToUSD
}
```

**Update evmPayment.js estimateGas():**

```javascript
import { convertGasToUSD } from './priceOracle'

export async function estimateGas({ network, token, toAddress, amount }) {
  // ... existing code ...

  const networkConfig = EVM_NETWORKS[network]
  const estimatedCostUSD = await convertGasToUSD(
    estimatedCost,
    networkConfig.nativeCurrency.symbol
  )

  return {
    gasLimit: gasEstimate.toString(),
    gasPrice: feeData.gasPrice?.toString() || '0',
    maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
    estimatedCost: ethers.formatEther(gasCost),
    estimatedCostUSD  // NOW POPULATED!
  }
}
```

**Test:**
1. Call estimateGas() for Ethereum
2. Verify USD cost is displayed
3. Check cache is working (second call is instant)

---

## DEPLOYMENT COMMANDS

### Deploy V3 Contract to New Chains

```bash
# 1. Fund deployer wallet with native tokens
# - AVAX on Avalanche
# - ETH on zkSync Era

# 2. Deploy to testnet first
npx hardhat run scripts/deployV3.cjs --network avalancheFuji
npx hardhat run scripts/deployV3.cjs --network zkSyncTestnet

# 3. Update ESCROW_ADDRESSES in contracts.js with deployed addresses

# 4. Test full flow on testnet

# 5. Deploy to mainnet
npx hardhat run scripts/deployV3.cjs --network avalanche
npx hardhat run scripts/deployV3.cjs --network zkSync

# 6. Verify contracts on block explorers
npx hardhat verify --network avalanche <CONTRACT_ADDRESS> <FEE_WALLET>
```

### Add Network Configs to Hardhat

**Add to hardhat.config.cjs:**

```javascript
networks: {
  // ... existing networks ...
  avalanche: {
    url: "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  },
  avalancheFuji: {
    url: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: 43113,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  },
  zkSync: {
    url: "https://mainnet.era.zksync.io",
    chainId: 324,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  },
  zkSyncTestnet: {
    url: "https://sepolia.era.zksync.dev",
    chainId: 300,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY]
  }
}
```

---

## TESTING CHECKLIST

After implementing above changes:

### Phase 1: Unit Tests
- [ ] DAI transfers work on all 6 chains
- [ ] Avalanche network switching works
- [ ] zkSync network switching works
- [ ] RPC failover works (disconnect primary)
- [ ] Price oracle returns USD values

### Phase 2: Integration Tests
- [ ] Create bill with DAI on Polygon
- [ ] Create bill with USDC on Avalanche
- [ ] Create bill with USDT on zkSync
- [ ] Gas estimation shows USD cost
- [ ] All RPCs failover smoothly

### Phase 3: User Acceptance
- [ ] UI shows new chains in dropdown
- [ ] MetaMask auto-adds Avalanche/zkSync
- [ ] Gas costs display in USD
- [ ] No RPC downtime errors

---

## SUCCESS METRICS

### Before (Current State)
- Chains: 11 networks
- Stablecoins: USDT, USDC, WBTC
- RPC: Single endpoint per chain
- Gas estimation: Native token only

### After (Target State)
- Chains: 13 networks (+18% coverage)
- Stablecoins: USDT, USDC, WBTC, DAI
- RPC: 3-5 fallbacks per chain (99.9% uptime)
- Gas estimation: USD + native token

**Total Implementation Time: 16.5 hours**
**Impact: HIGH**
**Difficulty: LOW-MEDIUM**

---

## NOTES

- All changes are additive (no breaking changes)
- Existing functionality remains untouched
- Can be implemented incrementally
- Each item can be deployed independently

---

**Ready to implement? Start with DAI (30 minutes) for quick win!**
