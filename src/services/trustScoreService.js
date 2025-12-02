/**
 * Trust Score Service - NO KYC PHILOSOPHY
 *
 * Progressive trust system for BillHaven P2P escrow platform.
 *
 * PHILOSOPHY: Zero KYC - Just like online shops!
 * Security comes from:
 * - 3D Secure (liability shift to bank for credit cards)
 * - Payment provider verification (iDEAL, SEPA, etc.)
 * - Blockchain confirmations (crypto)
 * - Invisible fraud detection (device, IP, behavior)
 *
 * Trust Levels provide BENEFITS, not RESTRICTIONS:
 * - NEW_USER: Standard experience
 * - VERIFIED: 10% fee discount (verified email/phone)
 * - TRUSTED: 25% fee discount (good track record)
 * - POWER_USER: 40% fee discount (excellent track record)
 *
 * NO LIMITS - NO KYC - Security through verification!
 */

import { supabase } from '../lib/supabase';

// Trust levels
export const TrustLevel = {
  NEW_USER: 'NEW_USER',
  VERIFIED: 'VERIFIED',
  TRUSTED: 'TRUSTED',
  POWER_USER: 'POWER_USER'
};

// Trust level configuration (NO LIMITS - only score thresholds and benefits)
export const TRUST_LEVEL_CONFIG = {
  [TrustLevel.NEW_USER]: {
    minScore: 0,
    feeDiscount: 0,
    badgeColor: '#6b7280',
    name: 'New User',
    description: 'Standard hold periods apply'
  },
  [TrustLevel.VERIFIED]: {
    minScore: 50,
    feeDiscount: 0.10, // 10% fee discount
    badgeColor: '#3b82f6',
    name: 'Verified',
    description: 'Reduced hold periods'
  },
  [TrustLevel.TRUSTED]: {
    minScore: 200,
    feeDiscount: 0.25, // 25% fee discount
    badgeColor: '#10b981',
    name: 'Trusted',
    description: 'Minimal hold periods'
  },
  [TrustLevel.POWER_USER]: {
    minScore: 500,
    feeDiscount: 0.40, // 40% fee discount
    badgeColor: '#f59e0b',
    name: 'Power User',
    description: 'Instant release for most methods'
  }
};

// Keep backward compatibility
export const TRUST_THRESHOLDS = TRUST_LEVEL_CONFIG;

// Score point values - NO KYC required
export const SCORE_POINTS = {
  successfulTrade: 10,          // Each completed trade
  emailVerified: 20,            // Verified email (automatic via Supabase)
  phoneVerified: 30,            // Verified phone (optional, for bonus)
  accountAgePerMonth: 5,        // Account age bonus
  volumePerThousand: 2,         // Trading volume bonus
  positiveRating: 15,           // Positive rating from counterparty
  disputeWon: 20,               // Won a dispute (was right)
  disputeLost: -100,            // Lost a dispute (was wrong)
  failedTransaction: -25,       // Transaction failed/cancelled
  reportedFraud: -200,          // Reported for fraud
  accountSuspension: -500       // Account suspended
};

/**
 * Hold Periods - TIERED SECURITY SYSTEM
 *
 * INSTANT release for IRREVERSIBLE payments (iDEAL, SEPA, crypto)
 * TIERED HOLDS for REVERSIBLE payments (credit cards)
 *
 * Why Credit Cards Need Holds:
 * - 3D Secure protects against STOLEN cards (20% of fraud)
 * - 3D Secure does NOT protect against FRIENDLY FRAUD (75% of chargebacks)
 * - Chargebacks can be filed up to 120 days later
 * - Hold periods deter scammers (they don't want to wait)
 * - Hold periods give time to detect fraud patterns
 *
 * ADMIN OVERRIDE: Admin can manually release any payment early
 * via adminForceRelease() function below
 */
