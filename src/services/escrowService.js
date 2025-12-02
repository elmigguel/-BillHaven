/**
 * BillHaven Escrow Service
 *
 * Frontend service for interacting with the BillHavenEscrow smart contract
 */

import { ethers } from 'ethers';
import {
  ESCROW_ABI,
  ESCROW_ABI_V2,
  getEscrowAddress,
  getStablecoins,
  POLYGON_MAINNET,
  POLYGON_AMOY
} from '../config/contracts';

// ERC20 ABI for token approval
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Cache for token decimals to avoid repeated contract calls
const decimalsCache = new Map();

export const escrowService = {
  /**
   * Get V2 contract instance with signer (for write operations)
   * Uses V2 ABI with ERC20 support
   */
  getContract(signer, useV2 = true) {
    const chainId = signer.provider?.network?.chainId;
    const address = getEscrowAddress(chainId);

    if (!address) {
      throw new Error(`Escrow contract not deployed on chain ${chainId}`);
    }

    const abi = useV2 ? ESCROW_ABI_V2 : ESCROW_ABI;
    return new ethers.Contract(address, abi, signer);
  },

  /**
   * Get V2 contract instance with provider (for read operations)
   */
  getReadOnlyContract(provider, chainId, useV2 = true) {
    const address = getEscrowAddress(chainId);

    if (!address) {
      throw new Error(`Escrow contract not deployed on chain ${chainId}`);
    }

    const abi = useV2 ? ESCROW_ABI_V2 : ESCROW_ABI;
    return new ethers.Contract(address, abi, provider);
  },

  /**
   * Get ERC20 token contract
   */
  getTokenContract(tokenAddress, signerOrProvider) {
    return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
  },

  /**
   * Bill Maker: Create bill and lock crypto in escrow
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {string} amount - Total amount to lock (in MATIC)
   * @param {string} platformFee - Platform fee amount (in MATIC)
   * @returns {Promise<{billId: number, txHash: string}>}
   */
  async createBill(signer, amount, platformFee) {
    const contract = this.getContract(signer);

    const totalAmount = ethers.parseEther(amount.toString());
    const feeAmount = ethers.parseEther(platformFee.toString());

    const tx = await contract.createBill(feeAmount, { value: totalAmount });
    const receipt = await tx.wait();

    // Find BillCreated event to get billId
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
        txHash: receipt.hash
      };
    }

    // Event not found - this shouldn't happen in normal operation
    // Still return txHash so user can track the transaction
    console.error('BillCreated event not found in receipt. This may indicate a contract issue.');
    throw new Error('Bill created on blockchain but could not retrieve bill ID. Transaction: ' + receipt.hash);
  },

  // ============ V2 ERC20 TOKEN FUNCTIONS ============

  /**
   * Bill Maker: Create bill with ERC20 token (V2)
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {string} tokenAddress - ERC20 token contract address
   * @param {string} amount - Amount in token units (will be converted with decimals)
   * @param {string} platformFee - Platform fee in token units
   * @returns {Promise<{billId: number, txHash: string, approvalTxHash: string}>}
   */
  async createBillWithToken(signer, tokenAddress, amount, platformFee) {
    const contract = this.getContract(signer, true);
    const tokenContract = this.getTokenContract(tokenAddress, signer);
    const escrowAddress = await contract.getAddress();

    // Get token decimals
    const decimals = await tokenContract.decimals();
    const totalAmount = ethers.parseUnits(amount.toString(), decimals);
    const feeAmount = ethers.parseUnits(platformFee.toString(), decimals);

    // Check current allowance
    const signerAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(signerAddress, escrowAddress);

    let approvalTxHash = null;

    // Approve if needed - FIX: Add proper error handling for approval
    if (currentAllowance < totalAmount) {
      try {
        const approveTx = await tokenContract.approve(escrowAddress, totalAmount);
        const approvalReceipt = await approveTx.wait();
        approvalTxHash = approvalReceipt.hash;
      } catch (approvalError) {
        // Handle user rejection specifically
        if (approvalError.code === 'ACTION_REJECTED' || approvalError.code === 4001) {
          throw new Error('Token approval rejected. Bill creation cancelled.');
        }
        // Handle other approval errors
        throw new Error(`Token approval failed: ${approvalError.message || 'Unknown error'}`);
      }
    }

    // Create bill with token
    const tx = await contract.createBillWithToken(tokenAddress, totalAmount, feeAmount);
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
        tokenAddress
      };
    }

    throw new Error('Bill created but could not retrieve bill ID. Transaction: ' + receipt.hash);
  },

  /**
   * Check if token is supported by contract
   */
  async isTokenSupported(provider, chainId, tokenAddress) {
    const contract = this.getReadOnlyContract(provider, chainId, true);
    return await contract.isTokenSupported(tokenAddress);
  },

  /**
   * Get token balance for user
   */
  async getTokenBalance(provider, tokenAddress, userAddress) {
    const tokenContract = this.getTokenContract(tokenAddress, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    const decimals = await tokenContract.decimals();
    return ethers.formatUnits(balance, decimals);
  },

  /**
   * Get token info (symbol, decimals)
   */
  async getTokenInfo(provider, tokenAddress) {
    const tokenContract = this.getTokenContract(tokenAddress, provider);
    const [symbol, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals()
    ]);
    return { symbol, decimals: Number(decimals), address: tokenAddress };
  },

  /**
   * Get supported stablecoins for current network
   */
  getSupportedTokens(chainId) {
    return getStablecoins(chainId) || {};
  },

  /**
   * Payer: Claim a bill
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {number} billId - The bill ID to claim
   */
  async claimBill(signer, billId) {
    const contract = this.getContract(signer);
    const tx = await contract.claimBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Bill Maker: Confirm fiat received, release crypto to payer
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {number} billId - The bill ID to confirm
   */
  async confirmFiatPayment(signer, billId) {
    const contract = this.getContract(signer);
    const tx = await contract.confirmFiatPayment(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Raise a dispute
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {number} billId - The bill ID to dispute
   */
  async raiseDispute(signer, billId) {
    const contract = this.getContract(signer);
    const tx = await contract.raiseDispute(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Admin: Resolve dispute
   * @param {ethers.Signer} signer - Admin wallet signer
   * @param {number} billId - The bill ID
   * @param {boolean} releaseToPayer - True to release to payer, false to refund bill maker
   */
  async resolveDispute(signer, billId, releaseToPayer) {
    const contract = this.getContract(signer);
    const tx = await contract.resolveDispute(billId, releaseToPayer);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Bill Maker: Cancel unclaimed bill
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {number} billId - The bill ID to cancel
   */
  async cancelBill(signer, billId) {
    const contract = this.getContract(signer);
    const tx = await contract.cancelBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  /**
   * Refund expired bill (anyone can call)
   * @param {ethers.Signer} signer - Connected wallet signer
   * @param {number} billId - The bill ID to refund
   */
  async refundExpiredBill(signer, billId) {
    const contract = this.getContract(signer);
    const tx = await contract.refundExpiredBill(billId);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  },

  // ============ Read Functions ============

  /**
   * Get bill details from contract (V2 - includes token address)
   * @param {ethers.Provider} provider - Provider instance
   * @param {number} chainId - Network chain ID
   * @param {number} billId - The bill ID
   */
  async getBill(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId, true);
    const bill = await contract.getBill(billId);

    // V2 includes token address, V1 does not
    const isNativeToken = bill.token === ethers.ZeroAddress || !bill.token;

    // Get actual token decimals (native = 18, ERC20 = fetch from contract)
    let decimals = 18; // Default for native tokens
    if (!isNativeToken) {
      decimals = await this.getTokenDecimals(provider, bill.token);
    }

    return {
      billMaker: bill.billMaker,
      payer: bill.payer,
      token: bill.token || ethers.ZeroAddress,
      isNativeToken,
      amount: ethers.formatUnits(bill.amount, decimals),
      platformFee: ethers.formatUnits(bill.platformFee, decimals),
      fiatConfirmed: bill.fiatConfirmed,
      disputed: bill.disputed,
      createdAt: Number(bill.createdAt),
      expiresAt: Number(bill.expiresAt)
    };
  },

  /**
   * Check if bill has locked funds
   * @param {ethers.Provider} provider - Provider instance
   * @param {number} chainId - Network chain ID
   * @param {number} billId - The bill ID
   */
  async isLocked(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return await contract.isLocked(billId);
  },

  /**
   * Get bill status
   * @param {ethers.Provider} provider - Provider instance
   * @param {number} chainId - Network chain ID
   * @param {number} billId - The bill ID
   */
  async getBillStatus(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const status = await contract.getBillStatus(billId);

    return {
      exists: status.exists,
      claimed: status.claimed,
      confirmed: status.confirmed,
      disputed: status.disputed,
      expired: status.expired
    };
  },

  /**
   * Get current bill counter (total bills created)
   */
  async getBillCounter(provider, chainId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return Number(await contract.billCounter());
  },

  /**
   * Get fee wallet address
   */
  async getFeeWallet(provider, chainId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return await contract.feeWallet();
  },

  /**
   * Check if contract is paused
   */
  async isPaused(provider, chainId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    return await contract.paused();
  },

  // ============ Helper Functions ============

  /**
   * Get token decimals from contract (with caching)
   * @param {ethers.Provider} provider - Provider instance
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<number>} Token decimals
   */
  async getTokenDecimals(provider, tokenAddress) {
    // Check cache first
    const cacheKey = `${tokenAddress.toLowerCase()}`;
    if (decimalsCache.has(cacheKey)) {
      return decimalsCache.get(cacheKey);
    }

    // Fetch from contract
    const tokenContract = this.getTokenContract(tokenAddress, provider);
    const decimals = await tokenContract.decimals();
    const decimalsNum = Number(decimals);

    // Cache it
    decimalsCache.set(cacheKey, decimalsNum);
    return decimalsNum;
  },

  /**
   * Calculate platform fee based on amount
   * Uses tiered fee structure with optional affiliate discount
   *
   * Tier Structure (USD equivalent):
   * - Under $10,000:      4.4% (2.2% with affiliate)
   * - $10,000 - $20,000:  3.5%
   * - $20,000 - $50,000:  2.8%
   * - $50,000 - $500,000: 1.7%
   * - $500,000 - $1M:     1.2%
   * - Over $1,000,000:    0.8%
   *
   * Affiliate Discount: 50% off ONLY on <$10K tier
   */
  calculateFee(amount, hasAffiliateDiscount = false) {
    const numAmount = parseFloat(amount) || 0;
    let feePercentage;

    if (numAmount >= 1000000) {
      feePercentage = 0.008; // 0.8% - Whale tier
    } else if (numAmount >= 500000) {
      feePercentage = 0.012; // 1.2% - Enterprise tier
    } else if (numAmount >= 50000) {
      feePercentage = 0.017; // 1.7% - Business tier
    } else if (numAmount >= 20000) {
      feePercentage = 0.028; // 2.8% - Professional tier
    } else if (numAmount >= 10000) {
      feePercentage = 0.035; // 3.5% - Growth tier
    } else {
      // Standard tier with optional affiliate discount
      feePercentage = hasAffiliateDiscount ? 0.022 : 0.044; // 2.2% or 4.4%
    }

    const feeAmount = numAmount * feePercentage;
    const payoutAmount = numAmount - feeAmount;

    return {
      feePercentage: feePercentage * 100,
      feeAmount: feeAmount.toFixed(6),
      payoutAmount: payoutAmount.toFixed(6),
      totalToLock: numAmount.toFixed(6),
      isDiscounted: hasAffiliateDiscount && numAmount < 10000
    };
  },

  /**
   * Switch wallet to Polygon network
   */
  async switchToPolygon(ethereum, useTestnet = false) {
    const network = useTestnet ? POLYGON_AMOY : POLYGON_MAINNET;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }]
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${network.chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer]
          }]
        });
      } else {
        throw switchError;
      }
    }
  },

  /**
   * Get transaction URL on block explorer
   */
  getTxUrl(txHash, chainId) {
    if (chainId === 137) {
      return `https://polygonscan.com/tx/${txHash}`;
    } else if (chainId === 80002) {
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    }
    return `https://polygonscan.com/tx/${txHash}`;
  }
};
