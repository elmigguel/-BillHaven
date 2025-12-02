/**
 * Hold Period Analyzer Agent
 *
 * Analyzes and optimizes hold periods for different payment methods.
 * Ensures user-friendly hold times while maintaining security.
 *
 * Key responsibilities:
 * - Analyze payment method finality
 * - Compare with industry standards (Binance P2P, Paxful, etc.)
 * - Suggest optimal hold periods
 * - Monitor for payment reversals/chargebacks
 * - Adjust hold periods based on historical data
 *
 * NO TRANSACTION LIMITS - Focus on time-based security, not amount limits.
 */

import { TrustLevel, HOLD_PERIODS } from '../services/trustScoreService';

// Payment method finality analysis
export const PAYMENT_FINALITY = {
  // INSTANT & IRREVERSIBLE - Safest methods
  IDEAL: {
    name: 'iDEAL',
    finality: 'instant',
    reversalRisk: 'none',
    chargebackWindow: 0,
    settlementTime: 'immediate',
    description: 'Dutch bank transfer - instantly irreversible once confirmed',
    recommendation: 'Can release immediately after confirmation for trusted users'
  },

  CRYPTO_NATIVE: {
    name: 'Native Crypto',
    finality: 'confirmations',
    reversalRisk: 'none',
    chargebackWindow: 0,
    settlementTime: {
      BTC: '10-60 minutes (1-6 confirmations)',
      ETH: '12-15 seconds per block',
      SOL: '<1 second',
      TON: '~5 seconds',
      TRON: '~3 seconds'
    },
    description: 'Blockchain transactions are final after confirmations',
    recommendation: 'Wait for required confirmations, then instant release'
  },

  LIGHTNING: {
    name: 'Lightning Network',
    finality: 'instant',
    reversalRisk: 'none',
    chargebackWindow: 0,
    settlementTime: '<1 second',
    description: 'Bitcoin Lightning payments are instant and final',
    recommendation: 'Can release immediately - HTLC provides atomic swap guarantee'
  },

  // FAST BUT VERIFY - Medium safety
  SEPA_INSTANT: {
    name: 'SEPA Instant',
    finality: '10 seconds',
    reversalRisk: 'very_low',
    chargebackWindow: 0,
    settlementTime: '<10 seconds',
    description: 'EU instant bank transfer - final in 10 seconds',
    recommendation: 'Short hold (15-30 min) for new users, instant for trusted'
  },

  SEPA: {
    name: 'SEPA Regular',
    finality: '1-2 business days',
    reversalRisk: 'low',
    chargebackWindow: '8 weeks (fraud only)',
    settlementTime: '1-2 business days',
    description: 'Standard EU bank transfer',
    recommendation: 'Hold until settlement confirmed (1-2 days)'
  },

  BANK_TRANSFER: {
    name: 'Bank Transfer',
    finality: '1-5 business days',
    reversalRisk: 'low',
    chargebackWindow: '60 days (unauthorized)',
    settlementTime: '1-5 business days',
    description: 'Standard bank wire transfer',
    recommendation: 'Hold until settlement + buffer (3-5 days)'
  },

  // HIGH RISK - Require careful handling
  CREDIT_CARD: {
    name: 'Credit Card',
    finality: 'authorization_only',
    reversalRisk: 'high',
    chargebackWindow: '120-540 days',
    settlementTime: 'instant authorization, 1-2 days settlement',
    description: 'Card payments can be disputed for months',
    recommendation: 'Use liability shift (3D Secure when needed), hold based on trust level'
  },

  PAYPAL_GOODS: {
    name: 'PayPal Goods & Services',
    finality: 'none',
    reversalRisk: 'very_high',
    chargebackWindow: '180 days',
    settlementTime: 'instant',
    description: 'Very high dispute rate, PayPal often sides with buyer',
    recommendation: 'NOT RECOMMENDED for escrow - only for POWER_USER with history'
  },

  PAYPAL_FRIENDS: {
    name: 'PayPal Friends & Family',
    finality: 'instant',
    reversalRisk: 'medium',
    chargebackWindow: '180 days (via bank)',
    settlementTime: 'instant',
    description: 'Cannot dispute through PayPal but can dispute through bank',
    recommendation: 'Medium hold period, requires trust'
  }
};

// Industry benchmarks
export const INDUSTRY_BENCHMARKS = {
  binance_p2p: {
    name: 'Binance P2P',
    crypto_release: '15 minutes after payment confirmation',
    dispute_window: '15 minutes',
    escrow_max: '8 hours',
    trust_system: 'Yes - reduces hold for verified merchants'
  },
  paxful: {
    name: 'Paxful',
    crypto_release: 'After seller confirms payment',
    dispute_window: '30 minutes',
    escrow_max: '6 hours',
    trust_system: 'Yes - reputation score'
  },
  localbitcoins: {
    name: 'LocalBitcoins',
    crypto_release: 'Manual by seller',
    dispute_window: '24 hours',
    escrow_max: '48 hours',
    trust_system: 'Yes - trust score'
  }
};

