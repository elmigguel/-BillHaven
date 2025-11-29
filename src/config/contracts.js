/**
 * BillHaven Escrow V2 Contract Configuration
 * Multi-chain support with native tokens AND ERC20 stablecoins
 */

// Contract addresses per network (V2 with ERC20 support)
// Update these after deploying to each network
export const ESCROW_ADDRESSES = {
  // ============ MAINNETS ============
  // Polygon Mainnet - PRIORITY (lowest fees)
  137: "",

  // Ethereum Mainnet - Premium (high fees)
  1: "",

  // BSC Mainnet - Fast & cheap
  56: "",

  // Arbitrum One - L2 (very low fees)
  42161: "",

  // Optimism Mainnet - L2 (very low fees)
  10: "",

  // Base Mainnet - Coinbase L2 (very low fees)
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

// Stablecoin addresses per network
export const STABLECOINS = {
  // Polygon Mainnet
  137: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  // Ethereum Mainnet
  1: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  // BSC Mainnet
  56: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
  },
  // Arbitrum One
  42161: {
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  },
  // Optimism
  10: {
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
  },
  // Base (no USDT)
  8453: {
    USDT: null,
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  }
};

// Get stablecoin addresses for a network
export const getStablecoins = (chainId) => {
  return STABLECOINS[chainId] || null;
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
