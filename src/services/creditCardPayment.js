/**
 * Credit Card Payment Service
 *
 * Handles credit card payments with 3D Secure 2.0 verification.
 * Uses Stripe for payment processing with strong customer authentication (SCA).
 *
 * Security Features:
 * - 3D Secure 2.0 (3DS2) for liability shift
 * - SCA compliance (EU PSD2)
 * - Fraud detection via Stripe Radar
 * - No card data stored on our servers
 *
 * IMPORTANT: Chargeback window is 120-540 days for credit cards.
 * Hold periods are enforced via the Trust System.
 *
 * NO TRANSACTION LIMITS - Security is handled via verification.
 */

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  // Stripe Elements appearance
  appearance: {
    theme: 'night',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#1a1a2e',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    },
    rules: {
      '.Input': {
        backgroundColor: '#252540',
        border: '1px solid #333'
      },
      '.Input:focus': {
        border: '1px solid #6366f1'
      }
    }
  }
};

// Payment status enum
export const PaymentStatus = {
  PENDING: 'pending',
  REQUIRES_ACTION: 'requires_action',      // 3DS verification needed
  REQUIRES_CONFIRMATION: 'requires_confirmation',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REQUIRES_CAPTURE: 'requires_capture'     // For manual capture (escrow)
};

// 3DS result codes
export const ThreeDSResult = {
  AUTHENTICATED: 'authenticated',
  ATTEMPTED: 'attempted',
  NOT_SUPPORTED: 'not_supported',
  FAILED: 'failed',
  CHALLENGE: 'challenge_required'
};

// Card brands we accept
export const AcceptedCards = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover'
};

// Stripe instance (lazy loaded)
let stripePromise = null;

/**
 * Get Stripe instance
 */
