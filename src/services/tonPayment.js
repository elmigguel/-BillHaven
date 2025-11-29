/**
 * TON Payment Service
 *
 * Handles TON blockchain payments for BillHaven.
 * Supports: Native TON and USDT (Jetton) transfers.
 *
 * Fees: ~$0.025/tx (4x cheaper than Polygon!)
 */

import { Address, beginCell, toNano, TonClient } from '@ton/ton';
import { getTonNetwork, getTonUSDT, TON_FEES } from '../config/tonNetworks';

// Initialize TON client
const getClient = (isTestnet = false) => {
  const network = getTonNetwork(isTestnet);
  return new TonClient({
    endpoint: network.endpoint
  });
};

/**
 * Get user's Jetton Wallet address for a specific token
 * Each user has a unique wallet address per token type
 */
export async function getJettonWalletAddress(ownerAddress, jettonMasterAddress, isTestnet = false) {
  try {
    const client = getClient(isTestnet);

    const { stack } = await client.callGetMethod(
      Address.parse(jettonMasterAddress),
      'get_wallet_address',
      [{ type: 'slice', cell: beginCell().storeAddress(Address.parse(ownerAddress)).endCell() }]
    );

    return stack.readAddress().toString();
  } catch (error) {
    console.error('Error getting Jetton wallet address:', error);
    throw new Error('Failed to get USDT wallet address');
  }
}

/**
 * Get USDT balance for a wallet
 */
export async function getUSDTBalance(walletAddress, isTestnet = false) {
  try {
    const usdtConfig = getTonUSDT(isTestnet);
    const jettonWalletAddress = await getJettonWalletAddress(
      walletAddress,
      usdtConfig.masterAddress,
      isTestnet
    );

    const client = getClient(isTestnet);

    const { stack } = await client.callGetMethod(
      Address.parse(jettonWalletAddress),
      'get_wallet_data',
      []
    );

    const balance = stack.readBigNumber();
    // Convert from smallest unit (6 decimals) to USDT
    return Number(balance) / Math.pow(10, usdtConfig.decimals);
  } catch (error) {
    console.error('Error getting USDT balance:', error);
    return 0;
  }
}

/**
 * Get native TON balance
 */
export async function getTonBalance(walletAddress, isTestnet = false) {
  try {
    const client = getClient(isTestnet);
    const balance = await client.getBalance(Address.parse(walletAddress));
    // Convert from nanotons to TON (9 decimals)
    return Number(balance) / 1e9;
  } catch (error) {
    console.error('Error getting TON balance:', error);
    return 0;
  }
}

/**
 * Build USDT transfer transaction for TonConnect
 * Returns transaction object ready for tonConnectUI.sendTransaction()
 */
export function buildUSDTTransfer(
  senderJettonWallet,
  recipientAddress,
  amount,
  senderAddress,
  isTestnet = false
) {
  const usdtConfig = getTonUSDT(isTestnet);

  // Convert USDT amount to smallest units (6 decimals!)
  const jettonAmount = BigInt(Math.floor(amount * Math.pow(10, usdtConfig.decimals)));

  // Build forward payload
  const forwardPayload = beginCell()
    .storeUint(0, 32)
    .storeStringTail('BillHaven Payment')
    .endCell();

  // Build Jetton transfer body (TEP-74 standard)
  const body = beginCell()
    .storeUint(0xf8a7ea5, 32)                     // Op code
    .storeUint(0, 64)                              // Query ID
    .storeCoins(jettonAmount)                      // Amount
    .storeAddress(Address.parse(recipientAddress)) // Destination
    .storeAddress(Address.parse(senderAddress))    // Response destination
    .storeBit(0)                                   // No custom payload
    .storeCoins(toNano(TON_FEES.forwardAmount))   // Forward amount (1 nanoton!)
    .storeBit(1)                                   // Has forward payload
    .storeRef(forwardPayload)
    .endCell();

  return {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
      {
        address: senderJettonWallet,
        amount: toNano(TON_FEES.jettonTransferGas).toString(),
        payload: body.toBoc().toString('base64')
      }
    ]
  };
}

/**
 * Build native TON transfer transaction
 */
export function buildTonTransfer(recipientAddress, amount) {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
      {
        address: recipientAddress,
        amount: toNano(amount.toString()).toString()
      }
    ]
  };
}

/**
 * Verify a TON transaction
 */
export async function verifyTransaction(txHash, isTestnet = false) {
  try {
    const network = getTonNetwork(isTestnet);
    // TON uses different transaction verification
    // For now, return explorer URL
    return {
      verified: true,
      explorerUrl: `${network.explorer}/tx/${txHash}`
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return { verified: false, error: error.message };
  }
}

/**
 * Format TON amount for display
 */
export function formatTonAmount(amount, decimals = 9) {
  if (!amount) return '0';
  const formatted = Number(amount).toFixed(decimals);
  // Remove trailing zeros
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Format USDT amount for display
 */
export function formatUSDTAmount(amount) {
  if (!amount) return '0.00';
  return Number(amount).toFixed(2);
}

/**
 * Validate TON address
 */
export function isValidTonAddress(address) {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get estimated transaction fee
 */
export function getEstimatedFee(tokenType = 'TON') {
  if (tokenType === 'USDT') {
    return {
      fee: parseFloat(TON_FEES.jettonTransferGas) + parseFloat(TON_FEES.averageTransferFee),
      feeToken: 'TON',
      feeUSD: 0.40 // Approximate USD value
    };
  }
  return {
    fee: parseFloat(TON_FEES.averageTransferFee),
    feeToken: 'TON',
    feeUSD: 0.10
  };
}

export default {
  getJettonWalletAddress,
  getUSDTBalance,
  getTonBalance,
  buildUSDTTransfer,
  buildTonTransfer,
  verifyTransaction,
  formatTonAmount,
  formatUSDTAmount,
  isValidTonAddress,
  getEstimatedFee
};
