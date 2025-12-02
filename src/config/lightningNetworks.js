/**
 * Lightning Network Configuration
 *
 * BillHaven Bitcoin Lightning integration using hold invoices for escrow.
 * Provider options: OpenNode, Lightspark, Voltage
 *
 * Features:
 * - BOLT11 invoice generation
 * - Hold invoices (HTLC) for escrow functionality
 * - Payment verification via webhooks
 * - Instant settlement for crypto payments
 */

// Lightning provider configuration
export const LIGHTNING_CONFIG = {
  // Primary provider (OpenNode recommended for simplicity)
  provider: 'opennode',

  // Provider endpoints
  providers: {
    opennode: {
      name: 'OpenNode',
      apiUrl: 'https://api.opennode.com/v1',
      testApiUrl: 'https://dev-api.opennode.com/v1',
      docsUrl: 'https://developers.opennode.com',
      supportsHoldInvoices: true,
      supportsWebhooks: true
    },
    lightspark: {
      name: 'Lightspark',
      apiUrl: 'https://api.lightspark.com/graphql',
      docsUrl: 'https://docs.lightspark.com',
      supportsHoldInvoices: true,
      supportsWebhooks: true
    },
    voltage: {
      name: 'Voltage',
      apiUrl: 'https://voltageapi.com/v1',
      docsUrl: 'https://docs.voltage.cloud',
      supportsHoldInvoices: true,
      supportsWebhooks: true
    }
  },

  // Default settings
  defaults: {
    expiryMinutes: 60,           // Invoice expires after 1 hour
    minAmountSats: 1000,         // Minimum 1000 sats (~$0.50)
    maxAmountSats: 10000000,     // Maximum 0.1 BTC
    confirmations: 0,            // Lightning is instant (0 on-chain confirmations)
    description: 'BillHaven Payment'
  },

  // Fee estimation
  fees: {
    baseFee: 1,                  // 1 sat base fee
    feeRate: 0.0001,             // 0.01% fee rate
    maxFee: 1000,                // Max 1000 sats fee
    estimatedUSD: '$0.01'        // Approximate USD cost
  }
};

// Invoice states
export const InvoiceState = {
  CREATED: 'created',           // Invoice created, waiting for payment
  HELD: 'held',                 // Payment received, funds locked (hold invoice)
  SETTLED: 'settled',           // Payment released to recipient
  CANCELLED: 'cancelled',       // Invoice cancelled, funds returned
  EXPIRED: 'expired',           // Invoice expired without payment
  FAILED: 'failed'              // Payment failed
};

// Map invoice states to escrow states
export const INVOICE_TO_ESCROW_STATE = {
  [InvoiceState.CREATED]: 'FUNDED',
  [InvoiceState.HELD]: 'PAYMENT_VERIFIED',
  [InvoiceState.SETTLED]: 'RELEASED',
  [InvoiceState.CANCELLED]: 'REFUNDED',
  [InvoiceState.EXPIRED]: 'CANCELLED',
  [InvoiceState.FAILED]: 'CANCELLED'
};

// Webhook event types
export const WebhookEvents = {
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_HELD: 'invoice.held',
  INVOICE_SETTLED: 'invoice.settled',
  INVOICE_CANCELLED: 'invoice.cancelled',
  INVOICE_EXPIRED: 'invoice.expired'
};

// Satoshi/BTC conversion helpers
export function satsToBTC(sats) {
  return sats / 100000000;
}

export function btcToSats(btc) {
  return Math.floor(btc * 100000000);
}

export function satsToUSD(sats, btcPriceUSD = 95000) {
  return satsToBTC(sats) * btcPriceUSD;
}

export function usdToSats(usd, btcPriceUSD = 95000) {
  return btcToSats(usd / btcPriceUSD);
}

export function formatSats(sats) {
  if (sats >= 100000000) {
    return `${satsToBTC(sats).toFixed(8)} BTC`;
  }
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(2)}M sats`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(1)}k sats`;
  }
  return `${sats} sats`;
}

// Invoice helpers
export function getInvoiceExpiry(minutes = LIGHTNING_CONFIG.defaults.expiryMinutes) {
  return Math.floor(Date.now() / 1000) + (minutes * 60);
}

export function isInvoiceExpired(invoice) {
  if (!invoice.expiresAt) return false;
  return Date.now() > invoice.expiresAt * 1000;
}

export function getTimeUntilExpiry(invoice) {
  if (!invoice.expiresAt) return null;
  const remaining = (invoice.expiresAt * 1000) - Date.now();
  return Math.max(0, remaining);
}

export function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Expired';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Environment-based configuration
export function getLightningConfig(isTestnet = false) {
  const provider = LIGHTNING_CONFIG.providers[LIGHTNING_CONFIG.provider];

  return {
    ...LIGHTNING_CONFIG,
    apiUrl: isTestnet ? provider.testApiUrl : provider.apiUrl,
    apiKey: isTestnet
      ? import.meta.env.VITE_OPENNODE_API_KEY_TEST
      : import.meta.env.VITE_OPENNODE_API_KEY,
    webhookSecret: import.meta.env.VITE_LIGHTNING_WEBHOOK_SECRET,
    isTestnet
  };
}

// Validate Lightning invoice (BOLT11)
export function isValidBolt11(invoice) {
  if (!invoice || typeof invoice !== 'string') return false;

  // BOLT11 invoices start with 'ln' followed by network prefix
  const validPrefixes = ['lnbc', 'lntb', 'lnbcrt']; // mainnet, testnet, regtest

  const lowerInvoice = invoice.toLowerCase();
  return validPrefixes.some(prefix => lowerInvoice.startsWith(prefix));
}

// Parse basic invoice info (without full decode)
export function getInvoiceNetwork(invoice) {
  if (!invoice) return null;

  const lowerInvoice = invoice.toLowerCase();

  if (lowerInvoice.startsWith('lnbc')) return 'mainnet';
  if (lowerInvoice.startsWith('lntb')) return 'testnet';
  if (lowerInvoice.startsWith('lnbcrt')) return 'regtest';

  return null;
}

// Export default
export default {
  LIGHTNING_CONFIG,
  InvoiceState,
  INVOICE_TO_ESCROW_STATE,
  WebhookEvents,
  satsToBTC,
  btcToSats,
  satsToUSD,
  usdToSats,
  formatSats,
  getInvoiceExpiry,
  isInvoiceExpired,
  getTimeUntilExpiry,
  formatTimeRemaining,
  getLightningConfig,
  isValidBolt11,
  getInvoiceNetwork
};
