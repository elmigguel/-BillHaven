/**
 * Bitcoin Payment Service
 * Handles Bitcoin payments using wallet providers (Xverse, Leather, Unisat)
 */

import { BITCOIN_CONFIG } from '../config/networks'

/**
 * Detect and connect to Bitcoin wallet
 * Supports: Xverse, Leather, Unisat
 */
export async function connectBitcoinWallet() {
  // Try Xverse
  if (window.XverseProviders?.BitcoinProvider) {
    try {
      const xverse = window.XverseProviders.BitcoinProvider
      const accounts = await xverse.connect()
      return {
        wallet: 'xverse',
        address: accounts[0].address,
        provider: xverse
      }
    } catch (error) {
      console.error('Xverse connection error:', error)
    }
  }

  // Try Leather (formerly Hiro Wallet)
  if (window.LeatherProvider || window.HiroWalletProvider) {
    try {
      const leather = window.LeatherProvider || window.HiroWalletProvider
      const response = await leather.request('getAddresses')
      return {
        wallet: 'leather',
        address: response.result.addresses[0].address,
        provider: leather
      }
    } catch (error) {
      console.error('Leather connection error:', error)
    }
  }

  // Try Unisat
  if (window.unisat) {
    try {
      const accounts = await window.unisat.requestAccounts()
      return {
        wallet: 'unisat',
        address: accounts[0],
        provider: window.unisat
      }
    } catch (error) {
      console.error('Unisat connection error:', error)
    }
  }

  throw new Error(
    'No Bitcoin wallet detected. Please install Xverse, Leather, or Unisat wallet extension.'
  )
}

/**
 * Send Bitcoin payment
 * @param {Object} params
 * @param {string} params.toAddress - Recipient Bitcoin address
 * @param {number} params.amount - Amount in BTC
 * @param {string} params.wallet - Wallet type (xverse, leather, unisat)
 * @param {Object} params.provider - Wallet provider instance
 */
export async function sendBitcoinPayment({ toAddress, amount, wallet, provider }) {
  // Validate Bitcoin address (basic check)
  if (!toAddress || toAddress.length < 26 || toAddress.length > 62) {
    throw new Error('Invalid Bitcoin address')
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  const satoshis = Math.floor(amount * 100000000) // Convert BTC to satoshis

  try {
    let txid

    if (wallet === 'xverse') {
      const response = await provider.sendTransfer({
        recipients: [{
          address: toAddress,
          amount: satoshis
        }]
      })
      txid = response.txid
    }
    else if (wallet === 'unisat') {
      txid = await provider.sendBitcoin(toAddress, satoshis)
    }
    else if (wallet === 'leather') {
      const response = await provider.request('sendTransfer', {
        address: toAddress,
        amount: satoshis
      })
      txid = response.result.txid
    }
    else {
      throw new Error(`Unsupported wallet: ${wallet}`)
    }

    return {
      success: true,
      txHash: txid,
      network: 'bitcoin',
      amount,
      toAddress,
      satoshis
    }
  } catch (error) {
    console.error('Bitcoin payment error:', error)

    // User rejected transaction
    if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
      throw new Error('Transaction rejected by user')
    }

    // Insufficient funds
    if (error.message?.includes('Insufficient') || error.message?.includes('balance')) {
      throw new Error('Insufficient Bitcoin balance')
    }

    throw new Error(`Bitcoin payment failed: ${error.message}`)
  }
}

/**
 * Get Bitcoin balance
 * @param {string} address - Bitcoin address
 */
export async function getBitcoinBalance(address) {
  try {
    const response = await fetch(
      `${BITCOIN_CONFIG.mempoolApi}/address/${address}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch balance')
    }

    const data = await response.json()

    const confirmedSatoshis = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum
    const unconfirmedSatoshis = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum

    return {
      confirmed: confirmedSatoshis / 100000000,
      unconfirmed: unconfirmedSatoshis / 100000000,
      total: (confirmedSatoshis + unconfirmedSatoshis) / 100000000
    }
  } catch (error) {
    console.error('Error getting Bitcoin balance:', error)
    return { confirmed: 0, unconfirmed: 0, total: 0 }
  }
}

/**
 * Verify Bitcoin transaction
 * @param {string} txHash - Transaction hash
 */
export async function verifyBitcoinTransaction(txHash) {
  try {
    const response = await fetch(
      `${BITCOIN_CONFIG.mempoolApi}/tx/${txHash}`
    )

    if (!response.ok) {
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found'
      }
    }

    const tx = await response.json()

    return {
      verified: true,
      status: tx.status.confirmed ? 'confirmed' : 'pending',
      confirmations: tx.status.block_height ? tx.status.block_height : 0,
      blockHeight: tx.status.block_height,
      blockTime: tx.status.block_time,
      fee: tx.fee,
      size: tx.size,
      weight: tx.weight,
      inputs: tx.vin.length,
      outputs: tx.vout.length
    }
  } catch (error) {
    console.error('Error verifying Bitcoin transaction:', error)
    return {
      verified: false,
      status: 'error',
      message: error.message
    }
  }
}

/**
 * Get recommended fee rates
 */
export async function getFeeRates() {
  try {
    const response = await fetch(
      `${BITCOIN_CONFIG.mempoolApi}/v1/fees/recommended`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch fee rates')
    }

    const data = await response.json()

    return {
      fastestFee: data.fastestFee, // sat/vB
      halfHourFee: data.halfHourFee,
      hourFee: data.hourFee,
      economyFee: data.economyFee,
      minimumFee: data.minimumFee
    }
  } catch (error) {
    console.error('Error getting fee rates:', error)
    // Return default values
    return {
      fastestFee: 20,
      halfHourFee: 15,
      hourFee: 10,
      economyFee: 5,
      minimumFee: 1
    }
  }
}
