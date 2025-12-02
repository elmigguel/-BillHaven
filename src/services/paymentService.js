/**
 * Unified Payment Service
 * Handles payments across all supported blockchains
 */

import { sendEVMPayment, verifyTransaction as verifyEVMTx } from './evmPayment'
import { sendBitcoinPayment, verifyBitcoinTransaction } from './bitcoinPayment'
import { sendTronPayment, verifyTronTransaction } from './tronPayment'

// Blockchain type classification
export const BLOCKCHAIN_TYPES = {
  EVM: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'],
  BITCOIN: ['bitcoin'],
  TRON: ['tron']
}

/**
 * Execute a payment on any supported blockchain
 * @param {Object} params
 * @param {string} params.network - Network key (ethereum, bitcoin, tron, etc.)
 * @param {string} params.token - Token symbol (native, USDT, USDC, TRX, BTC, ETH)
 * @param {string} params.toAddress - Recipient address
 * @param {number} params.amount - Amount to send
 * @param {Object} params.walletInfo - Wallet provider info (for Bitcoin)
 */
export async function executePayment({
  network,
  token,
  toAddress,
  amount,
  walletInfo = null
}) {
  try {
    let result

    // EVM Chains (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base)
    if (BLOCKCHAIN_TYPES.EVM.includes(network)) {
      result = await sendEVMPayment({
        network,
        token: token === network.toUpperCase() ? 'native' : token,
        toAddress,
        amount
      })
    }
    // Bitcoin
    else if (network === 'bitcoin') {
      if (!walletInfo) {
        throw new Error('Bitcoin wallet information required')
      }
      result = await sendBitcoinPayment({
        toAddress,
        amount,
        wallet: walletInfo.wallet,
        provider: walletInfo.provider
      })
    }
    // Tron
    else if (network === 'tron') {
      result = await sendTronPayment({
        token: token === 'TRX' || token === 'native' ? 'TRX' : token,
        toAddress,
        amount
      })
    }
    else {
      throw new Error(`Unsupported network: ${network}`)
    }

    return result
  } catch (error) {
    console.error(`Payment error on ${network}:`, error)
    throw error
  }
}

/**
 * Execute complete bill payment (bill amount + platform fee)
 * @param {Object} params
 * @param {Object} params.bill - Bill object with amount and payout_wallet
 * @param {string} params.network - Network to use for payment
 * @param {string} params.token - Token to use for payment
 * @param {string} params.platformFeeWallet - Platform fee recipient address
 * @param {Object} params.walletInfo - Wallet info (for Bitcoin)
 */
export async function executeBillPayment({
  bill,
  network,
  token,
  platformFeeWallet,
  walletInfo = null
}) {
  const results = {
    billPayment: null,
    feePayment: null,
    totalAmount: 0,
    platformFee: 0
  }

  try {
    // Calculate platform fee
    const platformFee = calculatePlatformFee(bill.amount)
    results.platformFee = platformFee
    results.totalAmount = bill.amount + platformFee

    // Step 1: Pay bill amount to owner
    console.log(`Paying ${bill.amount} ${token} to bill owner...`)
    results.billPayment = await executePayment({
      network,
      token,
      toAddress: bill.payout_wallet,
      amount: bill.amount,
      walletInfo
    })

    console.log('Bill payment successful:', results.billPayment.txHash)

    // Step 2: Pay platform fee
    console.log(`Paying ${platformFee} ${token} platform fee...`)
    results.feePayment = await executePayment({
      network,
      token,
      toAddress: platformFeeWallet,
      amount: platformFee,
      walletInfo
    })

    console.log('Fee payment successful:', results.feePayment.txHash)

    results.success = true
    return results
  } catch (error) {
    console.error('Bill payment error:', error)

    // Return partial results if first transaction succeeded
    results.success = false
    results.error = error.message

    return results
  }
}

/**
 * Calculate platform fee based on bill amount
 * Tiered fee structure with optional affiliate discount
 *
 * Standard Tiers:
 * - Under $10,000:      4.4% (2.2% with affiliate)
 * - $10,000 - $20,000:  3.5%
 * - $20,000 - $50,000:  2.8%
 * - $50,000 - $500,000: 1.7%
 * - $500,000 - $1M:     1.2%
 * - Over $1,000,000:    0.8%
 */
export function calculatePlatformFee(amount, hasAffiliateDiscount = false) {
  if (amount < 10000) return amount * (hasAffiliateDiscount ? 0.022 : 0.044)  // 4.4% or 2.2%
  if (amount < 20000) return amount * 0.035     // 3.5%
  if (amount < 50000) return amount * 0.028     // 2.8%
  if (amount < 500000) return amount * 0.017    // 1.7%
  if (amount < 1000000) return amount * 0.012   // 1.2%
  return amount * 0.008                          // 0.8%
}

/**
 * Get fee percentage for display
 */
export function getFeePercentage(amount, hasAffiliateDiscount = false) {
  if (amount < 10000) return hasAffiliateDiscount ? 2.2 : 4.4
  if (amount < 20000) return 3.5
  if (amount < 50000) return 2.8
  if (amount < 500000) return 1.7
  if (amount < 1000000) return 1.2
  return 0.8
}

/**
 * Verify a transaction on any blockchain
 * @param {string} network - Network key
 * @param {string} txHash - Transaction hash
 */
export async function verifyPayment(network, txHash) {
  try {
    if (BLOCKCHAIN_TYPES.EVM.includes(network)) {
      return await verifyEVMTx(network, txHash)
    }
    else if (network === 'bitcoin') {
      return await verifyBitcoinTransaction(txHash)
    }
    else if (network === 'tron') {
      return await verifyTronTransaction(txHash)
    }
    else {
      throw new Error(`Unsupported network for verification: ${network}`)
    }
  } catch (error) {
    console.error(`Verification error on ${network}:`, error)
    return {
      verified: false,
      status: 'error',
      message: error.message
    }
  }
}

/**
 * Get blockchain explorer URL for a transaction
 */
export function getExplorerUrl(network, txHash) {
  const explorers = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
    base: `https://basescan.org/tx/${txHash}`,
    bitcoin: `https://mempool.space/tx/${txHash}`,
    tron: `https://tronscan.org/#/transaction/${txHash}`
  }

  return explorers[network] || '#'
}

/**
 * Format address for display (shortened)
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return ''
  if (address.length < startChars + endChars) return address

  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

/**
 * Validate address format for different blockchains
 */
export function isValidAddress(network, address) {
  if (!address) return false

  try {
    if (BLOCKCHAIN_TYPES.EVM.includes(network)) {
      // Ethereum-style address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    }
    else if (network === 'bitcoin') {
      // Bitcoin address validation (basic)
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // P2PKH/P2SH
             /^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(address)        // Bech32
    }
    else if (network === 'tron') {
      // Tron address validation
      return /^T[a-zA-HJ-NP-Z1-9]{33}$/.test(address)
    }

    return false
  } catch (error) {
    return false
  }
}
