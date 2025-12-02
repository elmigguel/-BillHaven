/**
 * BillHaven Escrow V2 Contract Configuration
 * Multi-chain support with native tokens AND ERC20 stablecoins
 */

// Contract addresses per network (V2 with ERC20 support)
// Update these after deploying to each network
export const ESCROW_ADDRESSES = {
  // ============ MAINNETS - UPDATE AFTER DEPLOYMENT ============
  // Deploy with: npx hardhat run scripts/deploy-v2.cjs --network <network-name>

  // Polygon Mainnet - V3 DEPLOYED (cheapest gas: $0.01-$0.10)
  137: "0x8beED27aA6d28FE42a9e792d81046DD1337a8240",

  // Ethereum Mainnet - Deploy last (highest gas: $5-$25)
  1: "",

  // BSC Mainnet - Fast & cheap (gas: $0.02-$0.15)
  56: "",

  // Arbitrum One - L2 rollup (very low gas: $0.01-$0.08)
  42161: "",

  // Optimism Mainnet - L2 rollup (very low gas: $0.01-$0.08)
  10: "",

  // Base Mainnet - Coinbase L2 (lowest gas: $0.01-$0.05)
  8453: "",

  // ============ TESTNETS ============
  // Polygon Amoy Testnet - V2 deployed (with ERC20 support)
  80002: "0x792B01c5965D94e2875DeFb48647fB3b4dd94e15",

  // Ethereum Sepolia
  11155111: "",

  // BSC Testnet
  97: "",

  // Arbitrum Sepolia
  421614: "",

  // Base Sepolia
  84532: "",

  // Local hardhat
  31337: ""
};

// Get contract address for current network
export const getEscrowAddress = (chainId) => {
  return ESCROW_ADDRESSES[chainId] || "";
};

// Supported token addresses per network (Stablecoins + WBTC)
// All addresses verified from official sources (Circle, Tether, WBTC, block explorers)
export const SUPPORTED_TOKENS = {
  // Polygon Mainnet
  137: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Tether USDT (6 decimals)
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Circle Native USDC (6 decimals, NOT USDC.e)
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"  // Wrapped Bitcoin (8 decimals)
  },
  // Ethereum Mainnet
  1: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Tether USDT (6 decimals)
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Circle USDC (6 decimals)
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"  // Wrapped Bitcoin (8 decimals)
  },
  // BSC Mainnet
  56: {
    USDT: "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg USDT (18 decimals)
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // Binance-Peg USDC (18 decimals)
    WBTC: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"  // BTCB - Binance wrapped (18 decimals)
  },
  // Arbitrum One
  42161: {
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Bridged USDT (6 decimals)
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Circle Native USDC (6 decimals, NOT USDC.e)
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"  // Wrapped Bitcoin (8 decimals)
  },
  // Optimism
  10: {
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // Bridged USDT (6 decimals)
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Circle Native USDC (6 decimals, NOT USDC.e)
    WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095"  // Wrapped Bitcoin (8 decimals)
  },
  // Base (no USDT on Base)
  8453: {
    USDT: null, // Not available on Base
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Circle Native USDC (6 decimals)
    WBTC: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"  // Wrapped Bitcoin (8 decimals)
  }
};

// Get supported token addresses for a network
export const getSupportedTokens = (chainId) => {
  return SUPPORTED_TOKENS[chainId] || null;
};

// Legacy alias for backwards compatibility
export const getStablecoins = getSupportedTokens;
export const STABLECOINS = SUPPORTED_TOKENS;

// Token decimals mapping (by token address - lowercase for case-insensitive lookup)
// CRITICAL: Different tokens use different decimals!
// - USDT/USDC: 6 decimals (most chains) or 18 decimals (BSC)
// - WBTC: 8 decimals (Bitcoin standard)
// - Native tokens (ETH, MATIC, BNB): 18 decimals
export const TOKEN_DECIMALS = {
  // Polygon (137)
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": 6,  // USDT
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": 6,  // USDC
  "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": 8,  // WBTC

  // Ethereum (1)
  "0xdac17f958d2ee523a2206206994597c13d831ec7": 6,  // USDT
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6,  // USDC
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 8,  // WBTC

  // BSC (56) - NOTE: BSC uses 18 decimals for USDT/USDC!
  "0x55d398326f99059ff775485246999027b3197955": 18, // USDT
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": 18, // USDC
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c": 18, // BTCB (NOT 8!)

  // Arbitrum (42161)
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": 6,  // USDT
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": 6,  // USDC
  "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": 8,  // WBTC

  // Optimism (10)
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": 6,  // USDT
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 6,  // USDC
  "0x68f180fcce6836688e9084f035309e29bf0a2095": 8,  // WBTC

  // Base (8453)
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6,  // USDC
  "0x0555e30da8f98308edb960aa94c0db47230d2b9c": 8   // WBTC
};

