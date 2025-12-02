/**
 * Solana Payment Service
 *
 * Handles Solana blockchain payments for BillHaven escrow platform.
 * Supports: Native SOL and SPL tokens (USDC, USDT)
 *
 * Features:
 * - Phantom, Solflare, Backpack wallet support via wallet-adapter
 * - SPL token transfers with ATA handling
 * - Anchor program interaction for escrow
 * - Transaction monitoring with confirmations
 * - Balance checking for SOL and SPL tokens
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';

import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';

import {
  getSolanaNetwork,
  getSolanaToken,
  isNativeSOL,
  lamportsToSOL,
  solToLamports,
  SOLANA_FEES,
  CONFIRMATION_LEVELS
} from '../config/solanaNetworks';

// Connection cache
let connectionCache = {};

/**
 * Get or create a connection to Solana network
 */
export function getConnection(networkKey = 'devnet') {
  if (!connectionCache[networkKey]) {
    const network = getSolanaNetwork(networkKey);
    connectionCache[networkKey] = new Connection(network.endpoint, 'confirmed');
  }
  return connectionCache[networkKey];
}

/**
 * Get SOL balance for a wallet
 */
export async function getSOLBalance(walletAddress, networkKey = 'devnet') {
  try {
    const connection = getConnection(networkKey);
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);

    return {
      lamports: balance,
      sol: lamportsToSOL(balance),
      formatted: `${lamportsToSOL(balance).toFixed(4)} SOL`
    };
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    throw new Error(`Failed to get SOL balance: ${error.message}`);
  }
}

/**
 * Get SPL token balance for a wallet
 */
export async function getTokenBalance(walletAddress, tokenMint, networkKey = 'devnet') {
  try {
    const connection = getConnection(networkKey);
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMint);

    // Get the associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress);
      const token = Object.values(getSolanaToken('USDC', networkKey) || {})
        .find(t => t.mint === tokenMint) || { decimals: 6 };

      const balance = Number(tokenAccount.amount);
      const decimals = token.decimals || 6;
      const humanBalance = balance / Math.pow(10, decimals);

      return {
        raw: balance,
        balance: humanBalance,
        formatted: `${humanBalance.toFixed(2)} ${token.symbol || 'TOKEN'}`,
        tokenAccount: tokenAccountAddress.toString()
      };
    } catch (e) {
      // Token account doesn't exist - balance is 0
      return {
        raw: 0,
        balance: 0,
        formatted: '0.00',
        tokenAccount: null
      };
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

/**
 * Get all balances for a wallet (SOL + supported tokens)
 */
export async function getAllBalances(walletAddress, networkKey = 'devnet') {
  try {
    const solBalance = await getSOLBalance(walletAddress, networkKey);

    // Get USDC balance
    const usdcToken = getSolanaToken('USDC', networkKey);
    const usdcBalance = usdcToken
      ? await getTokenBalance(walletAddress, usdcToken.mint, networkKey)
      : { balance: 0, formatted: '0.00 USDC' };

    // Get USDT balance
    const usdtToken = getSolanaToken('USDT', networkKey);
    const usdtBalance = usdtToken
      ? await getTokenBalance(walletAddress, usdtToken.mint, networkKey)
      : { balance: 0, formatted: '0.00 USDT' };

    return {
      SOL: solBalance,
      USDC: usdcBalance,
      USDT: usdtBalance
    };
  } catch (error) {
    console.error('Error getting all balances:', error);
    throw error;
  }
}

/**
 * Transfer native SOL
 */
export async function transferSOL(
  wallet,
  recipientAddress,
  amountSOL,
  networkKey = 'devnet'
) {
  try {
    const connection = getConnection(networkKey);
    const recipientPubkey = new PublicKey(recipientAddress);
    const lamports = solToLamports(amountSOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientPubkey,
        lamports
      })
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send via wallet adapter
    const signature = await wallet.sendTransaction(transaction, connection);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    const network = getSolanaNetwork(networkKey);

    return {
      success: true,
      signature,
      explorerUrl: network.explorerTx(signature),
      amount: amountSOL,
      recipient: recipientAddress
    };
  } catch (error) {
    console.error('Error transferring SOL:', error);
    throw new Error(`SOL transfer failed: ${error.message}`);
  }
}

/**
 * Transfer SPL token (USDC, USDT)
 */
