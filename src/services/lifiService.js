/**
 * LI.FI Cross-Chain Swap Service
 * Real integration with LI.FI API for cross-chain swaps
 * https://docs.li.fi/
 *
 * NO API KEY REQUIRED - LI.FI is free to use
 */

// LI.FI API Base URL
const LIFI_API_BASE = 'https://li.quest/v1';

// BillHaven integrator ID for tracking
const INTEGRATOR = 'billhaven';

// Platform fee in basis points (0.80% = 80 basis points)
const PLATFORM_FEE_BPS = 80;

/**
 * Native token address constant
 */
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

/**
 * Get all supported chains from LI.FI
 * @returns {Promise<Array>} List of supported chains
 */
export async function getSupportedChains() {
  try {
    const response = await fetch(`${LIFI_API_BASE}/chains`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.status}`);
    }
    const data = await response.json();
    return data.chains || [];
  } catch (error) {
    console.error('LI.FI getSupportedChains error:', error);
    throw error;
  }
}

/**
 * Get supported tokens for a specific chain
 * @param {number} chainId - Chain ID (e.g., 137 for Polygon)
 * @returns {Promise<Array>} List of supported tokens
 */
export async function getSupportedTokens(chainId) {
  try {
    const response = await fetch(`${LIFI_API_BASE}/tokens?chains=${chainId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }
    const data = await response.json();
    return data.tokens?.[chainId] || [];
  } catch (error) {
    console.error('LI.FI getSupportedTokens error:', error);
    throw error;
  }
}

/**
 * Get a swap quote from LI.FI
 * @param {Object} params - Quote parameters
 * @param {number} params.fromChainId - Source chain ID
 * @param {number} params.toChainId - Destination chain ID
 * @param {string} params.fromToken - Source token address
 * @param {string} params.toToken - Destination token address
 * @param {string} params.fromAmount - Amount in wei/smallest unit
 * @param {string} params.fromAddress - User's wallet address
 * @param {string} [params.toAddress] - Recipient address (defaults to fromAddress)
 * @param {string} [params.slippage] - Slippage tolerance (default: 0.03 = 3%)
 * @returns {Promise<Object>} Quote with route details
 */
export async function getSwapQuote({
  fromChainId,
  toChainId,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
  toAddress,
  slippage = '0.03'
}) {
  try {
    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString(),
      fromToken,
      toToken,
      fromAmount,
      fromAddress,
      toAddress: toAddress || fromAddress,
      slippage,
      integrator: INTEGRATOR,
      // Request fee collection for BillHaven
      fee: (PLATFORM_FEE_BPS / 10000).toString() // 0.008 = 0.80%
    });

    const response = await fetch(`${LIFI_API_BASE}/quote?${params}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Quote request failed: ${response.status}`);
    }

    const quote = await response.json();

    // Add BillHaven fee info to the quote
    return {
      ...quote,
      billhavenFee: {
        percentage: PLATFORM_FEE_BPS / 100, // 0.80%
        basisPoints: PLATFORM_FEE_BPS,
        estimatedFeeUSD: calculateFeeUSD(quote)
      }
    };
  } catch (error) {
    console.error('LI.FI getSwapQuote error:', error);
    throw error;
  }
}

/**
 * Get multiple route options for a swap
 * @param {Object} params - Same as getSwapQuote
 * @returns {Promise<Array>} Array of route options
 */