/**
 * Analyze hold period for a payment method
 */
export function analyzeHoldPeriod(paymentMethod, trustLevel = TrustLevel.NEW_USER) {
  const finality = PAYMENT_FINALITY[paymentMethod];
  if (!finality) {
    return {
      error: `Unknown payment method: ${paymentMethod}`,
      recommendation: 'Use default hold period'
    };
  }

  const currentHold = HOLD_PERIODS[paymentMethod]?.[trustLevel];
  const formatTime = (seconds) => {
    if (seconds === 0) return 'Instant';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    return `${Math.round(seconds / 86400)} days`;
  };

  return {
    paymentMethod: finality.name,
    trustLevel,
    currentHoldPeriod: formatTime(currentHold),
    currentHoldSeconds: currentHold,

    analysis: {
      finality: finality.finality,
      reversalRisk: finality.reversalRisk,
      chargebackWindow: finality.chargebackWindow,
      settlementTime: finality.settlementTime
    },

    recommendation: finality.recommendation,

    comparison: {
      binanceP2P: INDUSTRY_BENCHMARKS.binance_p2p.crypto_release,
      paxful: INDUSTRY_BENCHMARKS.paxful.crypto_release
    },

    isOptimal: evaluateHoldPeriod(paymentMethod, trustLevel, currentHold),

    improvements: suggestImprovements(paymentMethod, trustLevel, currentHold)
  };
}

/**
 * Evaluate if current hold period is optimal
 */
function evaluateHoldPeriod(paymentMethod, trustLevel, holdSeconds) {
  const finality = PAYMENT_FINALITY[paymentMethod];

  // For instant/irreversible methods, any hold beyond confirmation is suboptimal
  if (finality.reversalRisk === 'none') {
    if (trustLevel >= TrustLevel.TRUSTED && holdSeconds > 0) {
      return { optimal: false, reason: 'Trusted users should get instant release for irreversible payments' };
    }
    if (holdSeconds > 900) { // More than 15 minutes
      return { optimal: false, reason: 'Hold too long for irreversible payment method' };
    }
    return { optimal: true };
  }

  // For medium risk methods
  if (finality.reversalRisk === 'low' || finality.reversalRisk === 'very_low') {
    if (holdSeconds > 86400 * 3) { // More than 3 days
      return { optimal: false, reason: 'Hold period longer than settlement time' };
    }
    return { optimal: true };
  }

  // For high risk methods (credit cards)
  if (finality.reversalRisk === 'high') {
    // Some hold is always needed
    if (holdSeconds < 86400) { // Less than 1 day
      return { optimal: false, reason: 'Too short for chargeback protection' };
    }
    return { optimal: true };
  }

  return { optimal: true };
}

/**
 * Suggest improvements for hold periods
 */
function suggestImprovements(paymentMethod, trustLevel, holdSeconds) {
  const suggestions = [];
  const finality = PAYMENT_FINALITY[paymentMethod];

  // Irreversible payments should be faster
  if (finality.reversalRisk === 'none' && holdSeconds > 300) {
    suggestions.push({
      type: 'reduce_hold',
      message: `${finality.name} is irreversible - consider reducing hold to 5 minutes or less`,
      priority: 'high'
    });
  }

  // SEPA Instant can be faster
  if (paymentMethod === 'SEPA_INSTANT' && holdSeconds > 1800) {
    suggestions.push({
      type: 'reduce_hold',
      message: 'SEPA Instant settles in 10 seconds - 30 minute hold is sufficient',
      priority: 'medium'
    });
  }

  // Credit cards - ensure 3D Secure
  if (paymentMethod === 'CREDIT_CARD') {
    suggestions.push({
      type: 'security',
      message: 'Ensure 3D Secure is enabled for liability shift on fraud disputes',
      priority: 'high'
    });
  }

  // PayPal Goods - warn about risk
  if (paymentMethod === 'PAYPAL_GOODS') {
    suggestions.push({
      type: 'warning',
      message: 'PayPal Goods has very high dispute risk - consider blocking for new users',
      priority: 'critical'
    });
  }

  // Trust-based improvements
  if (trustLevel === TrustLevel.POWER_USER && holdSeconds > 3600) {
    suggestions.push({
      type: 'trust_upgrade',
      message: 'Power users have proven track record - shorter holds improve experience',
      priority: 'medium'
    });
  }

  return suggestions;
}

/**
 * Get recommended hold periods for all payment methods
 */
