/**
 * BillHaven Services Index
 *
 * Exports all payment services and utilities.
 *
 * Supported Blockchains:
 * - EVM: Ethereum, Base, Polygon, BSC, Arbitrum, Optimism
 * - TON: The Open Network
 * - Solana: SOL + SPL tokens
 * - Tron: TRX + TRC20
 * - Bitcoin: Native BTC + Lightning Network
 *
 * Payment Methods:
 * - Crypto (all chains above)
 * - Credit/Debit Cards (Stripe + 3D Secure)
 * - Bank transfers (SEPA, iDEAL, etc.)
 *
 * NO TRANSACTION LIMITS - Security through verification
 */

// Crypto Payment Services
export * from './solanaPayment';
export * from './lightningPayment';

// Credit Card Service
export * from './creditCardPayment';

// Trust System
export * from './trustScoreService';

// Invisible Security (NO KYC - like online shops)
export * from './invisibleSecurityService';

// Referral & Affiliate System
export * from './referralService';

// Security Agents
export * from '../agents/fraudDetectionAgent';
export * from '../agents/holdPeriodAnalyzer';
export * from '../agents/securityAuditAgent';

// Payment method identifiers
export const PaymentMethods = {
  // Crypto - Native
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
  TON: 'TON',
  TRX: 'TRX',
  MATIC: 'MATIC',
  BNB: 'BNB',
  ARB: 'ARB',
  OP: 'OP',
  BASE: 'BASE',

  // Crypto - Tokens
  USDC: 'USDC',
  USDT: 'USDT',
  WBTC: 'WBTC',
  DAI: 'DAI',

  // Lightning
  LIGHTNING: 'LIGHTNING',

  // Fiat
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  IDEAL: 'IDEAL',
  SEPA: 'SEPA',
  SEPA_INSTANT: 'SEPA_INSTANT',
  BANK_TRANSFER: 'BANK_TRANSFER',
  PAYPAL_FRIENDS: 'PAYPAL_FRIENDS',
  PAYPAL_GOODS: 'PAYPAL_GOODS'
};

// Chain identifiers
export const Chains = {
  ETHEREUM: 'ethereum',
  BASE: 'base',
  POLYGON: 'polygon',
  BSC: 'bsc',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  SOLANA: 'solana',
  TON: 'ton',
  TRON: 'tron',
  BITCOIN: 'bitcoin',
  LIGHTNING: 'lightning'
};

// Payment method metadata
export const PaymentMethodInfo = {
  [PaymentMethods.BTC]: {
    name: 'Bitcoin',
    chain: Chains.BITCOIN,
    icon: '₿',
    color: '#f7931a',
    confirmations: 6,
    avgTime: '60 min'
  },
  [PaymentMethods.LIGHTNING]: {
    name: 'Lightning Network',
    chain: Chains.LIGHTNING,
    icon: '⚡',
    color: '#fbbf24',
    confirmations: 0,
    avgTime: 'Instant'
  },
  [PaymentMethods.ETH]: {
    name: 'Ethereum',
    chain: Chains.ETHEREUM,
    icon: 'Ξ',
    color: '#627eea',
    confirmations: 12,
    avgTime: '3 min'
  },
  [PaymentMethods.SOL]: {
    name: 'Solana',
    chain: Chains.SOLANA,
    icon: '◎',
    color: '#9945ff',
    confirmations: 1,
    avgTime: '< 1 sec'
  },
  [PaymentMethods.TON]: {
    name: 'TON',
    chain: Chains.TON,
    icon: '💎',
    color: '#0088cc',
    confirmations: 1,
    avgTime: '5 sec'
  },
  [PaymentMethods.TRX]: {
    name: 'Tron',
    chain: Chains.TRON,
    icon: '🔷',
    color: '#eb0029',
    confirmations: 19,
    avgTime: '3 sec'
  },
  [PaymentMethods.USDC]: {
    name: 'USD Coin',
    icon: '$',
    color: '#2775ca',
    isStablecoin: true
  },
  [PaymentMethods.USDT]: {
    name: 'Tether',
    icon: '₮',
    color: '#26a17b',
    isStablecoin: true
  },
  [PaymentMethods.CREDIT_CARD]: {
    name: 'Credit Card',
    icon: '💳',
    color: '#6366f1',
    requires3DS: 'automatic'
  },
  [PaymentMethods.IDEAL]: {
    name: 'iDEAL',
    icon: '🏦',
    color: '#cc0066',
    finality: 'instant',
    reversible: false
  },
  [PaymentMethods.SEPA_INSTANT]: {
    name: 'SEPA Instant',
    icon: '🇪🇺',
    color: '#003399',
    finality: '10 seconds'
  }
};

// Get payment method by identifier
export function getPaymentMethod(id) {
  return PaymentMethodInfo[id] || null;
}

// Get all crypto payment methods
export function getCryptoMethods() {
  return Object.entries(PaymentMethodInfo)
    .filter(([_, info]) => info.chain)
    .map(([id, info]) => ({ id, ...info }));
}

// Get all fiat payment methods
export function getFiatMethods() {
  return Object.entries(PaymentMethodInfo)
    .filter(([_, info]) => !info.chain)
    .map(([id, info]) => ({ id, ...info }));
}

// Export default object with all services
export default {
  PaymentMethods,
  Chains,
  PaymentMethodInfo,
  getPaymentMethod,
  getCryptoMethods,
  getFiatMethods
};