// Get token decimals by address (case-insensitive)
export const getTokenDecimals = (tokenAddress) => {
  if (!tokenAddress) return 18; // Default to 18 for native tokens
  const lowercaseAddress = tokenAddress.toLowerCase();
  return TOKEN_DECIMALS[lowercaseAddress] || 18; // Default to 18 if unknown
};

// Helper to check if a token is WBTC
export const isWBTC = (tokenAddress, chainId) => {
  if (!tokenAddress || !chainId) return false;
  const tokens = SUPPORTED_TOKENS[chainId];
  if (!tokens) return false;
  return tokenAddress.toLowerCase() === tokens.WBTC?.toLowerCase();
};

// Helper to check if a token is a stablecoin (USDT or USDC)
export const isStablecoin = (tokenAddress, chainId) => {
  if (!tokenAddress || !chainId) return false;
  const tokens = SUPPORTED_TOKENS[chainId];
  if (!tokens) return false;
  const addr = tokenAddress.toLowerCase();
  return addr === tokens.USDT?.toLowerCase() || addr === tokens.USDC?.toLowerCase();
};

// V2 Contract ABI with ERC20 support
export const ESCROW_ABI_V2 = [
  // Constructor
  "constructor(address _feeWallet)",

  // Events (V2 - includes token address)
  "event BillCreated(uint256 indexed billId, address indexed billMaker, address indexed token, uint256 amount, uint256 fee)",
  "event BillClaimed(uint256 indexed billId, address indexed payer)",
  "event FiatConfirmed(uint256 indexed billId)",
  "event CryptoReleased(uint256 indexed billId, address indexed payer, address indexed token, uint256 amount)",
  "event Disputed(uint256 indexed billId, address indexed by)",
  "event DisputeResolved(uint256 indexed billId, bool releasedToPayer)",
  "event Refunded(uint256 indexed billId, address indexed billMaker)",
  "event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet)",
  "event TokenAdded(address indexed token)",
  "event TokenRemoved(address indexed token)",

  // Read functions
  "function billCounter() view returns (uint256)",
  "function feeWallet() view returns (address)",
  "function supportedTokens(address) view returns (bool)",
  "function bills(uint256) view returns (address billMaker, address payer, address token, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt)",
  "function getBill(uint256 _billId) view returns (tuple(address billMaker, address payer, address token, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt))",
  "function isLocked(uint256 _billId) view returns (bool)",
  "function getBillStatus(uint256 _billId) view returns (bool exists, bool claimed, bool confirmed, bool disputed, bool expired)",
  "function isTokenSupported(address _token) view returns (bool)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",

  // Write functions - Native tokens
  "function createBill(uint256 _platformFee) payable",

  // Write functions - ERC20 tokens (V2)
  "function createBillWithToken(address _token, uint256 _amount, uint256 _platformFee)",

  // Bill operations
  "function claimBill(uint256 _billId)",
  "function confirmFiatPayment(uint256 _billId)",
  "function raiseDispute(uint256 _billId)",
  "function resolveDispute(uint256 _billId, bool _releaseToPayer)",
  "function refundExpiredBill(uint256 _billId)",
  "function cancelBill(uint256 _billId)",

  // Admin functions
  "function addSupportedToken(address _token)",
  "function removeSupportedToken(address _token)",
  "function setFeeWallet(address _newFeeWallet)",
  "function pause()",
  "function unpause()",
  "function emergencyWithdraw()",
  "function emergencyWithdrawToken(address _token)"
];

