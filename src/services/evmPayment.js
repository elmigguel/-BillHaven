/**
 * EVM Payment Service
 * Handles payments on Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base
 */

import { ethers } from 'ethers'
import { EVM_NETWORKS } from '../config/networks'

// ERC20 Token ABI (minimal interface for transfers)
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)'
]

/**
 * Switch to a specific EVM network
 * @param {string} networkKey - Network key from EVM_NETWORKS
 */
export async function switchNetwork(networkKey) {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.')
  }

  const network = EVM_NETWORKS[networkKey]
  if (!network) {
    throw new Error(`Unsupported network: ${networkKey}`)
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.hexChainId }]
    })
  } catch (switchError) {
    // Network not added to wallet, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: network.hexChainId,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: [network.rpc],
            blockExplorerUrls: [network.explorer]
          }]
        })
      } catch (addError) {
        throw new Error(`Failed to add network: ${addError.message}`)
      }
    } else {
      throw new Error(`Failed to switch network: ${switchError.message}`)
    }
  }
}

/**
 * Get current connected network
 */
export async function getCurrentNetwork() {
  if (!window.ethereum) return null

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    const chainIdDecimal = parseInt(chainId, 16)

    const network = Object.entries(EVM_NETWORKS).find(
      ([_, config]) => config.chainId === chainIdDecimal
    )

    return network ? { key: network[0], ...network[1] } : null
  } catch (error) {
    console.error('Error getting current network:', error)
    return null
  }
}

/**
 * Send EVM payment (native currency or ERC20 token)
 * @param {Object} params
 * @param {string} params.network - Network key (ethereum, polygon, etc.)
 * @param {string} params.token - Token symbol (native, USDT, USDC)
 * @param {string} params.toAddress - Recipient address
 * @param {number} params.amount - Amount to send
 */
export async function sendEVMPayment({ network, token, toAddress, amount }) {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected')
  }

  // Validate inputs
  if (!ethers.isAddress(toAddress)) {
    throw new Error('Invalid recipient address')
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  // Switch to correct network
  await switchNetwork(network)

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const networkConfig = EVM_NETWORKS[network]

  try {
    let tx

    // Native currency payment (ETH, MATIC, BNB)
    if (token === 'native') {
      const amountWei = ethers.parseEther(amount.toString())

      tx = await signer.sendTransaction({
        to: toAddress,
        value: amountWei
      })
    }
    // ERC20 token payment (USDT, USDC)
    else {
      const tokenConfig = networkConfig.tokens[token]
      if (!tokenConfig) {
        throw new Error(`Token ${token} not supported on ${network}`)
      }

      const contract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        signer
      )

      const amountWithDecimals = ethers.parseUnits(
        amount.toString(),
        tokenConfig.decimals
      )

      tx = await contract.transfer(toAddress, amountWithDecimals)
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString() || '0',
      network,
      token,
      amount,
      toAddress
    }
  } catch (error) {
    console.error('EVM payment error:', error)

    // User rejected transaction
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user')
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for transaction')
    }

    throw new Error(`Payment failed: ${error.message}`)
  }
}

/**
 * Get balance for native currency or ERC20 token
 * @param {string} network - Network key
 * @param {string} token - Token symbol (native, USDT, USDC)
 * @param {string} address - Wallet address
 */
export async function getBalance(network, token, address) {
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid address')
  }

  const networkConfig = EVM_NETWORKS[network]
  const provider = new ethers.JsonRpcProvider(networkConfig.rpc)

  try {
    if (token === 'native') {
      const balanceWei = await provider.getBalance(address)
      return ethers.formatEther(balanceWei)
    } else {
      const tokenConfig = networkConfig.tokens[token]
      if (!tokenConfig) {
        throw new Error(`Token ${token} not supported on ${network}`)
      }

      const contract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        provider
      )

      const balance = await contract.balanceOf(address)
      return ethers.formatUnits(balance, tokenConfig.decimals)
    }
  } catch (error) {
    console.error('Error getting balance:', error)
    return '0'
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas({ network, token, toAddress, amount }) {
  if (!window.ethereum) {
    throw new Error('No Ethereum wallet detected')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const networkConfig = EVM_NETWORKS[network]

  try {
    let gasEstimate

    if (token === 'native') {
      const amountWei = ethers.parseEther(amount.toString())
      gasEstimate = await provider.estimateGas({
        to: toAddress,
        value: amountWei,
        from: await signer.getAddress()
      })
    } else {
      const tokenConfig = networkConfig.tokens[token]
      const contract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        signer
      )

      const amountWithDecimals = ethers.parseUnits(
        amount.toString(),
        tokenConfig.decimals
      )

      gasEstimate = await contract.transfer.estimateGas(
        toAddress,
        amountWithDecimals
      )
    }

    const feeData = await provider.getFeeData()
    const gasCost = gasEstimate * (feeData.gasPrice || feeData.maxFeePerGas)

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString() || '0',
      maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
      estimatedCost: ethers.formatEther(gasCost),
      estimatedCostUSD: null // Would need price oracle
    }
  } catch (error) {
    console.error('Error estimating gas:', error)
    throw new Error(`Gas estimation failed: ${error.message}`)
  }
}

/**
 * Verify a transaction on blockchain
 */
export async function verifyTransaction(network, txHash) {
  const networkConfig = EVM_NETWORKS[network]
  const provider = new ethers.JsonRpcProvider(networkConfig.rpc)

  try {
    const receipt = await provider.getTransactionReceipt(txHash)

    if (!receipt) {
      return {
        verified: false,
        status: 'pending',
        message: 'Transaction not found or still pending'
      }
    }

    const transaction = await provider.getTransaction(txHash)
    const currentBlock = await provider.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber

    return {
      verified: receipt.status === 1,
      status: receipt.status === 1 ? 'success' : 'failed',
      confirmations,
      blockNumber: receipt.blockNumber,
      from: transaction.from,
      to: transaction.to,
      value: ethers.formatEther(transaction.value),
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString() || '0'
    }
  } catch (error) {
    console.error('Error verifying transaction:', error)
    return {
      verified: false,
      status: 'error',
      message: error.message
    }
  }
}
