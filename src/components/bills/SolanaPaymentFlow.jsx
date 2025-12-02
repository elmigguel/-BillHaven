/**
 * Solana Payment Flow Component
 *
 * Complete payment UI for Solana-based bill payments.
 * Supports: Native SOL, USDC, USDT (SPL tokens)
 *
 * Features:
 * - Token selection
 * - Balance display
 * - Transaction signing via wallet adapter
 * - Real-time status updates
 * - Explorer links
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  useSolanaWallet,
  WalletMultiButton
} from '../../contexts/SolanaWalletContext';
import {
  transferSOL,
  transferToken,
  monitorTransaction,
  waitForFinalization,
  estimateFee,
  isValidSolanaAddress
} from '../../services/solanaPayment';
import {
  getSolanaToken,
  getSupportedSolanaTokens,
  isNativeSOL
} from '../../config/solanaNetworks';

// Payment states
const PaymentState = {
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  SIGNING: 'signing',
  SENDING: 'sending',
  WAITING: 'waiting',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Solana Payment Flow Component
 */
export default function SolanaPaymentFlow({
  bill,
  recipientAddress,
  amount,
  onSuccess,
  onError,
  onCancel,
  className = ''
}) {
  const {
    wallet,
    connected,
    address,
    balances,
    isLoadingBalance,
    refreshBalances,
    networkInfo,
    isTestnet
  } = useSolanaWallet();

  // State
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [paymentState, setPaymentState] = useState(PaymentState.IDLE);
  const [txSignature, setTxSignature] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);
  const [fee, setFee] = useState(null);

  // Get supported tokens
  const supportedTokens = useMemo(() => {
    const networkKey = isTestnet ? 'devnet' : 'mainnet';
    return getSupportedSolanaTokens(networkKey);
  }, [isTestnet]);

  // Get selected token info
  const tokenInfo = useMemo(() => {
    if (selectedToken === 'SOL') {
      return {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        isNative: true
      };
    }
    const networkKey = isTestnet ? 'devnet' : 'mainnet';
    return getSolanaToken(selectedToken, networkKey);
  }, [selectedToken, isTestnet]);

  // Get balance for selected token
  const selectedBalance = useMemo(() => {
    return balances[selectedToken] || { balance: 0, formatted: '0' };
  }, [balances, selectedToken]);

  // Check if user has enough balance
  const hasEnoughBalance = useMemo(() => {
    const required = parseFloat(amount) || 0;
    const available = selectedBalance.balance || 0;
    return available >= required;
  }, [amount, selectedBalance]);

  // Estimate fee on mount
  useEffect(() => {
    const fetchFee = async () => {
      const networkKey = isTestnet ? 'devnet' : 'mainnet';
      const feeEstimate = await estimateFee(networkKey);
      setFee(feeEstimate);
    };
    fetchFee();
  }, [isTestnet]);

  // Handle payment
  const handlePayment = async () => {
    if (!connected || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isValidSolanaAddress(recipientAddress)) {
      setError('Invalid recipient address');
      return;
    }

    if (!hasEnoughBalance) {
      setError('Insufficient balance');
      return;
    }

    setPaymentState(PaymentState.CONFIRMING);
    setError(null);
    setTxSignature(null);
    setTxStatus(null);

    try {
      setPaymentState(PaymentState.SIGNING);

      let result;
      const networkKey = isTestnet ? 'devnet' : 'mainnet';

      if (selectedToken === 'SOL' || tokenInfo?.isNative) {
        // Transfer native SOL
        result = await transferSOL(
          wallet,
          recipientAddress,
          parseFloat(amount),
          networkKey
        );
      } else {
        // Transfer SPL token
        result = await transferToken(
          wallet,
          recipientAddress,
          tokenInfo.mint,
          parseFloat(amount),
          networkKey
        );
      }

      setTxSignature(result.signature);
      setPaymentState(PaymentState.WAITING);

      // Wait for finalization
      const finalStatus = await waitForFinalization(result.signature, networkKey);
      setTxStatus(finalStatus);

      if (finalStatus.success) {
        setPaymentState(PaymentState.SUCCESS);
        refreshBalances();

        if (onSuccess) {
          onSuccess({
            signature: result.signature,
            explorerUrl: result.explorerUrl,
            amount,
            token: selectedToken,
            recipient: recipientAddress
          });
        }
      } else {
        throw new Error(finalStatus.error || 'Transaction failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setPaymentState(PaymentState.ERROR);

      if (onError) {
        onError(err);
      }
    }
  };

  // Render wallet connection
  if (!connected) {
    return (
      <div className={`solana-payment-flow ${className}`}>
        <div className="payment-card">
          <h3>Pay with Solana</h3>
          <p className="text-gray-400 mb-4">
            Connect your Solana wallet to pay this bill.
          </p>

          <div className="wallet-connect-section">
            <WalletMultiButton />
          </div>

          <div className="supported-wallets mt-4">
            <p className="text-sm text-gray-500">Supported wallets:</p>
            <div className="wallet-icons flex gap-2 mt-2">
              <span className="wallet-badge">Phantom</span>
              <span className="wallet-badge">Solflare</span>
              <span className="wallet-badge">Backpack</span>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="cancel-btn mt-4"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render payment success
  if (paymentState === PaymentState.SUCCESS) {
    return (
      <div className={`solana-payment-flow ${className}`}>
        <div className="payment-card success">
          <div className="success-icon">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-green-500">Payment Successful!</h3>

          <div className="tx-details mt-4">
            <p className="text-gray-400">
              You sent <strong>{amount} {selectedToken}</strong>
            </p>

            {txSignature && (
              <a
                href={networkInfo.explorerTx(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link mt-2"
              >
                View on Solscan
              </a>
            )}
          </div>

          <button
            onClick={() => {
              setPaymentState(PaymentState.IDLE);
              if (onSuccess) onSuccess({ signature: txSignature });
            }}
            className="primary-btn mt-4"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Render main payment UI
  return (
    <div className={`solana-payment-flow ${className}`}>
      <div className="payment-card">
        <h3>Pay with Solana</h3>

        {/* Network indicator */}
        <div className={`network-badge ${isTestnet ? 'testnet' : 'mainnet'}`}>
          {isTestnet ? 'Devnet' : 'Mainnet'}
        </div>

        {/* Connected wallet */}
        <div className="wallet-info">
          <span className="label">Connected:</span>
          <span className="address">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
        </div>

        {/* Token selector */}
        <div className="token-selector mt-4">
          <label>Pay with:</label>
          <div className="token-options">
            {['SOL', 'USDC', 'USDT'].map(token => (
              <button
                key={token}
                className={`token-btn ${selectedToken === token ? 'selected' : ''}`}
                onClick={() => setSelectedToken(token)}
                disabled={paymentState !== PaymentState.IDLE}
              >
                <span className="token-symbol">{token}</span>
                <span className="token-balance">
                  {isLoadingBalance ? '...' : (balances[token]?.formatted || '0')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount display */}
        <div className="amount-display mt-4">
          <div className="amount-row">
            <span className="label">Amount:</span>
            <span className="value">{amount} {selectedToken}</span>
          </div>

          {fee && (
            <div className="fee-row">
              <span className="label">Network Fee:</span>
              <span className="value">{fee.formatted}</span>
            </div>
          )}

          <div className="total-row">
            <span className="label">Total:</span>
            <span className="value">
              {selectedToken === 'SOL'
                ? `${(parseFloat(amount) + (fee?.baseFee || 0)).toFixed(6)} SOL`
                : `${amount} ${selectedToken} + ${fee?.formatted || '0.000005 SOL'}`
              }
            </span>
          </div>
        </div>

        {/* Balance check */}
        {!hasEnoughBalance && (
          <div className="error-message mt-4">
            Insufficient {selectedToken} balance.
            You have {selectedBalance.formatted}, need {amount} {selectedToken}.
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message mt-4">
            {error}
          </div>
        )}

        {/* Payment status */}
        {paymentState !== PaymentState.IDLE && paymentState !== PaymentState.ERROR && (
          <div className="payment-status mt-4">
            <div className="status-indicator">
              {paymentState === PaymentState.CONFIRMING && (
                <>
                  <div className="spinner" />
                  <span>Preparing transaction...</span>
                </>
              )}
              {paymentState === PaymentState.SIGNING && (
                <>
                  <div className="spinner" />
                  <span>Please confirm in your wallet...</span>
                </>
              )}
              {paymentState === PaymentState.SENDING && (
                <>
                  <div className="spinner" />
                  <span>Sending transaction...</span>
                </>
              )}
              {paymentState === PaymentState.WAITING && (
                <>
                  <div className="spinner" />
                  <span>Waiting for confirmation...</span>
                  {txSignature && (
                    <a
                      href={networkInfo.explorerTx(txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      View on Solscan
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="action-buttons mt-4">
          {paymentState === PaymentState.IDLE && (
            <>
              <button
                onClick={handlePayment}
                disabled={!hasEnoughBalance}
                className="primary-btn"
              >
                Pay {amount} {selectedToken}
              </button>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="secondary-btn"
                >
                  Cancel
                </button>
              )}
            </>
          )}

          {paymentState === PaymentState.ERROR && (
            <>
              <button
                onClick={() => {
                  setPaymentState(PaymentState.IDLE);
                  setError(null);
                }}
                className="primary-btn"
              >
                Try Again
              </button>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="secondary-btn"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        {/* Recipient info */}
        <div className="recipient-info mt-4">
          <span className="label">Recipient:</span>
          <span className="address">
            {recipientAddress?.slice(0, 8)}...{recipientAddress?.slice(-6)}
          </span>
          <a
            href={networkInfo.explorerAddress(recipientAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="view-link"
          >
            View
          </a>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .solana-payment-flow {
          max-width: 400px;
          margin: 0 auto;
        }

        .payment-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #2d2d44;
          border-radius: 16px;
          padding: 24px;
          position: relative;
        }

        .payment-card.success {
          text-align: center;
        }

        .success-icon {
          margin: 0 auto 16px;
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #fff;
        }

        .network-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .network-badge.testnet {
          background: #fbbf24;
          color: #000;
        }

        .network-badge.mainnet {
          background: #10b981;
          color: #fff;
        }

        .wallet-info {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 14px;
        }

        .label {
          color: #9ca3af;
        }

        .address {
          color: #fff;
          font-family: monospace;
        }

        .token-selector label {
          display: block;
          margin-bottom: 8px;
          color: #9ca3af;
          font-size: 14px;
        }

        .token-options {
          display: flex;
          gap: 8px;
        }

        .token-btn {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .token-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .token-btn.selected {
          border-color: #9945ff;
          background: rgba(153, 69, 255, 0.1);
        }

        .token-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .token-symbol {
          display: block;
          font-weight: 600;
          color: #fff;
          font-size: 16px;
        }

        .token-balance {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .amount-display {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
        }

        .amount-row, .fee-row, .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .amount-row .value {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .fee-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 14px;
        }

        .total-row {
          font-weight: 600;
        }

        .total-row .value {
          color: #9945ff;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .payment-status {
          text-align: center;
          padding: 16px;
        }

        .status-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(153, 69, 255, 0.3);
          border-top-color: #9945ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .explorer-link {
          color: #9945ff;
          text-decoration: none;
          font-size: 14px;
        }

        .explorer-link:hover {
          text-decoration: underline;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #9945ff 0%, #14f195 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .primary-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-btn, .cancel-btn {
          width: 100%;
          padding: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #9ca3af;
          font-weight: 500;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover, .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .recipient-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .recipient-info .address {
          font-family: monospace;
          color: #9ca3af;
        }

        .view-link {
          color: #9945ff;
          text-decoration: none;
          margin-left: auto;
        }

        .wallet-connect-section {
          display: flex;
          justify-content: center;
          margin: 24px 0;
        }

        .supported-wallets {
          text-align: center;
        }

        .wallet-icons {
          justify-content: center;
        }

        .wallet-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