// V1 Contract ABI (backwards compatibility)
export const ESCROW_ABI = [
  "constructor(address _feeWallet)",
  "event BillCreated(uint256 indexed billId, address indexed billMaker, uint256 amount, uint256 fee)",
  "event BillClaimed(uint256 indexed billId, address indexed payer)",
  "event FiatConfirmed(uint256 indexed billId)",
  "event CryptoReleased(uint256 indexed billId, address indexed payer, uint256 amount)",
  "event Disputed(uint256 indexed billId, address indexed by)",
  "event DisputeResolved(uint256 indexed billId, bool releasedToPayer)",
  "event Refunded(uint256 indexed billId, address indexed billMaker)",
  "event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet)",
  "function billCounter() view returns (uint256)",
  "function feeWallet() view returns (address)",
  "function bills(uint256) view returns (address billMaker, address payer, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt)",
  "function getBill(uint256 _billId) view returns (tuple(address billMaker, address payer, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt))",
  "function isLocked(uint256 _billId) view returns (bool)",
  "function getBillStatus(uint256 _billId) view returns (bool exists, bool claimed, bool confirmed, bool disputed, bool expired)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  "function createBill(uint256 _platformFee) payable",
  "function claimBill(uint256 _billId)",
  "function confirmFiatPayment(uint256 _billId)",
  "function raiseDispute(uint256 _billId)",
  "function resolveDispute(uint256 _billId, bool _releaseToPayer)",
  "function refundExpiredBill(uint256 _billId)",
  "function cancelBill(uint256 _billId)",
  "function setFeeWallet(address _newFeeWallet)",
  "function pause()",
  "function unpause()",
  "function emergencyWithdraw()"
];

// All supported networks configuration
export const NETWORKS = {
  // ============ MAINNETS ============
  137: {
    chainId: 137,
    name: "Polygon",
    shortName: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorer: "https://polygonscan.com",
    isTestnet: false,
    gasEstimate: "$0.01-$0.10"
  },
  1: {
    chainId: 1,
    name: "Ethereum",
    shortName: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
    gasEstimate: "$5-$25"
  },
  56: {
    chainId: 56,
    name: "BNB Smart Chain",
    shortName: "BSC",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorer: "https://bscscan.com",
    isTestnet: false,
    gasEstimate: "$0.02-$0.15"
  },
  42161: {
    chainId: 42161,
    name: "Arbitrum One",
    shortName: "ARB",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://arbiscan.io",
    isTestnet: false,
    gasEstimate: "$0.01-$0.08"
  },
  10: {
    chainId: 10,
    name: "Optimism",
    shortName: "OP",
    rpcUrl: "https://mainnet.optimism.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://optimistic.etherscan.io",
    isTestnet: false,
    gasEstimate: "$0.01-$0.08"
  },
  8453: {
    chainId: 8453,
    name: "Base",
    shortName: "BASE",
    rpcUrl: "https://mainnet.base.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://basescan.org",
    isTestnet: false,
    gasEstimate: "$0.01-$0.05"
  },

  // ============ TESTNETS ============
  80002: {
    chainId: 80002,
    name: "Polygon Amoy",
    shortName: "AMOY",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorer: "https://amoy.polygonscan.com",
    isTestnet: true,
    gasEstimate: "FREE"
  },
  11155111: {
    chainId: 11155111,
    name: "Sepolia",
    shortName: "SEP",
    rpcUrl: "https://rpc.sepolia.org",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
    gasEstimate: "FREE"
  },
  97: {
    chainId: 97,
    name: "BSC Testnet",
    shortName: "tBNB",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    nativeCurrency: { name: "Test BNB", symbol: "tBNB", decimals: 18 },
    blockExplorer: "https://testnet.bscscan.com",
    isTestnet: true,
    gasEstimate: "FREE"
  },
  421614: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "tARB",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://sepolia.arbiscan.io",
    isTestnet: true,
    gasEstimate: "FREE"
  },
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "tBASE",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    blockExplorer: "https://sepolia.basescan.org",
    isTestnet: true,
    gasEstimate: "FREE"
  }
};

// Get network config
export const getNetwork = (chainId) => {
  return NETWORKS[chainId] || null;
};

// Get block explorer URL
export const getExplorerUrl = (chainId, type, hash) => {
  const network = NETWORKS[chainId];
  if (!network) return null;

  switch (type) {
    case 'tx':
      return `${network.blockExplorer}/tx/${hash}`;
    case 'address':
      return `${network.blockExplorer}/address/${hash}`;
    case 'token':
      return `${network.blockExplorer}/token/${hash}`;
    default:
      return network.blockExplorer;
  }
};

// Check if network is supported
export const isNetworkSupported = (chainId) => {
  return !!ESCROW_ADDRESSES[chainId];
};

// Get all mainnet chain IDs
export const MAINNET_CHAINS = [137, 1, 56, 42161, 10, 8453];

// Get all testnet chain IDs
export const TESTNET_CHAINS = [80002, 11155111, 97, 421614, 84532];

// Legacy exports for backwards compatibility
export const POLYGON_MAINNET = NETWORKS[137];
export const POLYGON_AMOY = NETWORKS[80002];
export const ESCROW_ADDRESS = ESCROW_ADDRESSES[137] || ESCROW_ADDRESSES[80002] || "";
