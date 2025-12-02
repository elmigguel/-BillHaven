/**
 * Lightning Network Payment Service
 *
 * Handles Bitcoin Lightning payments for BillHaven escrow platform.
 * Uses hold invoices (HTLC) for escrow functionality.
 *
 * Provider: OpenNode (configurable)
 *
 * Features:
 * - BOLT11 invoice generation
 * - Hold invoices for true escrow (funds locked until settled/cancelled)
 * - Payment verification
 * - Webhook handling
 * - Invoice status monitoring
 */

import {
  LIGHTNING_CONFIG,
  InvoiceState,
  getLightningConfig,
  satsToBTC,
  btcToSats,
  formatSats,
  isValidBolt11,
  getTimeUntilExpiry,
  formatTimeRemaining
} from '../config/lightningNetworks';

// API client
class LightningClient {
  constructor(isTestnet = false) {
    const config = getLightningConfig(isTestnet);
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.isTestnet = isTestnet;
  }

  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }
}

// Client instances
let mainnetClient = null;
let testnetClient = null;

function getClient(isTestnet = false) {
  if (isTestnet) {
    if (!testnetClient) testnetClient = new LightningClient(true);
    return testnetClient;
  }
  if (!mainnetClient) mainnetClient = new LightningClient(false);
  return mainnetClient;
}

/**
 * Create a standard Lightning invoice
 *
 * @param {number} amountSats - Amount in satoshis
 * @param {string} billId - BillHaven bill ID for reference
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Invoice details
 */
