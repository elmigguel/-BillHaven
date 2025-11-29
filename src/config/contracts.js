/**
 * BillHaven Escrow Contract Configuration
 *
 * After deploying the contract, update ESCROW_ADDRESS with the deployed address
 */

// Contract addresses per network
export const ESCROW_ADDRESSES = {
  // Polygon Mainnet (update after deployment)
  137: "",

  // Polygon Amoy Testnet - DEPLOYED 2025-11-28
  80002: "0x8beED27aA6d28FE42a9e792d81046DD1337a8240",

  // Local hardhat (for testing)
  31337: ""
};

// Get contract address for current network
export const getEscrowAddress = (chainId) => {
  return ESCROW_ADDRESSES[chainId] || "";
};

// Default to Polygon Mainnet (will be empty until deployed)
export const ESCROW_ADDRESS = ESCROW_ADDRESSES[137] || ESCROW_ADDRESSES[80002] || "";

// Contract ABI - extracted from compiled contract
export const ESCROW_ABI = [
  // Constructor
  "constructor(address _feeWallet)",

  // Events
  "event BillCreated(uint256 indexed billId, address indexed billMaker, uint256 amount, uint256 fee)",
  "event BillClaimed(uint256 indexed billId, address indexed payer)",
  "event FiatConfirmed(uint256 indexed billId)",
  "event CryptoReleased(uint256 indexed billId, address indexed payer, uint256 amount)",
  "event Disputed(uint256 indexed billId, address indexed by)",
  "event DisputeResolved(uint256 indexed billId, bool releasedToPayer)",
  "event Refunded(uint256 indexed billId, address indexed billMaker)",
  "event FeeWalletUpdated(address indexed oldWallet, address indexed newWallet)",

  // Read functions
  "function billCounter() view returns (uint256)",
  "function feeWallet() view returns (address)",
  "function bills(uint256) view returns (address billMaker, address payer, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt)",
  "function getBill(uint256 _billId) view returns (tuple(address billMaker, address payer, uint256 amount, uint256 platformFee, bool fiatConfirmed, bool disputed, uint256 createdAt, uint256 expiresAt))",
  "function isLocked(uint256 _billId) view returns (bool)",
  "function getBillStatus(uint256 _billId) view returns (bool exists, bool claimed, bool confirmed, bool disputed, bool expired)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",

  // Write functions
  "function createBill(uint256 _platformFee) payable",
  "function claimBill(uint256 _billId)",
  "function confirmFiatPayment(uint256 _billId)",
  "function raiseDispute(uint256 _billId)",
  "function resolveDispute(uint256 _billId, bool _releaseToPayer)",
  "function refundExpiredBill(uint256 _billId)",
  "function cancelBill(uint256 _billId)",

  // Admin functions
  "function setFeeWallet(address _newFeeWallet)",
  "function pause()",
  "function unpause()",
  "function emergencyWithdraw()"
];

// Polygon network config
export const POLYGON_MAINNET = {
  chainId: 137,
  name: "Polygon Mainnet",
  rpcUrl: "https://polygon-rpc.com",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  blockExplorer: "https://polygonscan.com"
};

export const POLYGON_AMOY = {
  chainId: 80002,
  name: "Polygon Amoy Testnet",
  rpcUrl: "https://rpc-amoy.polygon.technology",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  blockExplorer: "https://amoy.polygonscan.com"
};
