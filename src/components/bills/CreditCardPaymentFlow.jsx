/**
 * CreditCardPaymentFlow Component
 *
 * Complete credit card payment UI with Stripe Elements and 3D Secure.
 *
 * Features:
 * - Stripe Elements for secure card input
 * - 3D Secure 2.0 authentication
 * - Real-time validation
 * - Escrow flow (authorize -> hold -> capture/cancel)
 * - Chargeback risk information
 *
 * NO TRANSACTION LIMITS - Security is handled via 3D Secure verification.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getStripe,
  getElementsAppearance,
  createPaymentIntent,
  confirmCardPayment,
  getPaymentStatus,
  formatAmount,
  calculateFees,
  formatCardError,
  getChargebackRiskInfo,
  PaymentStatus,
  ThreeDSResult
} from '../../services/creditCardPayment';
import { HoldPeriodDisplay } from '../user/TrustBadge';

// Styles
const styles = {
  container: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #333',
    maxWidth: '480px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  cardIcon: {
    fontSize: '32px'
  },
  title: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '600',
    margin: 0
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    margin: '4px 0 0 0'
  },
  amountSection: {
    background: '#252540',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  amountLabel: {
    color: '#888',
    fontSize: '14px'
  },
  amountValue: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  amountTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #333',
    marginTop: '8px'
  },
  totalLabel: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600'
  },
  totalValue: {
    color: '#4ade80',
    fontSize: '24px',
    fontWeight: '700'
  },
  cardSection: {
    marginBottom: '24px'
  },
  cardLabel: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block'
  },
  cardElement: {
    background: '#252540',
    borderRadius: '8px',
    padding: '12px 16px',
    border: '1px solid #333'
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    padding: '8px 12px',
    background: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(74, 222, 128, 0.3)'
  },
  securityIcon: {
    fontSize: '16px'
  },
  securityText: {
    color: '#4ade80',
    fontSize: '12px'
  },
  holdPeriodSection: {
    marginBottom: '24px'
  },
  holdTitle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px'
  },
  warningBox: {
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px'
  },
  warningTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  warningText: {
    color: '#fbbf24',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: 0
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff'
  },
  buttonDisabled: {
    background: '#333',
    color: '#666',
    cursor: 'not-allowed'
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    margin: 0
  },
  successContainer: {
    textAlign: 'center',
    padding: '32px'
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  successTitle: {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  successSubtitle: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '24px'
  },
  liabilityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(74, 222, 128, 0.1)',
    borderRadius: '20px',
    border: '1px solid rgba(74, 222, 128, 0.3)'
  },
  liabilityText: {
    color: '#4ade80',
    fontSize: '14px',
    fontWeight: '500'
  },
  processingOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  processingBox: {
    background: '#1a1a2e',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '300px'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #333',
    borderTop: '4px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  processingText: {
    color: '#fff',
    fontSize: '16px',
    margin: 0
  }
};

// Add CSS animation
const spinnerAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

/**
 * CreditCardPaymentFlow Component
 */