export function getRecommendedHoldPeriods() {
  return {
    // Instant/Irreversible - Trust-based instant release
    IDEAL: {
      [TrustLevel.NEW_USER]: 15 * 60,      // 15 minutes - just to verify
      [TrustLevel.VERIFIED]: 5 * 60,       // 5 minutes
      [TrustLevel.TRUSTED]: 0,             // Instant
      [TrustLevel.POWER_USER]: 0           // Instant
    },

    CRYPTO_NATIVE: {
      [TrustLevel.NEW_USER]: 10 * 60,      // 10 minutes (wait for confirmations)
      [TrustLevel.VERIFIED]: 5 * 60,       // 5 minutes
      [TrustLevel.TRUSTED]: 0,             // Instant after confirmations
      [TrustLevel.POWER_USER]: 0           // Instant after confirmations
    },

    LIGHTNING: {
      [TrustLevel.NEW_USER]: 5 * 60,       // 5 minutes
      [TrustLevel.VERIFIED]: 0,            // Instant
      [TrustLevel.TRUSTED]: 0,             // Instant
      [TrustLevel.POWER_USER]: 0           // Instant
    },

    // Medium risk - Verification based
    SEPA_INSTANT: {
      [TrustLevel.NEW_USER]: 30 * 60,      // 30 minutes
      [TrustLevel.VERIFIED]: 15 * 60,      // 15 minutes
      [TrustLevel.TRUSTED]: 5 * 60,        // 5 minutes
      [TrustLevel.POWER_USER]: 0           // Instant
    },

    SEPA: {
      [TrustLevel.NEW_USER]: 24 * 3600,    // 24 hours (wait for settlement)
      [TrustLevel.VERIFIED]: 12 * 3600,    // 12 hours
      [TrustLevel.TRUSTED]: 4 * 3600,      // 4 hours
      [TrustLevel.POWER_USER]: 1 * 3600    // 1 hour
    },

    // High risk - Extended holds
    CREDIT_CARD: {
      [TrustLevel.NEW_USER]: 7 * 24 * 3600,    // 7 days (reduced from 14)
      [TrustLevel.VERIFIED]: 3 * 24 * 3600,    // 3 days
      [TrustLevel.TRUSTED]: 24 * 3600,         // 24 hours
      [TrustLevel.POWER_USER]: 12 * 3600       // 12 hours (with 3DS)
    },

    // PayPal - Strict controls
    PAYPAL_GOODS: {
      [TrustLevel.NEW_USER]: null,             // BLOCKED
      [TrustLevel.VERIFIED]: null,             // BLOCKED
      [TrustLevel.TRUSTED]: 14 * 24 * 3600,    // 14 days
      [TrustLevel.POWER_USER]: 7 * 24 * 3600   // 7 days
    },

    PAYPAL_FRIENDS: {
      [TrustLevel.NEW_USER]: 7 * 24 * 3600,    // 7 days
      [TrustLevel.VERIFIED]: 3 * 24 * 3600,    // 3 days
      [TrustLevel.TRUSTED]: 24 * 3600,         // 24 hours
      [TrustLevel.POWER_USER]: 12 * 3600       // 12 hours
    }
  };
}

/**
 * Run full analysis on all payment methods
 */
export function runFullAnalysis(trustLevel = TrustLevel.NEW_USER) {
  const methods = Object.keys(PAYMENT_FINALITY);
  const results = [];

  for (const method of methods) {
    results.push(analyzeHoldPeriod(method, trustLevel));
  }

  // Summary
  const summary = {
    totalMethods: methods.length,
    optimalCount: results.filter(r => r.isOptimal?.optimal).length,
    improvements: results.flatMap(r => r.improvements || []),
    criticalIssues: results.flatMap(r => r.improvements || []).filter(i => i.priority === 'critical'),
    recommendations: generateSummaryRecommendations(results)
  };

  return {
    analysisDate: new Date().toISOString(),
    trustLevel,
    methods: results,
    summary
  };
}

/**
 * Generate summary recommendations
 */
function generateSummaryRecommendations(results) {
  return [
    'Use iDEAL as preferred payment method - instant and irreversible',
    'Lightning Network provides best UX for crypto - instant settlement',
    'SEPA Instant is safe and fast for EU users',
    'Credit cards require hold periods but 3D Secure reduces risk',
    'PayPal Goods & Services should be restricted to trusted users only',
    'Trust system allows faster releases for proven users',
    'Monitor chargeback rates and adjust holds accordingly'
  ];
}

export default {
  PAYMENT_FINALITY,
  INDUSTRY_BENCHMARKS,
  analyzeHoldPeriod,
  getRecommendedHoldPeriods,
  runFullAnalysis
};