export async function transferToken(
  wallet,
  recipientAddress,
  tokenMint,
  amount,
  networkKey = 'devnet'
) {
  try {
    const connection = getConnection(networkKey);
    const recipientPubkey = new PublicKey(recipientAddress);
    const mintPubkey = new PublicKey(tokenMint);

    // Get token info for decimals
    const tokenInfo = getSolanaToken('USDC', networkKey)?.mint === tokenMint
      ? getSolanaToken('USDC', networkKey)
      : getSolanaToken('USDT', networkKey);

    const decimals = tokenInfo?.decimals || 6;
    const rawAmount = Math.floor(amount * Math.pow(10, decimals));

    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get destination token account
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();

    // Check if destination token account exists, create if not
    try {
      await getAccount(connection, destinationTokenAccount);
    } catch (e) {
      // Account doesn't exist, need to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          destinationTokenAccount,
          recipientPubkey,
          mintPubkey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        wallet.publicKey,
        rawAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send via wallet adapter
    const signature = await wallet.sendTransaction(transaction, connection);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    const network = getSolanaNetwork(networkKey);

    return {
      success: true,
      signature,
      explorerUrl: network.explorerTx(signature),
      amount,
      token: tokenInfo?.symbol || 'TOKEN',
      recipient: recipientAddress
    };
  } catch (error) {
    console.error('Error transferring token:', error);
    throw new Error(`Token transfer failed: ${error.message}`);
  }
}

/**
 * Monitor transaction status
 */
export async function monitorTransaction(signature, networkKey = 'devnet') {
  const connection = getConnection(networkKey);
  const network = getSolanaNetwork(networkKey);

  try {
    // Get transaction status
    const status = await connection.getSignatureStatus(signature);

    if (!status || !status.value) {
      return {
        status: 'pending',
        confirmations: 0,
        explorerUrl: network.explorerTx(signature)
      };
    }

    const { confirmationStatus, confirmations, err } = status.value;

    if (err) {
      return {
        status: 'failed',
        error: err,
        explorerUrl: network.explorerTx(signature)
      };
    }

    return {
      status: confirmationStatus || 'unknown',
      confirmations: confirmations || 0,
      finalized: confirmationStatus === 'finalized',
      explorerUrl: network.explorerTx(signature)
    };
  } catch (error) {
    console.error('Error monitoring transaction:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Wait for transaction finalization
 */
export async function waitForFinalization(signature, networkKey = 'devnet', maxAttempts = 30) {
  const connection = getConnection(networkKey);

  for (let i = 0; i < maxAttempts; i++) {
    const status = await monitorTransaction(signature, networkKey);

    if (status.status === 'finalized') {
      return { success: true, ...status };
    }

    if (status.status === 'failed') {
      return { success: false, ...status };
    }

    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: false,
    status: 'timeout',
    message: 'Transaction did not finalize within expected time'
  };
}

/**
 * Estimate transaction fee
 */
export async function estimateFee(networkKey = 'devnet') {
  try {
    const connection = getConnection(networkKey);
    const recentBlockhash = await connection.getLatestBlockhash();

    // Base fee is typically 5000 lamports
    const baseFee = SOLANA_FEES.baseFee;

    // Get priority fee estimate (optional)
    const priorityFee = SOLANA_FEES.priorityFee;

    return {
      baseFee: lamportsToSOL(baseFee),
      priorityFee: lamportsToSOL(priorityFee),
      totalFee: lamportsToSOL(baseFee + priorityFee),
      formatted: `~${lamportsToSOL(baseFee).toFixed(6)} SOL`,
      usdEstimate: '$0.001' // Approximate based on SOL price
    };
  } catch (error) {
    console.error('Error estimating fee:', error);
    return {
      baseFee: 0.000005,
      formatted: '~0.000005 SOL',
      usdEstimate: '$0.001'
    };
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(signature, networkKey = 'devnet') {
  try {
    const connection = getConnection(networkKey);
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return null;
    }

    const network = getSolanaNetwork(networkKey);

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      fee: lamportsToSOL(tx.meta?.fee || 0),
      status: tx.meta?.err ? 'failed' : 'success',
      explorerUrl: network.explorerTx(signature)
    };
  } catch (error) {
    console.error('Error getting transaction details:', error);
    return null;
  }
}

// Export all functions
export default {
  getConnection,
  getSOLBalance,
  getTokenBalance,
  getAllBalances,
  transferSOL,
  transferToken,
  monitorTransaction,
  waitForFinalization,
  estimateFee,
  isValidSolanaAddress,
  getTransactionDetails
};