export async function getSwapRoutes({
  fromChainId,
  toChainId,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
  toAddress,
  slippage = '0.03'
}) {
  try {
    const requestBody = {
      fromChainId,
      toChainId,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount,
      fromAddress,
      toAddress: toAddress || fromAddress,
      options: {
        slippage: parseFloat(slippage),
        integrator: INTEGRATOR,
        fee: PLATFORM_FEE_BPS / 10000
      }
    };

    const response = await fetch(`${LIFI_API_BASE}/advanced/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Routes request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.routes || [];
  } catch (error) {
    console.error('LI.FI getSwapRoutes error:', error);
    throw error;
  }
}

/**
 * Check the status of a swap transaction
 * @param {string} txHash - Transaction hash
 * @param {number} fromChainId - Source chain ID
 * @param {number} toChainId - Destination chain ID
 * @returns {Promise<Object>} Transaction status
 */
export async function getSwapStatus(txHash, fromChainId, toChainId) {
  try {
    const params = new URLSearchParams({
      txHash,
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString()
    });

    const response = await fetch(`${LIFI_API_BASE}/status?${params}`);

    if (!response.ok) {
      throw new Error(`Status request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('LI.FI getSwapStatus error:', error);
    throw error;
  }
}

/**
 * Execute a swap using the quote data
 * Requires a connected wallet/signer
 * @param {Object} quote - Quote from getSwapQuote
 * @param {Object} signer - ethers.js signer
 * @returns {Promise<Object>} Transaction result
 */
export async function executeSwap(quote, signer) {
  try {
    if (!quote.transactionRequest) {
      throw new Error('Quote does not contain transaction data');
    }

    const { to, data, value, gasLimit, gasPrice } = quote.transactionRequest;

    // Build transaction
    const tx = {
      to,
      data,
      value: value || '0x0',
      gasLimit: gasLimit || undefined,
      gasPrice: gasPrice || undefined
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);

    // Return transaction details
    return {
      hash: txResponse.hash,
      quote,
      status: 'pending',
      fromChain: quote.action?.fromChainId,
      toChain: quote.action?.toChainId
    };
  } catch (error) {
    console.error('LI.FI executeSwap error:', error);
    throw error;
  }
}

/**
 * Calculate estimated fee in USD
 * @param {Object} quote - LI.FI quote
 * @returns {string} Fee in USD
 */
function calculateFeeUSD(quote) {
  try {
    const estimateUSD = parseFloat(quote.estimate?.toAmountUSD || '0');
    const feeUSD = estimateUSD * (PLATFORM_FEE_BPS / 10000);
    return feeUSD.toFixed(2);
  } catch {
    return '0.00';
  }
}

/**
 * Format quote for display in UI
 * @param {Object} quote - Raw quote from LI.FI
 * @returns {Object} Formatted quote for display
 */
export function formatQuoteForDisplay(quote) {
  if (!quote) return null;

  const estimate = quote.estimate || {};
  const action = quote.action || {};

  return {
    // Route info
    fromChain: action.fromChainId,
    toChain: action.toChainId,
    fromToken: {
      symbol: action.fromToken?.symbol,
      address: action.fromToken?.address,
      decimals: action.fromToken?.decimals,
      logoURI: action.fromToken?.logoURI
    },
    toToken: {
      symbol: action.toToken?.symbol,
      address: action.toToken?.address,
      decimals: action.toToken?.decimals,
      logoURI: action.toToken?.logoURI
    },

    // Amounts
    fromAmount: action.fromAmount,
    fromAmountUSD: estimate.fromAmountUSD,
    toAmount: estimate.toAmount,
    toAmountUSD: estimate.toAmountUSD,
    toAmountMin: estimate.toAmountMin,

    // Fees
    gasCost: estimate.gasCosts?.[0]?.amountUSD || '0.00',
    gasCostToken: estimate.gasCosts?.[0]?.token?.symbol || 'ETH',
    bridgeFee: estimate.feeCosts?.reduce((sum, fee) => sum + parseFloat(fee.amountUSD || 0), 0).toFixed(2) || '0.00',
    platformFee: quote.billhavenFee?.estimatedFeeUSD || '0.00',
    platformFeePercent: PLATFORM_FEE_BPS / 100, // 0.80%

    // Execution details
    executionDuration: estimate.executionDuration, // in seconds
    tool: quote.tool,
    toolDetails: quote.toolDetails,

    // Slippage
    slippage: action.slippage,

    // Raw data for execution
    transactionRequest: quote.transactionRequest,
    _raw: quote
  };
}

/**
 * Get token price in USD
 * @param {number} chainId - Chain ID
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<number>} Token price in USD
 */
export async function getTokenPrice(chainId, tokenAddress) {
  try {
    const response = await fetch(`${LIFI_API_BASE}/token?chain=${chainId}&token=${tokenAddress}`);

    if (!response.ok) {
      throw new Error(`Token price request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.priceUSD || 0;
  } catch (error) {
    console.error('LI.FI getTokenPrice error:', error);
    return 0;
  }
}

/**
 * Validate if a swap is possible
 * @param {Object} params - Quote parameters
 * @returns {Promise<boolean>} True if swap is possible
 */
export async function validateSwap(params) {
  try {
    const quote = await getSwapQuote(params);
    return !!quote.transactionRequest;
  } catch {
    return false;
  }
}

// Export constants
export const LIFI_CONFIG = {
  apiBase: LIFI_API_BASE,
  integrator: INTEGRATOR,
  platformFeeBps: PLATFORM_FEE_BPS,
  platformFeePercent: PLATFORM_FEE_BPS / 100
};

export default {
  getSupportedChains,
  getSupportedTokens,
  getSwapQuote,
  getSwapRoutes,
  getSwapStatus,
  executeSwap,
  formatQuoteForDisplay,
  getTokenPrice,
  validateSwap,
  NATIVE_TOKEN,
  LIFI_CONFIG
};