export async function getStripe() {
  if (!stripePromise) {
    const { loadStripe } = await import('@stripe/stripe-js');
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
}

/**
 * Get Stripe Elements appearance config
 */
export function getElementsAppearance() {
  return STRIPE_CONFIG.appearance;
}

/**
 * Create a payment intent for escrow
 *
 * Creates a PaymentIntent with manual capture mode for escrow.
 * Funds are authorized but not captured until escrow is released.
 *
 * NO LIMITS - Amount is unrestricted for verified payments
 *
 * @param {number} amountCents - Amount in cents (e.g., 10000 = $100.00)
 * @param {string} currency - Currency code (e.g., 'usd', 'eur')
 * @param {string} billId - BillHaven bill ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} PaymentIntent details
 */
export async function createPaymentIntent(amountCents, currency, billId, options = {}) {
  const {
    customerEmail,
    customerId,
    description = `BillHaven Payment - Bill #${billId}`,
    metadata = {}
  } = options;

  try {
    // Call our backend to create the PaymentIntent
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: currency.toLowerCase(),
        billId,
        customerEmail,
        customerId,
        description,
        metadata: {
          ...metadata,
          billId,
          platform: 'billhaven'
        },
        // Manual capture for escrow
        captureMethod: 'manual',
        // 3D Secure only when needed (risk-based authentication)
        // 'automatic' = only trigger 3DS when required by bank or for risky transactions
        // This keeps checkout smooth for trusted users while protecting against fraud
        paymentMethodOptions: {
          card: {
            request_three_d_secure: 'automatic'
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    const data = await response.json();

    return {
      success: true,
      paymentIntent: {
        id: data.id,
        clientSecret: data.client_secret,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        requiresAction: data.status === 'requires_action',
        captureMethod: data.capture_method
      }
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Confirm card payment with 3D Secure
 *
 * @param {Object} stripe - Stripe instance
 * @param {Object} elements - Stripe Elements
 * @param {string} clientSecret - PaymentIntent client secret
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Payment result
 */
export async function confirmCardPayment(stripe, elements, clientSecret, options = {}) {
  const {
    billingDetails = {},
    returnUrl = window.location.href
  } = options;

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: billingDetails
        }
      },
      redirect: 'if_required'
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        declineCode: error.decline_code
      };
    }

    // Check 3DS result
    const threeDSResult = getThreeDSResult(paymentIntent);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        threeDSResult,
        // Important: Check if we have liability shift
        liabilityShift: threeDSResult === ThreeDSResult.AUTHENTICATED
      }
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get 3D Secure result from PaymentIntent
 */
function getThreeDSResult(paymentIntent) {
  const threeDSecure = paymentIntent.payment_method_options?.card?.three_d_secure;

  if (!threeDSecure) {
    return ThreeDSResult.NOT_SUPPORTED;
  }

  switch (threeDSecure.authentication_flow) {
    case 'challenge':
      if (threeDSecure.result === 'authenticated') {
        return ThreeDSResult.AUTHENTICATED;
      }
      return ThreeDSResult.FAILED;
    case 'frictionless':
      if (threeDSecure.result === 'authenticated') {
        return ThreeDSResult.AUTHENTICATED;
      }
      if (threeDSecure.result === 'attempted') {
        return ThreeDSResult.ATTEMPTED;
      }
      return ThreeDSResult.NOT_SUPPORTED;
    default:
      return ThreeDSResult.NOT_SUPPORTED;
  }
}

/**
 * Capture an authorized payment (release escrow)
 *
 * @param {string} paymentIntentId - PaymentIntent ID
 * @returns {Promise<Object>} Capture result
 */
export async function capturePayment(paymentIntentId) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ paymentIntentId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to capture payment');
    }

    const data = await response.json();

    return {
      success: true,
      paymentIntent: {
        id: data.id,
        status: data.status,
        amountCaptured: data.amount_received
      }
    };
  } catch (error) {
    console.error('Error capturing payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cancel/refund an authorized payment (escrow refund)
 *
 * @param {string} paymentIntentId - PaymentIntent ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancel result
 */
export async function cancelPayment(paymentIntentId, reason = 'requested_by_customer') {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        paymentIntentId,
        cancellationReason: reason
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel payment');
    }

    const data = await response.json();

    return {
      success: true,
      paymentIntent: {
        id: data.id,
        status: data.status
      }
    };
  } catch (error) {
    console.error('Error canceling payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get payment status
 *
 * @param {string} paymentIntentId - PaymentIntent ID
 * @returns {Promise<Object>} Payment status
 */
export async function getPaymentStatus(paymentIntentId) {
  try {
    const stripe = await getStripe();
    const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentId);

    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      capturedAmount: paymentIntent.amount_received,
      lastPaymentError: paymentIntent.last_payment_error?.message
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format card error for display
 */
export function formatCardError(error) {
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try a different card.',
    'insufficient_funds': 'Insufficient funds. Please try a different card.',
    'expired_card': 'Your card has expired. Please use a different card.',
    'incorrect_cvc': 'Incorrect CVC code. Please check and try again.',
    'processing_error': 'An error occurred while processing. Please try again.',
    'incorrect_number': 'Invalid card number. Please check and try again.',
    'authentication_required': '3D Secure authentication is required.',
    'card_not_supported': 'This card type is not supported.',
    'currency_not_supported': 'This currency is not supported by your card.'
  };

  return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
}

/**
 * Calculate platform fee for card payments
 * Stripe charges 2.9% + $0.30 for US cards
 *
 * @param {number} amountCents - Amount in cents
 * @returns {Object} Fee breakdown
 */
export function calculateFees(amountCents) {
  // Stripe fee: 2.9% + $0.30
  const stripePercentage = 0.029;
  const stripeFixed = 30; // cents

  const stripeFee = Math.ceil(amountCents * stripePercentage) + stripeFixed;

  // Platform fee: 1%
  const platformFee = Math.ceil(amountCents * 0.01);

  const totalFees = stripeFee + platformFee;
  const netAmount = amountCents - totalFees;

  return {
    subtotal: amountCents,
    stripeFee,
    platformFee,
    totalFees,
    netAmount,
    feePercentage: ((totalFees / amountCents) * 100).toFixed(2)
  };
}

/**
 * Format amount for display
 */
export function formatAmount(amountCents, currency = 'USD') {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Check if card payment is available
 */
export function isCardPaymentAvailable() {
  return !!STRIPE_CONFIG.publishableKey;
}

/**
 * Validate card number format (basic check)
 */
export function validateCardNumber(number) {
  // Remove spaces and dashes
  const cleaned = number.replace(/[\s-]/g, '');

  // Check length (13-19 digits for most cards)
  if (!/^\d{13,19}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid card number length' };
  }

  // Luhn algorithm check
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number' };
  }

  // Detect card brand
  let brand = 'unknown';
  if (/^4/.test(cleaned)) brand = AcceptedCards.VISA;
  else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) brand = AcceptedCards.MASTERCARD;
  else if (/^3[47]/.test(cleaned)) brand = AcceptedCards.AMEX;
  else if (/^6(?:011|5)/.test(cleaned)) brand = AcceptedCards.DISCOVER;

  return { valid: true, brand };
}

/**
 * Get chargeback risk info
 *
 * Credit cards have significant chargeback windows.
 * This info is displayed to sellers.
 */
export function getChargebackRiskInfo() {
  return {
    warning: 'Credit card payments can be disputed for up to 120-540 days.',
    recommendation: 'Hold periods are enforced based on your trust level.',
    minimumHold: {
      newUser: '14 days',
      verified: '7 days',
      trusted: '3 days',
      powerUser: '24 hours'
    },
    liabilityShift: 'With 3D Secure authentication, liability shifts to the card issuer for fraud disputes.',
    tips: [
      'Always wait for payment verification before releasing goods',
      'Keep proof of delivery/service completion',
      'Communicate through the platform for dispute protection',
      'Higher trust levels = shorter hold periods'
    ]
  };
}

export default {
  getStripe,
  getElementsAppearance,
  createPaymentIntent,
  confirmCardPayment,
  capturePayment,
  cancelPayment,
  getPaymentStatus,
  formatCardError,
  calculateFees,
  formatAmount,
  isCardPaymentAvailable,
  validateCardNumber,
  getChargebackRiskInfo,
  PaymentStatus,
  ThreeDSResult,
  AcceptedCards
};
