/**
 * Tron Payment Service
 * Handles TRX and TRC20 token payments (USDT, USDC)
 */

import TronWeb from 'tronweb'
import { TRON_CONFIG } from '../config/networks'

/**
 * Connect to TronLink wallet
 */
export async function connectTronWallet() {
  if (!window.tronWeb || !window.tronWeb.ready) {
    throw new Error(
      'TronLink wallet not detected. Please install TronLink extension.'
    )
  }

  try {
    const tronWeb = window.tronWeb
    const address = tronWeb.defaultAddress.base58

    if (!address) {
      throw new Error('Please unlock your TronLink wallet')
    }

    return {
      address,
      tronWeb,
      network: tronWeb.fullNode.host.includes('shasta') ? 'shasta' : 'mainnet'
    }
  } catch (error) {
    console.error('TronLink connection error:', error)
    throw new Error(`Failed to connect to TronLink: ${error.message}`)
  }
}

/**
 * Send Tron payment (TRX or TRC20 tokens)
 * @param {Object} params
 * @param {string} params.token - Token symbol (TRX, USDT, USDC)
 * @param {string} params.toAddress - Recipient address
 * @param {number} params.amount - Amount to send
 */
export async function sendTronPayment({ token, toAddress, amount }) {
  if (!window.tronWeb || !window.tronWeb.ready) {
    throw new Error('TronLink wallet not connected')
  }

  // Validate Tron address
  if (!window.tronWeb.isAddress(toAddress)) {
    throw new Error('Invalid Tron address')
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  const tronWeb = window.tronWeb

  try {
    let txid

    // Native TRX payment
    if (token === 'TRX') {
      const amountSun = tronWeb.toSun(amount) // Convert TRX to SUN (1 TRX = 1e6 SUN)

      const transaction = await tronWeb.transactionBuilder.sendTrx(
        toAddress,
        amountSun,
        tronWeb.defaultAddress.base58
      )

      const signedTx = await tronWeb.trx.sign(transaction)
      const broadcast = await tronWeb.trx.sendRawTransaction(signedTx)

      if (!broadcast.result) {
        throw new Error('Transaction broadcast failed')
      }

      txid = broadcast.txid || broadcast.transaction.txID
    }
    // TRC20 token payment (USDT, USDC)
    else {
      const tokenAddress = TRON_CONFIG.tokens[token]
      if (!tokenAddress) {
        throw new Error(`Token ${token} not supported on Tron`)
      }

      const contract = await tronWeb.contract().at(tokenAddress)

      // Get token decimals
      const decimals = await contract.decimals().call()
      const amountInSmallestUnit = amount * Math.pow(10, decimals)

      const tx = await contract.transfer(
        toAddress,
        amountInSmallestUnit
      ).send({
        feeLimit: 100000000, // 100 TRX
        callValue: 0
      })

      txid = tx
    }

    return {
      success: true,
      txHash: txid,
      network: 'tron',
      token,
      amount,
      toAddress
    }
  } catch (error) {
    console.error('Tron payment error:', error)

    // User rejected transaction
    if (error.message?.includes('Confirmation declined') ||
        error.message?.includes('User rejected')) {
      throw new Error('Transaction rejected by user')
    }

    // Insufficient funds
    if (error.message?.includes('Insufficient') ||
        error.message?.includes('balance')) {
      throw new Error(`Insufficient ${token} balance`)
    }

    // Insufficient energy/bandwidth
    if (error.message?.includes('energy') || error.message?.includes('bandwidth')) {
      throw new Error('Insufficient energy or bandwidth. Please freeze some TRX.')
    }

    throw new Error(`Tron payment failed: ${error.message}`)
  }
}

/**
 * Get Tron balance (TRX or TRC20 tokens)
 * @param {string} address - Tron address
 * @param {string} token - Token symbol (TRX, USDT, USDC)
 */
export async function getTronBalance(address, token = 'TRX') {
  const tronWeb = new TronWeb({
    fullHost: TRON_CONFIG.gridApi
  })

  // Validate address
  if (!tronWeb.isAddress(address)) {
    throw new Error('Invalid Tron address')
  }

  try {
    if (token === 'TRX') {
      const balance = await tronWeb.trx.getBalance(address)
      return tronWeb.fromSun(balance) // Convert from SUN to TRX
    }

    // TRC20 token balance
    const tokenAddress = TRON_CONFIG.tokens[token]
    if (!tokenAddress) {
      throw new Error(`Token ${token} not supported`)
    }

    const contract = await tronWeb.contract().at(tokenAddress)
    const balance = await contract.balanceOf(address).call()
    const decimals = await contract.decimals().call()

    return balance / Math.pow(10, decimals)
  } catch (error) {
    console.error('Error getting Tron balance:', error)
    return 0
  }
}

/**
 * Verify Tron transaction
 * @param {string} txHash - Transaction hash
 */
export async function verifyTronTransaction(txHash) {
  const tronWeb = new TronWeb({
    fullHost: TRON_CONFIG.gridApi
  })

  try {
    const tx = await tronWeb.trx.getTransaction(txHash)

    if (!tx || !tx.txID) {
      return {
        verified: false,
        status: 'not_found',
        message: 'Transaction not found'
      }
    }

    const txInfo = await tronWeb.trx.getTransactionInfo(txHash)

    return {
      verified: true,
      status: txInfo.receipt?.result === 'SUCCESS' ? 'success' : 'failed',
      confirmations: txInfo.blockNumber ? 1 : 0, // Tron confirmations are fast
      blockNumber: txInfo.blockNumber,
      blockTime: tx.raw_data?.timestamp,
      energyUsed: txInfo.receipt?.energy_usage_total || 0,
      fee: txInfo.fee || 0,
      result: txInfo.receipt?.result
    }
  } catch (error) {
    console.error('Error verifying Tron transaction:', error)
    return {
      verified: false,
      status: 'error',
      message: error.message
    }
  }
}

/**
 * Get account resources (energy, bandwidth)
 */
export async function getAccountResources(address) {
  const tronWeb = new TronWeb({
    fullHost: TRON_CONFIG.gridApi
  })

  try {
    const resources = await tronWeb.trx.getAccountResources(address)

    return {
      freeNetLimit: resources.freeNetLimit || 0,
      freeNetUsed: resources.freeNetUsed || 0,
      netLimit: resources.NetLimit || 0,
      netUsed: resources.NetUsed || 0,
      energyLimit: resources.EnergyLimit || 0,
      energyUsed: resources.EnergyUsed || 0
    }
  } catch (error) {
    console.error('Error getting account resources:', error)
    return null
  }
}
