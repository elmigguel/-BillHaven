/**
 * Lightning Payment Flow Component
 *
 * Complete payment UI for Bitcoin Lightning payments using hold invoices.
 *
 * Features:
 * - QR code display for BOLT11 invoice
 * - Real-time payment status
 * - Countdown timer for invoice expiry
 * - WebSocket/polling updates
 * - Mobile wallet deep links
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  createHoldInvoice,
  getInvoiceStatus,
  waitForPayment,
  estimateFee,
  validateAmount,
  getInvoiceQRData,
  isLightningAvailable,
  usdToSats,
  satsToUsd,
  formatSats
} from '../../services/lightningPayment';
import {
  InvoiceState,
  getTimeUntilExpiry,
  formatTimeRemaining
} from '../../config/lightningNetworks';

// Payment states
const PaymentState = {
  IDLE: 'idle',
  CREATING: 'creating',
  WAITING: 'waiting',
  HELD: 'held',
  SUCCESS: 'success',
  EXPIRED: 'expired',
  ERROR: 'error'
};

/**
 * Lightning Payment Flow Component
 */
export default function LightningPaymentFlow({
  bill,
  amountUSD,
  btcPrice = 95000,
  onSuccess,
  onError,
  onCancel,
  isTestnet = false,
  className = ''
}) {
  // State
  const [paymentState, setPaymentState] = useState(PaymentState.IDLE);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [copied, setCopied] = useState(false);

  // Refs
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Calculate amount in sats
  const amountSats = usdToSats(amountUSD, btcPrice);
  const fee = estimateFee(amountSats);

  // Check if Lightning is available
  const lightningAvailable = isLightningAvailable(isTestnet);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (invoice?.expiresAt && paymentState === PaymentState.WAITING) {
      const updateTimer = () => {
        const remaining = getTimeUntilExpiry({ expiresAt: invoice.expiresAt });
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setPaymentState(PaymentState.EXPIRED);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [invoice, paymentState]);

  // Create invoice and start monitoring
  const createAndMonitorInvoice = async () => {
    setPaymentState(PaymentState.CREATING);
    setError(null);

    try {
      // Validate amount
      const validation = validateAmount(amountSats);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create hold invoice
      const result = await createHoldInvoice(amountSats, bill.id, {
        description: `BillHaven - ${bill.title || `Bill #${bill.id}`}`,
        expiryMinutes: 60,
        isTestnet
      });

      setInvoice(result.invoice);
      setPaymentState(PaymentState.WAITING);

      // Start polling for payment
      startPolling(result.invoice.id);

    } catch (err) {
      console.error('Error creating Lightning invoice:', err);
      setError(err.message);
      setPaymentState(PaymentState.ERROR);

      if (onError) onError(err);
    }
  };

  // Poll for payment status
  const startPolling = useCallback((invoiceId) => {
    const poll = async () => {
      try {
        const status = await getInvoiceStatus(invoiceId, isTestnet);

        if (status.status === InvoiceState.HELD) {
          // Payment received and held in escrow
          setPaymentState(PaymentState.HELD);
          clearInterval(pollIntervalRef.current);

          if (onSuccess) {
            onSuccess({
              invoiceId,
              amountSats,
              amountUSD,
              status: 'held'
            });
          }
        } else if (status.status === InvoiceState.SETTLED) {
          setPaymentState(PaymentState.SUCCESS);
          clearInterval(pollIntervalRef.current);

          if (onSuccess) {
            onSuccess({
              invoiceId,
              amountSats,
              amountUSD,
              status: 'settled'
            });
          }
        } else if (status.status === InvoiceState.EXPIRED ||
                   status.status === InvoiceState.CANCELLED) {
          setPaymentState(PaymentState.EXPIRED);
          clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error('Error polling invoice status:', err);
      }
    };

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(poll, 3000);
    poll(); // Initial poll
  }, [isTestnet, onSuccess, amountSats, amountUSD]);

  // Copy invoice to clipboard
  const copyInvoice = async () => {
    if (invoice?.bolt11) {
      await navigator.clipboard.writeText(invoice.bolt11);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Open in wallet (mobile deep link)
  const openInWallet = () => {
    if (invoice?.bolt11) {
      window.location.href = `lightning:${invoice.bolt11}`;
    }
  };

  // Render not available state
  if (!lightningAvailable) {
    return (
      <div className={`lightning-payment-flow ${className}`}>
        <div className="payment-card">
          <h3>Lightning Not Available</h3>
          <p className="text-gray-400">
            Lightning Network payments are not configured.
            Please contact support or use another payment method.
          </p>

          {onCancel && (
            <button onClick={onCancel} className="secondary-btn mt-4">
              Choose Another Method
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render payment held/success state
  if (paymentState === PaymentState.HELD || paymentState === PaymentState.SUCCESS) {
    return (
      <div className={`lightning-payment-flow ${className}`}>
        <div className="payment-card success">
          <div className="success-icon">
            <svg className="w-16 h-16 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h3 className="text-orange-500">
            {paymentState === PaymentState.SUCCESS ? 'Payment Complete!' : 'Payment Received!'}
          </h3>

          <p className="text-gray-400 mt-2">
            {paymentState === PaymentState.HELD
              ? 'Your payment is being held in escrow until the transaction is complete.'
              : 'Your Lightning payment has been confirmed.'}
          </p>

          <div className="amount-display mt-4">
            <div className="amount-btc">{formatSats(amountSats)}</div>
            <div className="amount-usd">≈ ${amountUSD.toFixed(2)} USD</div>
          </div>

          <button
            onClick={() => onSuccess && onSuccess({ invoiceId: invoice?.id, status: paymentState })}
            className="primary-btn mt-4"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Render expired state
  if (paymentState === PaymentState.EXPIRED) {
    return (
      <div className={`lightning-payment-flow ${className}`}>
        <div className="payment-card expired">
          <div className="expired-icon">
            <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-yellow-500">Invoice Expired</h3>
          <p className="text-gray-400 mt-2">
            The payment window has expired. Please create a new invoice.
          </p>

          <div className="action-buttons mt-4">
            <button
              onClick={() => {
                setPaymentState(PaymentState.IDLE);
                setInvoice(null);
              }}
              className="primary-btn"
            >
              Create New Invoice
            </button>

            {onCancel && (
              <button onClick={onCancel} className="secondary-btn">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render idle/creating state
  if (paymentState === PaymentState.IDLE || paymentState === PaymentState.CREATING) {
    return (
      <div className={`lightning-payment-flow ${className}`}>
        <div className="payment-card">
          <div className="lightning-header">
            <svg className="lightning-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3>Pay with Lightning</h3>
          </div>

          <p className="text-gray-400 mb-4">
            Fast, instant Bitcoin payments with near-zero fees.
          </p>

          {/* Amount preview */}
          <div className="amount-preview">
            <div className="preview-row">
              <span className="label">Amount:</span>
              <span className="value">{formatSats(amountSats)}</span>
            </div>
            <div className="preview-row">
              <span className="label">USD Value:</span>
              <span className="value">${amountUSD.toFixed(2)}</span>
            </div>
            <div className="preview-row fee">
              <span className="label">Network Fee:</span>
              <span className="value">{fee.feeFormatted} ({fee.feePercent}%)</span>
            </div>
          </div>

          {/* Network badge */}
          <div className={`network-badge ${isTestnet ? 'testnet' : 'mainnet'}`}>
            {isTestnet ? 'Testnet' : 'Mainnet'}
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message mt-4">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="action-buttons mt-4">
            <button
              onClick={createAndMonitorInvoice}
              disabled={paymentState === PaymentState.CREATING}
              className="primary-btn lightning-btn"
            >
              {paymentState === PaymentState.CREATING ? (
                <>
                  <div className="spinner-small" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Invoice
                </>
              )}
            </button>

            {onCancel && (
              <button onClick={onCancel} className="secondary-btn">
                Cancel
              </button>
            )}
          </div>

          {/* Info */}
          <div className="info-text mt-4">
            <p>Supported wallets: Phoenix, Muun, BlueWallet, Zeus, Breez</p>
          </div>
        </div>
      </div>
    );
  }

  // Render waiting for payment state (with QR code)
  return (
    <div className={`lightning-payment-flow ${className}`}>
      <div className="payment-card waiting">
        <div className="lightning-header">
          <svg className="lightning-icon animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3>Waiting for Payment</h3>
        </div>

        {/* Timer */}
        <div className="timer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTimeRemaining(timeRemaining)}</span>
        </div>

        {/* QR Code */}
        <div className="qr-container">
          {invoice?.bolt11 && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getInvoiceQRData(invoice.bolt11))}`}
              alt="Lightning Invoice QR Code"
              className="qr-code"
            />
          )}
        </div>

        {/* Amount */}
        <div className="amount-display">
          <div className="amount-btc">{formatSats(amountSats)}</div>
          <div className="amount-usd">≈ ${amountUSD.toFixed(2)} USD</div>
        </div>

        {/* Invoice actions */}
        <div className="invoice-actions">
          <button onClick={copyInvoice} className="action-btn">
            {copied ? 'Copied!' : 'Copy Invoice'}
          </button>
          <button onClick={openInWallet} className="action-btn primary">
            Open in Wallet
          </button>
        </div>

        {/* Invoice text (truncated) */}
        <div className="invoice-text">
          <code>{invoice?.bolt11?.slice(0, 30)}...{invoice?.bolt11?.slice(-10)}</code>
        </div>

        {/* Status indicator */}
        <div className="status-indicator">
          <div className="spinner" />
          <span>Scanning for payment...</span>
        </div>

        {/* Cancel */}
        {onCancel && (
          <button onClick={onCancel} className="cancel-link mt-4">
            Cancel Payment
          </button>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .lightning-payment-flow {
          max-width: 400px;
          margin: 0 auto;
        }

        .payment-card {
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
          border: 1px solid #f7931a33;
          border-radius: 16px;
          padding: 24px;
          position: relative;
        }

        .payment-card.success {
          text-align: center;
          border-color: #f7931a;
        }

        .payment-card.waiting {
          text-align: center;
        }

        .lightning-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .lightning-icon {
          width: 32px;
          height: 32px;
          color: #f7931a;
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .success-icon, .expired-icon {
          margin: 0 auto 16px;
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
          background: #f7931a;
          color: #fff;
        }

        .amount-preview {
          background: rgba(247, 147, 26, 0.1);
          border: 1px solid rgba(247, 147, 26, 0.2);
          border-radius: 12px;
          padding: 16px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .preview-row.fee {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 14px;
          color: #9ca3af;
        }

        .label {
          color: #9ca3af;
        }

        .value {
          color: #fff;
          font-weight: 500;
        }

        .timer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 8px 16px;
          border-radius: 20px;
          color: #fbbf24;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .qr-container {
          background: #fff;
          padding: 16px;
          border-radius: 12px;
          display: inline-block;
          margin: 16px 0;
        }

        .qr-code {
          width: 200px;
          height: 200px;
          display: block;
        }

        .amount-display {
          margin: 16px 0;
        }

        .amount-btc {
          font-size: 24px;
          font-weight: 700;
          color: #f7931a;
        }

        .amount-usd {
          font-size: 14px;
          color: #9ca3af;
        }

        .invoice-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin: 16px 0;
        }

        .action-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .action-btn.primary {
          background: #f7931a;
          border-color: #f7931a;
        }

        .action-btn.primary:hover {
          background: #e8850a;
        }

        .invoice-text {
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 12px;
          border-radius: 8px;
          margin: 16px 0;
        }

        .invoice-text code {
          font-size: 12px;
          color: #9ca3af;
          word-break: break-all;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #9ca3af;
          margin-top: 16px;
        }

        .spinner, .spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(247, 147, 26, 0.3);
          border-top-color: #f7931a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .primary-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #f7931a 0%, #ff9500 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .primary-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-btn {
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

        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .cancel-link {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .cancel-link:hover {
          color: #fff;
        }

        .info-text {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