export default function CreditCardPaymentFlow({
  bill,
  amountCents,
  currency = 'USD',
  trustProfile,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}) {
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const [status, setStatus] = useState('idle'); // idle, loading, ready, processing, success, error
  const [error, setError] = useState(null);
  const [threeDSResult, setThreeDSResult] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Calculate fees
  const fees = calculateFees(amountCents);

  // Initialize Stripe
  useEffect(() => {
    async function initStripe() {
      try {
        setStatus('loading');
        const stripeInstance = await getStripe();
        setStripe(stripeInstance);
      } catch (err) {
        setError('Failed to load payment system');
        setStatus('error');
      }
    }
    initStripe();
  }, []);

  // Create payment intent when stripe is ready
  useEffect(() => {
    async function createIntent() {
      if (!stripe || clientSecret) return;

      try {
        const result = await createPaymentIntent(
          amountCents,
          currency,
          bill.id,
          {
            description: `Payment for Bill #${bill.id}`,
            metadata: {
              billTitle: bill.title,
              payerEmail: bill.payerEmail
            }
          }
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        setClientSecret(result.paymentIntent.clientSecret);
        setPaymentIntentId(result.paymentIntent.id);

        // Create Elements
        const elementsInstance = stripe.elements({
          clientSecret: result.paymentIntent.clientSecret,
          appearance: getElementsAppearance()
        });
        setElements(elementsInstance);
        setStatus('ready');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    }
    createIntent();
  }, [stripe, amountCents, currency, bill, clientSecret]);

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setStatus('processing');
    setError(null);

    try {
      const result = await confirmCardPayment(
        stripe,
        elements,
        clientSecret,
        {
          billingDetails: {
            email: bill.payerEmail,
            name: bill.payerName
          },
          returnUrl: `${window.location.origin}/bills/${bill.id}?payment=complete`
        }
      );

      if (!result.success) {
        throw new Error(formatCardError(result));
      }

      setThreeDSResult(result.paymentIntent.threeDSResult);
      setStatus('success');

      // Notify parent
      onPaymentSuccess?.({
        paymentIntentId: result.paymentIntent.id,
        amount: result.paymentIntent.amount,
        currency: result.paymentIntent.currency,
        status: result.paymentIntent.status,
        threeDSResult: result.paymentIntent.threeDSResult,
        liabilityShift: result.paymentIntent.liabilityShift
      });
    } catch (err) {
      setError(err.message);
      setStatus('error');
      onPaymentError?.(err);
    }
  };

  // Handle card element changes
  const handleCardChange = useCallback((event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  }, []);

  // Render success state
  if (status === 'success') {
    const hasLiabilityShift = threeDSResult === ThreeDSResult.AUTHENTICATED;

    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Payment Authorized!</h2>
          <p style={styles.successSubtitle}>
            {formatAmount(amountCents, currency)} has been authorized for escrow.
          </p>

          {hasLiabilityShift && (
            <div style={styles.liabilityBadge}>
              <span>🛡️</span>
              <span style={styles.liabilityText}>
                Protected by 3D Secure
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chargeback risk info
  const riskInfo = getChargebackRiskInfo();

  return (
    <>
      {/* Add animation styles */}
      <style>{spinnerAnimation}</style>

      {/* Processing overlay */}
      {status === 'processing' && (
        <div style={styles.processingOverlay}>
          <div style={styles.processingBox}>
            <div style={styles.spinner} />
            <p style={styles.processingText}>Processing payment...</p>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.cardIcon}>💳</span>
          <div>
            <h2 style={styles.title}>Card Payment</h2>
            <p style={styles.subtitle}>Secure payment with 3D Secure</p>
          </div>
        </div>

        {/* Amount breakdown */}
        <div style={styles.amountSection}>
          <div style={styles.amountRow}>
            <span style={styles.amountLabel}>Subtotal</span>
            <span style={styles.amountValue}>{formatAmount(fees.subtotal, currency)}</span>
          </div>
          <div style={styles.amountRow}>
            <span style={styles.amountLabel}>Processing Fee</span>
            <span style={styles.amountValue}>{formatAmount(fees.stripeFee, currency)}</span>
          </div>
          <div style={styles.amountRow}>
            <span style={styles.amountLabel}>Platform Fee (1%)</span>
            <span style={styles.amountValue}>{formatAmount(fees.platformFee, currency)}</span>
          </div>
          <div style={styles.amountTotal}>
            <span style={styles.totalLabel}>Total</span>
            <span style={styles.totalValue}>{formatAmount(amountCents, currency)}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorMessage}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* Card input form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.cardSection}>
            <label style={styles.cardLabel}>Card Details</label>
            <div style={styles.cardElement} id="card-element">
              {elements && (
                <CardElement
                  elements={elements}
                  onChange={handleCardChange}
                />
              )}
            </div>

            <div style={styles.securityBadge}>
              <span style={styles.securityIcon}>🔒</span>
              <span style={styles.securityText}>
                Secured with 256-bit encryption & 3D Secure
              </span>
            </div>
          </div>

          {/* Hold period info */}
          <div style={styles.holdPeriodSection}>
            <div style={styles.holdTitle}>Escrow Hold Period:</div>
            <HoldPeriodDisplay
              trustProfile={trustProfile}
              paymentMethod="CREDIT_CARD"
            />
          </div>

          {/* Chargeback warning */}
          <div style={styles.warningBox}>
            <div style={styles.warningTitle}>
              <span>⚠️</span>
              <span>Important Information</span>
            </div>
            <p style={styles.warningText}>
              {riskInfo.warning} With 3D Secure authentication, you're protected against fraud disputes.
              Funds will be held in escrow until the transaction is verified.
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={{
              ...styles.button,
              ...(status === 'ready' && cardComplete ? styles.buttonPrimary : styles.buttonDisabled)
            }}
            disabled={status !== 'ready' || !cardComplete}
          >
            {status === 'loading' && 'Loading...'}
            {status === 'ready' && !cardComplete && 'Enter card details'}
            {status === 'ready' && cardComplete && (
              <>
                <span>🔐</span>
                <span>Pay {formatAmount(amountCents, currency)}</span>
              </>
            )}
            {status === 'error' && 'Try Again'}
          </button>
        </form>

        {/* Cancel link */}
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '16px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            Cancel and choose different payment method
          </button>
        )}
      </div>
    </>
  );
}

/**
 * CardElement wrapper component
 * Renders the Stripe Payment Element
 */
function CardElement({ elements, onChange }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!elements || mounted) return;

    const paymentElement = elements.create('payment', {
      layout: 'tabs',
      defaultValues: {
        billingDetails: {
          address: {
            country: 'US'
          }
        }
      }
    });

    paymentElement.mount('#card-element');
    paymentElement.on('change', onChange);
    setMounted(true);

    return () => {
      paymentElement.unmount();
    };
  }, [elements, mounted, onChange]);

  return null;
}

/**
 * CardPaymentButton Component
 * Compact button to initiate card payment
 */
export function CardPaymentButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        background: disabled ? '#333' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        border: 'none',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '24px' }}>💳</span>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
          Credit / Debit Card
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
          Visa, Mastercard, Amex • 3D Secure
        </div>
      </div>
      <span style={{ color: '#fff', fontSize: '20px' }}>→</span>
    </button>
  );
}