export const HOLD_PERIODS = {
  // iDEAL - Bank verified, irreversible = INSTANT
  IDEAL: {
    [TrustLevel.NEW_USER]: 0,      // Instant (bank verified, no chargebacks)
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // SEPA Instant - Irreversible after 10 seconds = INSTANT
  SEPA_INSTANT: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Regular SEPA - INSTANT after bank webhook confirms settlement
  SEPA: {
    [TrustLevel.NEW_USER]: 0,      // Instant after bank confirmation
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Bancontact (Belgium) - Bank verified, irreversible = INSTANT
  BANCONTACT: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // SOFORT (Germany/Austria) - Bank verified, irreversible = INSTANT
  SOFORT: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Bank Transfer - INSTANT after confirmation
  BANK_TRANSFER: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Wire Transfer - INSTANT after confirmation
  WIRE_TRANSFER: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Credit Card - TIERED HOLDS (chargeback protection)
  // Even with 3D Secure, friendly fraud can happen up to 120 days later
  // Hold periods: deter scammers + time to detect fraud
  // Admin can override via adminForceRelease()
  CREDIT_CARD: {
    [TrustLevel.NEW_USER]: 7 * 24 * 3600,     // 7 days - highest risk, must prove trustworthy
    [TrustLevel.VERIFIED]: 3 * 24 * 3600,     // 3 days - has some track record
    [TrustLevel.TRUSTED]: 24 * 3600,          // 24 hours - good history
    [TrustLevel.POWER_USER]: 12 * 3600        // 12 hours - excellent track record
  },

  // PayPal Friends & Family - INSTANT (no buyer protection)
  PAYPAL_FRIENDS: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // PayPal Goods & Services - BLOCKED (180-day disputes)
  PAYPAL_GOODS: {
    [TrustLevel.NEW_USER]: -1,     // BLOCKED
    [TrustLevel.VERIFIED]: -1,
    [TrustLevel.TRUSTED]: -1,
    [TrustLevel.POWER_USER]: -1
  },

  // Crypto - INSTANT after blockchain confirmations
  CRYPTO: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Lightning Network - INSTANT (HTLC atomic swap)
  LIGHTNING: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Cash Deposit - INSTANT after confirmation
  CASH_DEPOSIT: {
    [TrustLevel.NEW_USER]: 0,
    [TrustLevel.VERIFIED]: 0,
    [TrustLevel.TRUSTED]: 0,
    [TrustLevel.POWER_USER]: 0
  },

  // Unknown methods - BLOCKED (can't verify)
  OTHER: {
    [TrustLevel.NEW_USER]: -1,
    [TrustLevel.VERIFIED]: -1,
    [TrustLevel.TRUSTED]: -1,
    [TrustLevel.POWER_USER]: -1
  }
};

/**
 * Calculate user's trust score from profile data
 * NO KYC required - score based on behavior and optional verifications
 *
 * @param {Object} profile - User trust profile
 * @returns {number} Trust score
 */
export function calculateTrustScore(profile) {
  if (!profile) return 0;

  let score = 0;

  // Successful trades (main way to build trust)
  score += (profile.successful_trades || 0) * SCORE_POINTS.successfulTrade;

  // Email verification (automatic via Supabase auth)
  if (profile.email_verified) {
    score += SCORE_POINTS.emailVerified;
  }

  // Phone verification (optional bonus)
  if (profile.phone_verified) {
    score += SCORE_POINTS.phoneVerified;
  }

  // Account age (months) - older accounts more trusted
  const accountAgeMonths = Math.floor((profile.account_age_days || 0) / 30);
  score += accountAgeMonths * SCORE_POINTS.accountAgePerMonth;

  // Trading volume (per €1,000) - higher volume = more trusted
  const volumeThousands = Math.floor((profile.total_volume || 0) / 1000);
  score += volumeThousands * SCORE_POINTS.volumePerThousand;

  // Positive ratings from counterparties
  score += (profile.positive_ratings || 0) * SCORE_POINTS.positiveRating;

  // Disputes
  score += (profile.disputes_won || 0) * SCORE_POINTS.disputeWon;
  score += (profile.disputes_lost || 0) * SCORE_POINTS.disputeLost;

  // Failed transactions (penalize incomplete trades)
  score += (profile.failed_transactions || 0) * SCORE_POINTS.failedTransaction;

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

/**
 * Determine trust level from profile
 *
 * @param {Object} profile - User trust profile
 * @returns {string} Trust level
 */
export function calculateTrustLevel(profile) {
  if (!profile) return TrustLevel.NEW_USER;

  const score = calculateTrustScore(profile);
  const trades = profile.successful_trades || 0;
  const rating = calculateRating(profile);
  const accountAgeMonths = Math.floor((profile.account_age_days || 0) / 30);

  // Check from highest to lowest
  const powerUser = TRUST_THRESHOLDS[TrustLevel.POWER_USER];
  if (score >= powerUser.minScore &&
      trades >= powerUser.minTrades &&
      rating >= powerUser.minRating &&
      accountAgeMonths >= powerUser.minAccountAgeMonths) {
    return TrustLevel.POWER_USER;
  }

  const trusted = TRUST_THRESHOLDS[TrustLevel.TRUSTED];
  if (score >= trusted.minScore &&
      trades >= trusted.minTrades &&
      rating >= trusted.minRating) {
    return TrustLevel.TRUSTED;
  }

  const verified = TRUST_THRESHOLDS[TrustLevel.VERIFIED];
  if (score >= verified.minScore &&
      trades >= verified.minTrades &&
      rating >= verified.minRating) {
    return TrustLevel.VERIFIED;
  }

  return TrustLevel.NEW_USER;
}

/**
 * Calculate user rating (0-1)
 *
 * @param {Object} profile - User trust profile
 * @returns {number} Rating between 0 and 1
 */
export function calculateRating(profile) {
  if (!profile) return 0;

  const positive = profile.positive_ratings || 0;
  const negative = profile.negative_ratings || 0;
  const total = positive + negative;

  if (total === 0) return 1; // New users start with perfect rating

  return positive / total;
}

/**
 * Get hold period for a payment method and trust level
 *
 * @param {string} paymentMethod - Payment method code
 * @param {string} trustLevel - User's trust level
 * @returns {number} Hold period in seconds (-1 = blocked)
 */
export function getHoldPeriod(paymentMethod, trustLevel) {
  const methodHolds = HOLD_PERIODS[paymentMethod] || HOLD_PERIODS.OTHER;
  return methodHolds[trustLevel] ?? methodHolds[TrustLevel.NEW_USER];
}

/**
 * Check if a payment method is blocked for a trust level
 *
 * @param {string} paymentMethod - Payment method code
 * @param {string} trustLevel - User's trust level
 * @returns {boolean} Whether the method is blocked
 */
export function isPaymentMethodBlocked(paymentMethod, trustLevel) {
  return getHoldPeriod(paymentMethod, trustLevel) === -1;
}

/**
 * Get trust level limits
 *
 * @param {string} trustLevel - Trust level
 * @returns {Object} Limits for the trust level
 */
export function getTrustLevelLimits(trustLevel) {
  return TRUST_THRESHOLDS[trustLevel] || TRUST_THRESHOLDS[TrustLevel.NEW_USER];
}

/**
 * Calculate progress to next trust level
 *
 * @param {Object} profile - User trust profile
 * @returns {Object} Progress info
 */
export function getProgressToNextLevel(profile) {
  const currentLevel = calculateTrustLevel(profile);
  const score = calculateTrustScore(profile);
  const trades = profile?.successful_trades || 0;
  const rating = calculateRating(profile);
  const accountAgeMonths = Math.floor((profile?.account_age_days || 0) / 30);

  // Already at max level
  if (currentLevel === TrustLevel.POWER_USER) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      requirements: null
    };
  }

  // Determine next level
  let nextLevel;
  switch (currentLevel) {
    case TrustLevel.NEW_USER:
      nextLevel = TrustLevel.VERIFIED;
      break;
    case TrustLevel.VERIFIED:
      nextLevel = TrustLevel.TRUSTED;
      break;
    case TrustLevel.TRUSTED:
      nextLevel = TrustLevel.POWER_USER;
      break;
    default:
      nextLevel = TrustLevel.VERIFIED;
  }

  const nextThreshold = TRUST_THRESHOLDS[nextLevel];

  // Calculate progress for each requirement
  const scoreProgress = Math.min(100, (score / nextThreshold.minScore) * 100);
  const tradesProgress = Math.min(100, (trades / nextThreshold.minTrades) * 100);
  const ratingProgress = Math.min(100, (rating / nextThreshold.minRating) * 100);
  const ageProgress = nextThreshold.minAccountAgeMonths > 0
    ? Math.min(100, (accountAgeMonths / nextThreshold.minAccountAgeMonths) * 100)
    : 100;

  // Overall progress is the minimum of all requirements
  const overallProgress = Math.min(scoreProgress, tradesProgress, ratingProgress, ageProgress);

  return {
    currentLevel,
    nextLevel,
    progress: Math.floor(overallProgress),
    requirements: {
      score: {
        current: score,
        required: nextThreshold.minScore,
        progress: scoreProgress,
        remaining: Math.max(0, nextThreshold.minScore - score)
      },
      trades: {
        current: trades,
        required: nextThreshold.minTrades,
        progress: tradesProgress,
        remaining: Math.max(0, nextThreshold.minTrades - trades)
      },
      rating: {
        current: rating,
        required: nextThreshold.minRating,
        progress: ratingProgress,
        met: rating >= nextThreshold.minRating
      },
      accountAge: {
        current: accountAgeMonths,
        required: nextThreshold.minAccountAgeMonths,
        progress: ageProgress,
        remaining: Math.max(0, nextThreshold.minAccountAgeMonths - accountAgeMonths)
      }
    }
  };
}

/**
 * Format hold period for display
 *
 * @param {number} seconds - Hold period in seconds
 * @returns {string} Formatted string
 */
export function formatHoldPeriod(seconds) {
  if (seconds === -1) return 'Blocked';
  if (seconds === 0) return 'Instant';

  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Get user trust profile from database
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Trust profile
 */
export async function getUserTrustProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_trust_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no profile exists, return default
    if (!data) {
      return {
        user_id: userId,
        trust_level: TrustLevel.NEW_USER,
        trust_score: 0,
        total_trades: 0,
        successful_trades: 0,
        disputed_trades: 0,
        total_volume: 0,
        positive_ratings: 0,
        negative_ratings: 0,
        email_verified: true, // Supabase requires email verification
        phone_verified: false,
        account_age_days: 0
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching trust profile:', error);
    throw error;
  }
}

/**
 * Update user trust profile after a trade
 *
 * @param {string} userId - User ID
 * @param {Object} tradeResult - Trade result data
 * @returns {Promise<Object>} Updated profile
 */
export async function updateTrustProfile(userId, tradeResult) {
  try {
    // Get current profile
    const profile = await getUserTrustProfile(userId);

    // Calculate updates
    const updates = {
      total_trades: (profile.total_trades || 0) + 1,
      total_volume: (profile.total_volume || 0) + (tradeResult.amount || 0),
      updated_at: new Date().toISOString()
    };

    if (tradeResult.successful) {
      updates.successful_trades = (profile.successful_trades || 0) + 1;
    }

    if (tradeResult.disputed) {
      updates.disputed_trades = (profile.disputed_trades || 0) + 1;
      if (tradeResult.disputeWon) {
        updates.disputes_won = (profile.disputes_won || 0) + 1;
      } else {
        updates.disputes_lost = (profile.disputes_lost || 0) + 1;
      }
    }

    if (tradeResult.rating !== undefined) {
      if (tradeResult.rating > 0) {
        updates.positive_ratings = (profile.positive_ratings || 0) + 1;
      } else if (tradeResult.rating < 0) {
        updates.negative_ratings = (profile.negative_ratings || 0) + 1;
      }
    }

    // Recalculate trust score and level
    const newProfile = { ...profile, ...updates };
    updates.trust_score = calculateTrustScore(newProfile);
    updates.trust_level = calculateTrustLevel(newProfile);

    // Upsert profile
    const { data, error } = await supabase
      .from('user_trust_profiles')
      .upsert({
        user_id: userId,
        ...updates
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating trust profile:', error);
    throw error;
  }
}

/**
 * ADMIN OVERRIDE: Force release a payment early
 *
 * Only admins can use this function to bypass hold periods.
 * Use when you manually verify a transaction is legitimate.
 *
 * @param {string} visaId - The bill/transaction ID
 * @param {string} adminId - The admin user ID (for audit trail)
 * @param {string} reason - Reason for early release (required for audit)
 * @returns {Promise<Object>} Result of the override
 */
export async function adminForceRelease(billId, adminId, reason) {
  if (!billId || !adminId || !reason) {
    throw new Error('billId, adminId, and reason are all required for admin override');
  }

  try {
    // Log the admin override for audit trail
    const { data: auditLog, error: auditError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        action: 'FORCE_RELEASE',
        bill_id: billId,
        reason: reason,
        created_at: new Date().toISOString()
      });

    if (auditError) {
      console.warn('Could not log admin action (table may not exist yet):', auditError);
      // Continue anyway - audit log is nice-to-have, not critical
    }

    // Update the bill to release immediately
    const { data, error } = await supabase
      .from('bills')
      .update({
        hold_override: true,
        hold_override_by: adminId,
        hold_override_reason: reason,
        hold_override_at: new Date().toISOString(),
        release_at: new Date().toISOString() // Release NOW
      })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[ADMIN OVERRIDE] Bill ${billId} released early by admin ${adminId}. Reason: ${reason}`);

    return {
      success: true,
      billId,
      releasedAt: new Date().toISOString(),
      overrideBy: adminId,
      reason
    };
  } catch (error) {
    console.error('Admin force release failed:', error);
    throw error;
  }
}

/**
 * Check if a bill has been admin overridden
 *
 * @param {string} billId - The bill ID to check
 * @returns {Promise<boolean>} Whether the bill has an admin override
 */
export async function hasAdminOverride(billId) {
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('hold_override')
      .eq('id', billId)
      .single();

    if (error) return false;
    return data?.hold_override === true;
  } catch {
    return false;
  }
}

/**
 * Get effective hold period (considering admin override)
 *
 * @param {string} billId - The bill ID
 * @param {string} paymentMethod - Payment method code
 * @param {string} trustLevel - User's trust level
 * @returns {Promise<number>} Effective hold period in seconds (0 if overridden)
 */
export async function getEffectiveHoldPeriod(billId, paymentMethod, trustLevel) {
  // Check for admin override first
  if (billId && await hasAdminOverride(billId)) {
    return 0; // Admin overridden = instant release
  }

  // Otherwise return normal hold period
  return getHoldPeriod(paymentMethod, trustLevel);
}

// Export all
export default {
  TrustLevel,
  TRUST_THRESHOLDS,
  SCORE_POINTS,
  HOLD_PERIODS,
  calculateTrustScore,
  calculateTrustLevel,
  calculateRating,
  getHoldPeriod,
  isPaymentMethodBlocked,
  getTrustLevelLimits,
  getProgressToNextLevel,
  formatHoldPeriod,
  getUserTrustProfile,
  updateTrustProfile,
  // Admin functions
  adminForceRelease,
  hasAdminOverride,
  getEffectiveHoldPeriod
};
