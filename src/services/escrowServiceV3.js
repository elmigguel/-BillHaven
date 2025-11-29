/**
 * BillHaven Escrow Service V3
 *
 * Frontend service for interacting with BillHavenEscrowV3 smart contract
 *
 * NEW FEATURES:
 * - Multi-confirmation pattern (Payer + Oracle/Maker)
 * - Hold period enforcement (24h iDEAL, 3d SEPA, 5d ACH)
 * - Payment method risk classification
 * - Velocity limits for fraud prevention
 * - Oracle signature verification
 */

import { ethers } from 'ethers';
import { getStablecoins } from '../config/contracts';

// V3 Contract ABI (core functions)
export const ESCROW_ABI_V3 = [
  // Core Functions
  "function createBill(uint256 _fiatAmount, uint8 _paymentMethod) payable returns (uint256)",
  "function createBillWithToken(address _token, uint256 _amount, uint256 _fiatAmount, uint8 _paymentMethod) returns (uint256)",
  "function claimBill(uint256 _billId)",
  "function confirmPaymentSent(uint256 _billId, bytes32 _paymentReference)",
  "function verifyPaymentReceived(uint256 _billId, bytes32 _paymentReference, uint256 _fiatAmount, uint256 _timestamp, bytes calldata _signature)",
  "function makerConfirmPayment(uint256 _billId)",
  "function makerConfirmAndRelease(uint256 _billId)",
  "function releaseFunds(uint256 _billId)",
  "function autoRelease(uint256 _billId)",
  "function raiseDispute(uint256 _billId)",
  "function resolveDispute(uint256 _billId, bool _releaseToPayer)",
  "function cancelBill(uint256 _billId)",
  "function refundExpiredBill(uint256 _billId)",

  // View Functions
  "function getBill(uint256 _billId) view returns (tuple(address billMaker, address payer, address token, uint256 amount, uint256 platformFee, uint256 fiatAmount, uint8 status, uint8 paymentMethod, bool payerConfirmed, bool oracleVerified, bool makerConfirmed, uint256 createdAt, uint256 fundedAt, uint256 paymentSentAt, uint256 verifiedAt, uint256 releaseTime, uint256 expiresAt, bytes32 paymentReference))",
  "function getUserStats(address _user) view returns (tuple(uint256 totalTrades, uint256 successfulTrades, uint256 disputedTrades, uint256 dailyVolume, uint256 weeklyVolume, uint256 lastTradeDate, uint256 lastWeekStart, uint8 trustLevel, bool isBlacklisted))",
  "function getUserLimits(address _user) view returns (tuple(uint256 maxDailyVolume, uint256 maxWeeklyVolume, uint256 maxTradeSize, uint256 maxDailyTrades))",
  "function canRelease(uint256 _billId) view returns (bool, string)",
  "function getHoldPeriod(uint8 _method) view returns (uint256)",
  "function isMethodBlocked(uint8 _method) view returns (bool)",
  "function supportedTokens(address) view returns (bool)",
  "function billCounter() view returns (uint256)",
  "function feeWallet() view returns (address)",
  "function platformFeePercent() view returns (uint256)",
  "function paused() view returns (bool)",

  // Events
  "event BillCreated(uint256 indexed billId, address indexed billMaker, address indexed token, uint256 amount, uint256 fee, uint8 paymentMethod)",
  "event BillFunded(uint256 indexed billId, uint256 totalAmount)",
  "event BillClaimed(uint256 indexed billId, address indexed payer)",
  "event PaymentMarkedSent(uint256 indexed billId, bytes32 paymentReference)",
  "event PaymentVerified(uint256 indexed billId, address verifiedBy, bool isOracle)",
  "event HoldPeriodComplete(uint256 indexed billId, uint256 releaseTime)",
  "event CryptoReleased(uint256 indexed billId, address indexed payer, uint256 amount, uint256 fee)",
  "event BillDisputed(uint256 indexed billId, address indexed by)",
  "event DisputeResolved(uint256 indexed billId, bool releasedToPayer, address resolver)",
  "event BillRefunded(uint256 indexed billId, address indexed billMaker, uint256 amount)",
  "event BillCancelled(uint256 indexed billId, address indexed billMaker)",
  "event UserUpgraded(address indexed user, uint8 newLevel)"
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Payment Methods Enum
export const PaymentMethod = {
  CRYPTO: 0,
  CASH_DEPOSIT: 1,
  WIRE_TRANSFER: 2,
  IDEAL: 3,
  SEPA: 4,
  BANK_TRANSFER: 5,
  PAYPAL_FRIENDS: 6,
  PAYPAL_GOODS: 7,  // BLOCKED
  CREDIT_CARD: 8,   // BLOCKED
  OTHER: 9
};

// Payment Method Labels
export const PaymentMethodLabels = {
  [PaymentMethod.CRYPTO]: { name: 'Crypto', holdPeriod: 'Instant', risk: 'none' },
  [PaymentMethod.CASH_DEPOSIT]: { name: 'Cash Deposit', holdPeriod: '1 hour', risk: 'low' },
  [PaymentMethod.WIRE_TRANSFER]: { name: 'Wire Transfer', holdPeriod: '2 days', risk: 'low' },
  [PaymentMethod.IDEAL]: { name: 'iDEAL', holdPeriod: '24 hours', risk: 'medium' },
  [PaymentMethod.SEPA]: { name: 'SEPA Transfer', holdPeriod: '3 days', risk: 'medium' },
  [PaymentMethod.BANK_TRANSFER]: { name: 'Bank Transfer (ACH)', holdPeriod: '5 days', risk: 'high' },
  [PaymentMethod.PAYPAL_FRIENDS]: { name: 'PayPal Friends & Family', holdPeriod: '3 days', risk: 'medium' },
  [PaymentMethod.PAYPAL_GOODS]: { name: 'PayPal Goods & Services', holdPeriod: 'BLOCKED', risk: 'blocked' },
  [PaymentMethod.CREDIT_CARD]: { name: 'Credit Card', holdPeriod: 'BLOCKED', risk: 'blocked' },
  [PaymentMethod.OTHER]: { name: 'Other', holdPeriod: '7 days', risk: 'high' }
};

// Confirmation Status Enum
export const ConfirmationStatus = {
  CREATED: 0,
  FUNDED: 1,
  CLAIMED: 2,
  PAYMENT_SENT: 3,
  PAYMENT_VERIFIED: 4,
  HOLD_COMPLETE: 5,
  RELEASED: 6,
  DISPUTED: 7,
  REFUNDED: 8,
  CANCELLED: 9
};

// Status Labels
export const StatusLabels = {
  [ConfirmationStatus.CREATED]: 'Created',
  [ConfirmationStatus.FUNDED]: 'Funded',
  [ConfirmationStatus.CLAIMED]: 'Claimed',
  [ConfirmationStatus.PAYMENT_SENT]: 'Payment Sent',
  [ConfirmationStatus.PAYMENT_VERIFIED]: 'Payment Verified',
  [ConfirmationStatus.HOLD_COMPLETE]: 'Ready to Release',
  [ConfirmationStatus.RELEASED]: 'Released',
  [ConfirmationStatus.DISPUTED]: 'Disputed',
  [ConfirmationStatus.REFUNDED]: 'Refunded',
  [ConfirmationStatus.CANCELLED]: 'Cancelled'
};

// Trust Levels
export const TrustLevel = {
  NEW_USER: 0,
  TRUSTED: 1,
  VERIFIED: 2,
  ELITE: 3
};

export const TrustLevelLabels = {
  [TrustLevel.NEW_USER]: { name: 'New User', trades: '0-5', color: 'gray' },
  [TrustLevel.TRUSTED]: { name: 'Trusted', trades: '6-20', color: 'blue' },
  [TrustLevel.VERIFIED]: { name: 'Verified', trades: '21-50', color: 'green' },
  [TrustLevel.ELITE]: { name: 'Elite', trades: '50+', color: 'gold' }
};

// V3 Contract Addresses
export const ESCROW_V3_ADDRESSES = {
  // Mainnets
  137: '',    // Polygon Mainnet - PENDING
  1: '',      // Ethereum - PENDING
  56: '',     // BSC - PENDING
  42161: '',  // Arbitrum - PENDING
  10: '',     // Optimism - PENDING
  8453: '',   // Base - PENDING

  // Testnets
  80002: '',  // Polygon Amoy - PENDING (deploy with deployV3.cjs)
  11155111: '', // Sepolia - PENDING
};

// Cache for token decimals
const decimalsCache = new Map();

export const escrowServiceV3 = {
  /**
   * Get V3 escrow address for chain
   */
  getV3Address(chainId) {
    return ESCROW_V3_ADDRESSES[chainId] || null;
  },

  /**
   * Check if V3 is deployed on chain
   */
  isV3Deployed(chainId) {
    return !!ESCROW_V3_ADDRESSES[chainId];
  },

  /**
   * Get V3 contract instance with signer (for write operations)
   */
  getContract(signer, chainId) {
    const address = this.getV3Address(chainId);
    if (!address) {
      throw new Error(`Escrow V3 not deployed on chain ${chainId}`);
    }
    return new ethers.Contract(address, ESCROW_ABI_V3, signer);
  },

  /**
   * Get V3 contract instance with provider (for read operations)
   */
  getReadOnlyContract(provider, chainId) {
    const address = this.getV3Address(chainId);
    if (!address) {
      throw new Error(`Escrow V3 not deployed on chain ${chainId}`);
    }
    return new ethers.Contract(address, ESCROW_ABI_V3, provider);
  },

  /**
   * Get ERC20 token contract
   */
  getTokenContract(tokenAddress, signerOrProvider) {
    return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
  },

  // ============ BILL CREATION ============

  /**
   * Create bill with NATIVE token (ETH, MATIC, etc.)
   * @param {ethers.Signer} signer - Connected wallet
   * @param {string} amount - Amount in native token
   * @param {number} fiatAmount - Fiat amount in cents (for matching)
   * @param {number} paymentMethod - PaymentMethod enum value
   */
  async createBill(signer, amount, fiatAmount, paymentMethod) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    // Check if payment method is blocked
    const isBlocked = await contract.isMethodBlocked(paymentMethod);
    if (isBlocked) {
      throw new Error(`Payment method ${PaymentMethodLabels[paymentMethod]?.name || paymentMethod} is blocked for security reasons.`);
    }

    const totalAmount = ethers.parseEther(amount.toString());

    const tx = await contract.createBill(fiatAmount, paymentMethod, { value: totalAmount });
    const receipt = await tx.wait();

    // Find BillCreated event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'BillCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      return {
        billId: Number(parsed.args.billId),
        txHash: receipt.hash,
        paymentMethod,
        holdPeriod: PaymentMethodLabels[paymentMethod]?.holdPeriod
      };
    }

    throw new Error('Bill created but could not retrieve bill ID. Transaction: ' + receipt.hash);
  },

  /**
   * Create bill with ERC20 token (USDT, USDC, WBTC, etc.)
   */
  async createBillWithToken(signer, tokenAddress, amount, fiatAmount, paymentMethod) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    // Check if payment method is blocked
    const isBlocked = await contract.isMethodBlocked(paymentMethod);
    if (isBlocked) {
      throw new Error(`Payment method ${PaymentMethodLabels[paymentMethod]?.name || paymentMethod} is blocked.`);
    }

    // Check if token is supported
    const isSupported = await contract.supportedTokens(tokenAddress);
    if (!isSupported) {
      throw new Error('Token not supported by escrow contract');
    }

    const tokenContract = this.getTokenContract(tokenAddress, signer);
    const escrowAddress = this.getV3Address(chainId);

    // Get token decimals
    const decimals = await tokenContract.decimals();
    const totalAmount = ethers.parseUnits(amount.toString(), decimals);

    // Check and approve if needed
    const signerAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(signerAddress, escrowAddress);

    let approvalTxHash = null;
    if (currentAllowance < totalAmount) {
      try {
        const approveTx = await tokenContract.approve(escrowAddress, totalAmount);
        const approvalReceipt = await approveTx.wait();
        approvalTxHash = approvalReceipt.hash;
      } catch (error) {
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          throw new Error('Token approval rejected. Bill creation cancelled.');
        }
        throw new Error(`Token approval failed: ${error.message}`);
      }
    }

    // Create bill
    const tx = await contract.createBillWithToken(tokenAddress, totalAmount, fiatAmount, paymentMethod);
    const receipt = await tx.wait();

    // Find BillCreated event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'BillCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      return {
        billId: Number(parsed.args.billId),
        txHash: receipt.hash,
        approvalTxHash,
        tokenAddress,
        paymentMethod,
        holdPeriod: PaymentMethodLabels[paymentMethod]?.holdPeriod
      };
    }

    throw new Error('Bill created but could not retrieve bill ID. Transaction: ' + receipt.hash);
  },

  // ============ PAYER ACTIONS ============

  /**
   * Payer claims a bill
   */
  async claimBill(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.claimBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Payer marks payment as sent
   * @param {string} paymentReference - Unique payment reference (will be hashed)
   */
  async confirmPaymentSent(signer, billId, paymentReference) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    // Hash the payment reference
    const paymentRefHash = ethers.keccak256(ethers.toUtf8Bytes(paymentReference));

    const tx = await contract.confirmPaymentSent(billId, paymentRefHash);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      paymentReference: paymentRefHash
    };
  },

  // ============ MAKER ACTIONS ============

  /**
   * Maker confirms payment received (starts hold period)
   */
  async makerConfirmPayment(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.makerConfirmPayment(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Maker confirms and releases immediately (skips hold period)
   */
  async makerConfirmAndRelease(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.makerConfirmAndRelease(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  // ============ RELEASE FUNCTIONS ============

  /**
   * Release funds after hold period
   */
  async releaseFunds(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.releaseFunds(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Auto-release after hold period (anyone can call)
   */
  async autoRelease(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.autoRelease(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  // ============ DISPUTE FUNCTIONS ============

  /**
   * Raise a dispute
   */
  async raiseDispute(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.raiseDispute(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Resolve dispute (admin only)
   */
  async resolveDispute(signer, billId, releaseToPayer) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.resolveDispute(billId, releaseToPayer);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  // ============ CANCEL / REFUND ============

  /**
   * Cancel unclaimed bill
   */
  async cancelBill(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.cancelBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Refund expired bill
   */
  async refundExpiredBill(signer, billId) {
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = this.getContract(signer, chainId);

    const tx = await contract.refundExpiredBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  // ============ VIEW FUNCTIONS ============

  /**
   * Get bill details
   */
  async getBill(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const bill = await contract.getBill(billId);

    const isNativeToken = bill.token === ethers.ZeroAddress;
    let decimals = 18;
    if (!isNativeToken) {
      decimals = await this.getTokenDecimals(provider, bill.token);
    }

    return {
      billMaker: bill.billMaker,
      payer: bill.payer,
      token: bill.token,
      isNativeToken,
      amount: ethers.formatUnits(bill.amount, decimals),
      platformFee: ethers.formatUnits(bill.platformFee, decimals),
      fiatAmount: Number(bill.fiatAmount) / 100, // Convert cents to dollars
      status: Number(bill.status),
      statusLabel: StatusLabels[Number(bill.status)] || 'Unknown',
      paymentMethod: Number(bill.paymentMethod),
      paymentMethodLabel: PaymentMethodLabels[Number(bill.paymentMethod)]?.name || 'Unknown',
      payerConfirmed: bill.payerConfirmed,
      oracleVerified: bill.oracleVerified,
      makerConfirmed: bill.makerConfirmed,
      createdAt: Number(bill.createdAt),
      fundedAt: Number(bill.fundedAt),
      paymentSentAt: Number(bill.paymentSentAt),
      verifiedAt: Number(bill.verifiedAt),
      releaseTime: Number(bill.releaseTime),
      expiresAt: Number(bill.expiresAt),
      paymentReference: bill.paymentReference
    };
  },

  /**
   * Get user stats
   */
  async getUserStats(provider, chainId, userAddress) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const stats = await contract.getUserStats(userAddress);

    return {
      totalTrades: Number(stats.totalTrades),
      successfulTrades: Number(stats.successfulTrades),
      disputedTrades: Number(stats.disputedTrades),
      dailyVolume: Number(stats.dailyVolume) / 100,
      weeklyVolume: Number(stats.weeklyVolume) / 100,
      lastTradeDate: Number(stats.lastTradeDate),
      lastWeekStart: Number(stats.lastWeekStart),
      trustLevel: Number(stats.trustLevel),
      trustLevelLabel: TrustLevelLabels[Number(stats.trustLevel)]?.name || 'Unknown',
      isBlacklisted: stats.isBlacklisted
    };
  },

  /**
   * Get user limits
   */
  async getUserLimits(provider, chainId, userAddress) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const limits = await contract.getUserLimits(userAddress);

    return {
      maxDailyVolume: Number(limits.maxDailyVolume) / 100,
      maxWeeklyVolume: Number(limits.maxWeeklyVolume) / 100,
      maxTradeSize: Number(limits.maxTradeSize) / 100,
      maxDailyTrades: Number(limits.maxDailyTrades)
    };
  },

  /**
   * Check if bill can be released
   */
  async canRelease(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const [canRel, reason] = await contract.canRelease(billId);
    return { canRelease: canRel, reason };
  },

  /**
   * Get hold period for payment method
   */
  async getHoldPeriod(provider, chainId, paymentMethod) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const period = await contract.getHoldPeriod(paymentMethod);
    return Number(period);
  },

  /**
   * Check if payment method is blocked
   */
  async isMethodBlocked(provider, chainId, paymentMethod) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return await contract.isMethodBlocked(paymentMethod);
  },

  /**
   * Get bill counter
   */
  async getBillCounter(provider, chainId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return Number(await contract.billCounter());
  },

  // ============ HELPER FUNCTIONS ============

  /**
   * Get token decimals (with caching)
   */
  async getTokenDecimals(provider, tokenAddress) {
    const cacheKey = tokenAddress.toLowerCase();
    if (decimalsCache.has(cacheKey)) {
      return decimalsCache.get(cacheKey);
    }

    const tokenContract = this.getTokenContract(tokenAddress, provider);
    const decimals = Number(await tokenContract.decimals());
    decimalsCache.set(cacheKey, decimals);
    return decimals;
  },

  /**
   * Calculate platform fee (tiered structure)
   */
  calculateFee(amount) {
    const numAmount = parseFloat(amount) || 0;
    let feePercentage;

    if (numAmount >= 1000000) {
      feePercentage = 0.008;
    } else if (numAmount >= 100000) {
      feePercentage = 0.017;
    } else if (numAmount >= 20000) {
      feePercentage = 0.026;
    } else if (numAmount >= 10000) {
      feePercentage = 0.035;
    } else {
      feePercentage = 0.044;
    }

    const feeAmount = numAmount * feePercentage;
    const payoutAmount = numAmount - feeAmount;

    return {
      feePercentage: feePercentage * 100,
      feeAmount: feeAmount.toFixed(6),
      payoutAmount: payoutAmount.toFixed(6),
      totalToLock: numAmount.toFixed(6)
    };
  },

  /**
   * Generate unique payment reference
   */
  generatePaymentReference(billId, timestamp = Date.now()) {
    return `BH-${billId}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format hold period for display
   */
  formatHoldPeriod(seconds) {
    if (seconds === 0) return 'Instant';
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  },

  /**
   * Calculate time remaining until release
   */
  getTimeUntilRelease(releaseTime) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = releaseTime - now;

    if (remaining <= 0) return { canRelease: true, remaining: 0, formatted: 'Ready' };

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
    formatted += `${seconds}s`;

    return { canRelease: false, remaining, formatted: formatted.trim() };
  },

  /**
   * Get transaction URL
   */
  getTxUrl(txHash, chainId) {
    const explorers = {
      137: 'https://polygonscan.com',
      80002: 'https://amoy.polygonscan.com',
      1: 'https://etherscan.io',
      56: 'https://bscscan.com',
      42161: 'https://arbiscan.io',
      10: 'https://optimistic.etherscan.io',
      8453: 'https://basescan.org'
    };

    const explorer = explorers[chainId] || 'https://polygonscan.com';
    return `${explorer}/tx/${txHash}`;
  },

  /**
   * Get supported payment methods (non-blocked)
   */
  getSupportedPaymentMethods() {
    return Object.entries(PaymentMethodLabels)
      .filter(([id, info]) => info.risk !== 'blocked')
      .map(([id, info]) => ({
        id: Number(id),
        ...info
      }));
  }
};

export default escrowServiceV3;