export async function createInvoice(amountSats, billId, options = {}) {
  const {
    description = `BillHaven Payment - Bill #${billId}`,
    expiryMinutes = 60,
    isTestnet = false
  } = options;

  const client = getClient(isTestnet);

  try {
    const response = await client.request('/charges', {
      method: 'POST',
      body: JSON.stringify({
        amount: amountSats,
        description,
        ttl: expiryMinutes * 60, // Convert to seconds
        callback_url: `${import.meta.env.VITE_API_URL || ''}/api/lightning-webhook`,
        success_url: `${window.location.origin}/bills/${billId}?status=paid`,
        metadata: {
          billId,
          type: 'standard'
        }
      })
    });

    return {
      success: true,
      invoice: {
        id: response.data.id,
        bolt11: response.data.lightning_invoice.payreq,
        amountSats: response.data.amount,
        amountBTC: satsToBTC(response.data.amount),
        description: response.data.description,
        expiresAt: response.data.expires_at,
        status: InvoiceState.CREATED,
        qrCode: `lightning:${response.data.lightning_invoice.payreq}`,
        checkoutUrl: response.data.hosted_checkout_url
      }
    };
  } catch (error) {
    console.error('Error creating Lightning invoice:', error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
}

/**
 * Create a hold invoice for escrow
 *
 * Hold invoices lock funds without settling until explicitly released.
 * Perfect for escrow: buyer pays, funds are held, then either:
 * - Settled: Released to seller
 * - Cancelled: Returned to buyer
 *
 * @param {number} amountSats - Amount in satoshis
 * @param {string} billId - BillHaven bill ID for reference
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Hold invoice details
 */
export async function createHoldInvoice(amountSats, billId, options = {}) {
  const {
    description = `BillHaven Escrow - Bill #${billId}`,
    expiryMinutes = 60,
    isTestnet = false
  } = options;

  const client = getClient(isTestnet);

  try {
    // OpenNode uses "hold" type for hold invoices
    const response = await client.request('/charges', {
      method: 'POST',
      body: JSON.stringify({
        amount: amountSats,
        description,
        ttl: expiryMinutes * 60,
        type: 'hold', // Critical: creates hold invoice
        callback_url: `${import.meta.env.VITE_API_URL || ''}/api/lightning-webhook`,
        metadata: {
          billId,
          type: 'escrow',
          holdInvoice: true
        }
      })
    });

    return {
      success: true,
      invoice: {
        id: response.data.id,
        bolt11: response.data.lightning_invoice?.payreq || response.data.payreq,
        amountSats: response.data.amount,
        amountBTC: satsToBTC(response.data.amount),
        description: response.data.description,
        expiresAt: response.data.expires_at,
        status: InvoiceState.CREATED,
        isHoldInvoice: true,
        qrCode: `lightning:${response.data.lightning_invoice?.payreq || response.data.payreq}`
      }
    };
  } catch (error) {
    console.error('Error creating hold invoice:', error);
    throw new Error(`Failed to create hold invoice: ${error.message}`);
  }
}

/**
 * Settle a hold invoice (release funds to recipient)
 *
 * @param {string} invoiceId - Invoice ID to settle
 * @param {boolean} isTestnet - Whether using testnet
 * @returns {Promise<Object>} Settlement result
 */
export async function settleHoldInvoice(invoiceId, isTestnet = false) {
  const client = getClient(isTestnet);

  try {
    const response = await client.request(`/charges/${invoiceId}/settle`, {
      method: 'POST'
    });

    return {
      success: true,
      invoiceId,
      status: InvoiceState.SETTLED,
      settledAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error settling hold invoice:', error);
    throw new Error(`Failed to settle invoice: ${error.message}`);
  }
}

/**
 * Cancel a hold invoice (refund funds to payer)
 *
 * @param {string} invoiceId - Invoice ID to cancel
 * @param {boolean} isTestnet - Whether using testnet
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelHoldInvoice(invoiceId, isTestnet = false) {
  const client = getClient(isTestnet);

  try {
    const response = await client.request(`/charges/${invoiceId}/cancel`, {
      method: 'POST'
    });

    return {
      success: true,
      invoiceId,
      status: InvoiceState.CANCELLED,
      cancelledAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error cancelling hold invoice:', error);
    throw new Error(`Failed to cancel invoice: ${error.message}`);
  }
}

/**
 * Get invoice status
 *
 * @param {string} invoiceId - Invoice ID to check
 * @param {boolean} isTestnet - Whether using testnet
 * @returns {Promise<Object>} Invoice status
 */
export async function getInvoiceStatus(invoiceId, isTestnet = false) {
  const client = getClient(isTestnet);

  try {
    const response = await client.request(`/charges/${invoiceId}`);

    const data = response.data;

    // Map OpenNode status to our InvoiceState
    let status;
    switch (data.status) {
      case 'unpaid':
        status = InvoiceState.CREATED;
        break;
      case 'processing':
        status = InvoiceState.HELD;
        break;
      case 'paid':
        status = data.hold_invoice ? InvoiceState.HELD : InvoiceState.SETTLED;
        break;
      case 'settled':
        status = InvoiceState.SETTLED;
        break;
      case 'cancelled':
        status = InvoiceState.CANCELLED;
        break;
      case 'expired':
        status = InvoiceState.EXPIRED;
        break;
      default:
        status = data.status;
    }

    return {
      id: data.id,
      status,
      amountSats: data.amount,
      amountBTC: satsToBTC(data.amount),
      description: data.description,
      expiresAt: data.expires_at,
      paidAt: data.paid_at,
      settledAt: data.settled_at,
      isHoldInvoice: data.hold_invoice || false,
      timeRemaining: getTimeUntilExpiry({ expiresAt: data.expires_at }),
      timeRemainingFormatted: formatTimeRemaining(getTimeUntilExpiry({ expiresAt: data.expires_at }))
    };
  } catch (error) {
    console.error('Error getting invoice status:', error);
    throw new Error(`Failed to get invoice status: ${error.message}`);
  }
}

/**
 * Poll invoice status until paid or expired
 *
 * @param {string} invoiceId - Invoice ID to monitor
 * @param {Object} options - Polling options
 * @returns {Promise<Object>} Final invoice status
 */
export async function waitForPayment(invoiceId, options = {}) {
  const {
    isTestnet = false,
    pollInterval = 3000,      // Check every 3 seconds
    maxAttempts = 1200,       // 1 hour max (1200 * 3s = 3600s)
    onStatusUpdate = null     // Callback for status updates
  } = options;

  for (let i = 0; i < maxAttempts; i++) {
    const status = await getInvoiceStatus(invoiceId, isTestnet);

    if (onStatusUpdate) {
      onStatusUpdate(status);
    }

    // Check for terminal states
    if (status.status === InvoiceState.HELD ||
        status.status === InvoiceState.SETTLED) {
      return { success: true, ...status };
    }

    if (status.status === InvoiceState.CANCELLED ||
        status.status === InvoiceState.EXPIRED ||
        status.status === InvoiceState.FAILED) {
      return { success: false, ...status };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return {
    success: false,
    status: 'timeout',
    message: 'Payment monitoring timed out'
  };
}

/**
 * Estimate Lightning network fee
 *
 * @param {number} amountSats - Amount in satoshis
 * @returns {Object} Fee estimation
 */
export function estimateFee(amountSats) {
  const { fees } = LIGHTNING_CONFIG;

  // Fee = base fee + (amount * fee rate)
  const calculatedFee = fees.baseFee + Math.floor(amountSats * fees.feeRate);
  const finalFee = Math.min(calculatedFee, fees.maxFee);

  return {
    feeSats: finalFee,
    feeBTC: satsToBTC(finalFee),
    feeFormatted: formatSats(finalFee),
    totalSats: amountSats + finalFee,
    totalBTC: satsToBTC(amountSats + finalFee),
    feePercent: ((finalFee / amountSats) * 100).toFixed(3)
  };
}

/**
 * Convert USD to satoshis (approximate)
 *
 * @param {number} usd - Amount in USD
 * @param {number} btcPrice - Current BTC price in USD
 * @returns {number} Amount in satoshis
 */
export function usdToSats(usd, btcPrice = 95000) {
  return Math.floor((usd / btcPrice) * 100000000);
}

/**
 * Convert satoshis to USD (approximate)
 *
 * @param {number} sats - Amount in satoshis
 * @param {number} btcPrice - Current BTC price in USD
 * @returns {number} Amount in USD
 */
export function satsToUsd(sats, btcPrice = 95000) {
  return satsToBTC(sats) * btcPrice;
}

/**
 * Validate payment amount
 *
 * @param {number} amountSats - Amount in satoshis
 * @returns {Object} Validation result
 */
export function validateAmount(amountSats) {
  const { defaults } = LIGHTNING_CONFIG;

  if (amountSats < defaults.minAmountSats) {
    return {
      valid: false,
      error: `Amount too small. Minimum: ${formatSats(defaults.minAmountSats)}`
    };
  }

  if (amountSats > defaults.maxAmountSats) {
    return {
      valid: false,
      error: `Amount too large. Maximum: ${formatSats(defaults.maxAmountSats)}`
    };
  }

  return { valid: true };
}

/**
 * Generate QR code data URL for invoice
 *
 * @param {string} bolt11 - BOLT11 invoice string
 * @returns {string} QR code URI
 */
export function getInvoiceQRData(bolt11) {
  return `lightning:${bolt11.toUpperCase()}`;
}

/**
 * Check if Lightning is available (API key configured)
 *
 * @param {boolean} isTestnet - Check testnet availability
 * @returns {boolean} Whether Lightning is available
 */
export function isLightningAvailable(isTestnet = false) {
  const config = getLightningConfig(isTestnet);
  return !!config.apiKey;
}

// Export all functions
export default {
  createInvoice,
  createHoldInvoice,
  settleHoldInvoice,
  cancelHoldInvoice,
  getInvoiceStatus,
  waitForPayment,
  estimateFee,
  usdToSats,
  satsToUsd,
  validateAmount,
  getInvoiceQRData,
  isLightningAvailable,
  // Re-export helpers
  satsToBTC,
  btcToSats,
  formatSats,
  isValidBolt11
};
