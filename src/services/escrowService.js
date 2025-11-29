/**
 * BillHaven Escrow Service
 *
 * Frontend service for interacting with the BillHavenEscrow smart contract
 */

import { ethers } from 'ethers';
import { ESCROW_ABI, getEscrowAddress, POLYGON_MAINNET, POLYGON_AMOY } from '../config/contracts';

export const escrowService = {
  /**
   * Get contract instance with signer (for write operations)
   */
  getContract(signer) {
    const chainId = signer.provider?.network?.chainId;
    const address = getEscrowAddress(chainId);

    if (!address) {
      throw new Error(`Escrow contract not deployed on chain ${chainId}`);
    }

    return new ethers.Contract(address, ESCROW_ABI, signer);
  },

  /**
   * Get contract instance with provider (for read operations)
   */
  getReadOnlyContract(provider, chainId) {
    const address = getEscrowAddress(chainId);

    if (!address) {
      throw new Error(`Escrow contract not deployed on chain ${chainId}`);
    }

    return new ethers.Contract(address, ESCROW_ABI, provider);
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
   * Get bill details from contract
   * @param {ethers.Provider} provider - Provider instance
   * @param {number} chainId - Network chain ID
   * @param {number} billId - The bill ID
   */
  async getBill(provider, chainId, billId) {
    const contract = this.getReadOnlyContract(provider, chainId);
    const bill = await contract.getBill(billId);

    return {
      billMaker: bill.billMaker,
      payer: bill.payer,
      amount: ethers.formatEther(bill.amount),
      platformFee: ethers.formatEther(bill.platformFee),
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
   * Calculate platform fee based on amount
   * Uses tiered fee structure from BillHaven
   */
  calculateFee(amount) {
    const numAmount = parseFloat(amount) || 0;
    let feePercentage;

    if (numAmount >= 5000) {
      feePercentage = 0.008; // 0.8%
    } else if (numAmount >= 1000) {
      feePercentage = 0.014; // 1.4%
    } else if (numAmount >= 500) {
      feePercentage = 0.024; // 2.4%
    } else if (numAmount >= 100) {
      feePercentage = 0.034; // 3.4%
    } else {
      feePercentage = 0.044; // 4.4%
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
