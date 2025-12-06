/**
 * BillHaven Referral Service V2 - 3-TIER VIRAL GROWTH SYSTEM
 *
 * Based on research: Top platforms use 40-70% commissions (MEXC: 70%, Binance: 50%)
 *
 * TIER STRUCTURE:
 * - Tier 1: 40% of referee's fees (direct referral)
 * - Tier 2: 10% of referee's referee's fees
 * - Tier 3: 5% of 3rd level fees
 *
 * BONUSES:
 * - Signup bonus: $5 platform credit
 * - First trade bonus: $10 when referee completes first trade
 * - Volume milestones: $25-$1000 bonuses
 */

import { supabase } from '../lib/supabase';

// 3-TIER COMMISSION RATES - Industry leading!
export const COMMISSION_RATES = {
  tier1: 0.40, // 40% of fees - direct referral
  tier2: 0.10, // 10% of fees - 2nd level
  tier3: 0.05, // 5% of fees - 3rd level
};

// REFERRAL BONUSES
export const REFERRAL_BONUSES = {
  signupBonus: 5, // $5 equivalent in platform credit
  firstTradeBonus: 10, // $10 when referee completes first trade
  volumeMilestones: [
    { volume: 1000, bonus: 25 },
    { volume: 5000, bonus: 100 },
    { volume: 10000, bonus: 250 },
    { volume: 50000, bonus: 1000 },
  ],
};

// Legacy constants for backwards compatibility
const REFERRAL_CODE_LENGTH = 8;
const DISCOUNT_TRANSACTIONS_PER_REFERRAL = 3;
const DISCOUNT_VOLUME_CAP = 10000;
const MINIMUM_ACTIVATION_AMOUNT = 500;
const DISCOUNT_PERCENTAGE = 0.5; // 50% off
const ELIGIBLE_FEE_TIER = 4.4; // Only <$10K tier gets discount
const DISCOUNTED_FEE = 2.2; // 50% off 4.4%

/**
 * Generate a unique alphanumeric referral code
 * @param {string} userId - User ID to generate code for
 * @returns {Promise<string>} Generated referral code
 */
export async function generateReferralCode(userId) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // SECURITY: Generate cryptographically secure random code
    code = '';
    const randomBytes = new Uint8Array(REFERRAL_CODE_LENGTH);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += characters.charAt(randomBytes[i] % characters.length);
    }

    // Check if code already exists
    const { data, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referral_code', code)
      .single();

    if (error && error.code === 'PGRST116') {
      // PGRST116 = no rows returned, code is unique
      isUnique = true;
    } else if (error) {
      throw new Error(`Error checking referral code uniqueness: ${error.message}`);
    }

    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique referral code after multiple attempts');
  }

  return code;
}

/**
 * Get existing referral code for user or create new one
 * @param {string} userId - User ID
 * @returns {Promise<string>} Referral code
 */
export async function getReferralCode(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Check if user already has a referral code
  const { data: existingReferral, error: fetchError } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', userId)
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Error fetching referral code: ${fetchError.message}`);
  }

  if (existingReferral) {
    return existingReferral.referral_code;
  }

  // Generate new code
  const code = await generateReferralCode(userId);

  // Store the code
  const { data: newReferral, error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: userId,
      referred_id: null, // Will be set when someone uses the code
      referral_code: code,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error creating referral code: ${insertError.message}`);
  }

  return newReferral.referral_code;
}

/**
 * Apply a referral code to a new user
 * @param {string} newUserId - ID of the new user
 * @param {string} referralCode - Referral code to apply
 * @returns {Promise<object>} Result of applying the code
 */
export async function applyReferralCode(newUserId, referralCode) {
  if (!newUserId || !referralCode) {
    throw new Error('User ID and referral code are required');
  }

  // Validate referral code exists
  const { data: referral, error: fetchError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', referralCode.toUpperCase())
    .single();

  if (fetchError) {
    throw new Error('Invalid referral code');
  }

  // Check if user is trying to use their own code
  if (referral.referrer_id === newUserId) {
    throw new Error('Cannot use your own referral code');
  }

  // Check if user already has been referred
  const { data: existingReferral, error: checkError } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', newUserId)
    .limit(1);

  if (checkError) {
    throw new Error(`Error checking existing referrals: ${checkError.message}`);
  }

  if (existingReferral && existingReferral.length > 0) {
    throw new Error('User has already been referred');
  }

  // Update the referral record to link the new user
  const { data: updatedReferral, error: updateError } = await supabase
    .from('referrals')
    .update({ referred_id: newUserId })
    .eq('referral_code', referralCode.toUpperCase())
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error applying referral code: ${updateError.message}`);
  }

  return {
    success: true,
    referral: updatedReferral,
    message: 'Referral code applied successfully'
  };
}

/**
 * Activate a referral when referred user completes first transaction
 * @param {string} referredUserId - ID of the referred user
 * @param {number} transactionAmount - Amount of first transaction
 * @returns {Promise<object>} Activation result
 */
async function activateReferral(referredUserId, transactionAmount) {
  if (transactionAmount < MINIMUM_ACTIVATION_AMOUNT) {
    return {
      activated: false,
      reason: `Transaction amount ($${transactionAmount}) below minimum ($${MINIMUM_ACTIVATION_AMOUNT})`
    };
  }

  // Find the referral record
  const { data: referral, error: fetchError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .single();

  if (fetchError) {
    throw new Error(`Error fetching referral: ${fetchError.message}`);
  }

  if (!referral) {
    return { activated: false, reason: 'No pending referral found' };
  }

  // Activate the referral
  const { data: activatedReferral, error: updateError } = await supabase
    .from('referrals')
    .update({
      status: 'active',
      first_transaction_amount: transactionAmount,
      activated_at: new Date().toISOString()
    })
    .eq('id', referral.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Error activating referral: ${updateError.message}`);
  }

  return {
    activated: true,
    referral: activatedReferral,
    discountUnlocked: {
      transactions: DISCOUNT_TRANSACTIONS_PER_REFERRAL,
      volumeCap: DISCOUNT_VOLUME_CAP,
      discountPercentage: DISCOUNT_PERCENTAGE * 100
    }
  };
}

/**
 * Get referral statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Referral statistics
 */
export async function getReferralStats(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get user's referral code
  const code = await getReferralCode(userId);

  // Get all referrals made by this user
  const { data: referrals, error: fetchError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId);

  if (fetchError) {
    throw new Error(`Error fetching referrals: ${fetchError.message}`);
  }

  // Get discount usage
  const { data: discountUsage, error: discountError } = await supabase
    .from('discount_usage')
    .select('*')
    .eq('user_id', userId);

  if (discountError) {
    throw new Error(`Error fetching discount usage: ${discountError.message}`);
  }

  // Calculate stats
  const totalReferrals = referrals.filter(r => r.referred_id).length;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending' && r.referred_id).length;

  const totalDiscountEarned = discountUsage.reduce((sum, usage) => sum + parseFloat(usage.discount_amount || 0), 0);
  const totalDiscountUsed = discountUsage.length;
  const totalVolumeUsed = discountUsage.reduce((sum, usage) => sum + parseFloat(usage.amount || 0), 0);

  // Calculate remaining discounts
  const transactionsRemaining = Math.max(0, (activeReferrals * DISCOUNT_TRANSACTIONS_PER_REFERRAL) - totalDiscountUsed);
  const volumeRemaining = Math.max(0, (activeReferrals * DISCOUNT_VOLUME_CAP) - totalVolumeUsed);

  return {
    referralCode: code,
    totalReferrals,
    activeReferrals,
    pendingReferrals,
    discounts: {
      earned: {
        transactions: activeReferrals * DISCOUNT_TRANSACTIONS_PER_REFERRAL,
        volume: activeReferrals * DISCOUNT_VOLUME_CAP
      },
      used: {
        transactions: totalDiscountUsed,
        volume: totalVolumeUsed,
        totalSaved: totalDiscountEarned
      },
      remaining: {
        transactions: transactionsRemaining,
        volume: volumeRemaining,
        hasAvailable: transactionsRemaining > 0 && volumeRemaining > 0
      }
    },
    referralDetails: referrals.map(r => ({
      id: r.id,
      status: r.status,
      referredUserId: r.referred_id,
      firstTransactionAmount: r.first_transaction_amount,
      activatedAt: r.activated_at,
      createdAt: r.created_at
    }))
  };
}

/**
 * Check if user is eligible for affiliate discount on a transaction
 * @param {string} userId - User ID
 * @param {number} transactionAmount - Transaction amount
 * @returns {Promise<object>} Eligibility details
 */
export async function checkDiscountEligibility(userId, transactionAmount = 0) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get user's discount balance
  const balance = await getUserDiscountBalance(userId);

  // Check if user has any discounts available
  if (!balance.hasAvailable) {
    return {
      eligible: false,
      reason: 'No discounts available',
      balance
    };
  }

  // Check transaction amount against volume remaining
  if (transactionAmount > balance.volumeRemaining) {
    return {
      eligible: false,
      reason: `Transaction amount ($${transactionAmount}) exceeds remaining volume cap ($${balance.volumeRemaining})`,
      balance,
      maxEligibleAmount: balance.volumeRemaining
    };
  }

  // Check if transaction is in eligible tier (<$10K)
  if (transactionAmount >= 10000) {
    return {
      eligible: false,
      reason: 'Discount only applies to transactions under $10,000',
      balance
    };
  }

  // Calculate discount
  const originalFee = transactionAmount * (ELIGIBLE_FEE_TIER / 100);
  const discountedFee = transactionAmount * (DISCOUNTED_FEE / 100);
  const savingsAmount = originalFee - discountedFee;

  return {
    eligible: true,
    discount: {
      percentage: DISCOUNT_PERCENTAGE * 100,
      originalFee,
      discountedFee,
      savingsAmount
    },
    balance
  };
}

/**
 * Record the usage of an affiliate discount
 * @param {string} userId - User ID using the discount
 * @param {string} transactionId - Transaction ID
 * @param {number} amount - Transaction amount
 * @returns {Promise<object>} Usage record
 */
export async function recordDiscountUsage(userId, transactionId, amount) {
  if (!userId || !transactionId || !amount) {
    throw new Error('User ID, transaction ID, and amount are required');
  }

  // Check eligibility first
  const eligibility = await checkDiscountEligibility(userId, amount);

  if (!eligibility.eligible) {
    throw new Error(`Not eligible for discount: ${eligibility.reason}`);
  }

  // Find an active referral for this user
  const { data: referral, error: referralError } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (referralError) {
    throw new Error(`Error finding active referral: ${referralError.message}`);
  }

  // Record the discount usage
  const { data: usage, error: insertError } = await supabase
    .from('discount_usage')
    .insert({
      user_id: userId,
      referral_id: referral.id,
      transaction_id: transactionId,
      amount: amount,
      discount_amount: eligibility.discount.savingsAmount
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error recording discount usage: ${insertError.message}`);
  }

  return {
    success: true,
    usage,
    applied: {
      originalFee: eligibility.discount.originalFee,
      discountedFee: eligibility.discount.discountedFee,
      saved: eligibility.discount.savingsAmount
    }
  };
}

/**
 * Get user's discount balance (remaining transactions and volume)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Discount balance
 */
export async function getUserDiscountBalance(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get all active referrals for this user
  const { data: activeReferrals, error: referralError } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', userId)
    .eq('status', 'active');

  if (referralError) {
    throw new Error(`Error fetching active referrals: ${referralError.message}`);
  }

  const activeReferralCount = activeReferrals?.length || 0;

  // Get all discount usage for this user
  const { data: usage, error: usageError } = await supabase
    .from('discount_usage')
    .select('*')
    .eq('user_id', userId);

  if (usageError) {
    throw new Error(`Error fetching discount usage: ${usageError.message}`);
  }

  const usageCount = usage?.length || 0;
  const volumeUsed = usage?.reduce((sum, u) => sum + parseFloat(u.amount || 0), 0) || 0;

  // Calculate totals
  const totalTransactionsAvailable = activeReferralCount * DISCOUNT_TRANSACTIONS_PER_REFERRAL;
  const totalVolumeAvailable = activeReferralCount * DISCOUNT_VOLUME_CAP;

  const transactionsRemaining = Math.max(0, totalTransactionsAvailable - usageCount);
  const volumeRemaining = Math.max(0, totalVolumeAvailable - volumeUsed);

  return {
    activeReferrals: activeReferralCount,
    totalTransactionsAvailable,
    totalVolumeAvailable,
    transactionsUsed: usageCount,
    volumeUsed,
    transactionsRemaining,
    volumeRemaining,
    hasAvailable: transactionsRemaining > 0 && volumeRemaining > 0,
    discountTier: {
      feeRate: DISCOUNTED_FEE,
      originalFeeRate: ELIGIBLE_FEE_TIER,
      savingsPercentage: DISCOUNT_PERCENTAGE * 100
    }
  };
}

/**
 * Check and activate referral when a referred user completes their first transaction
 * This should be called by the transaction service when a transaction is completed
 * @param {string} userId - User ID who completed the transaction
 * @param {number} amount - Transaction amount
 * @returns {Promise<object>} Activation result
 */
export async function checkAndActivateReferral(userId, amount) {
  if (!userId || !amount) {
    return { activated: false, reason: 'Missing user ID or amount' };
  }

  return await activateReferral(userId, amount);
}

// Export constants for use in other modules
export const REFERRAL_CONSTANTS = {
  CODE_LENGTH: REFERRAL_CODE_LENGTH,
  TRANSACTIONS_PER_REFERRAL: DISCOUNT_TRANSACTIONS_PER_REFERRAL,
  VOLUME_CAP: DISCOUNT_VOLUME_CAP,
  MINIMUM_ACTIVATION: MINIMUM_ACTIVATION_AMOUNT,
  DISCOUNT_PERCENTAGE: DISCOUNT_PERCENTAGE * 100,
  ELIGIBLE_FEE: ELIGIBLE_FEE_TIER,
  DISCOUNTED_FEE: DISCOUNTED_FEE
};

// ============================================
// V2: 3-TIER EARNING SYSTEM
// ============================================

/**
 * Record 3-tier referral earnings when a trade completes
 * @param {string} traderId - User who completed the trade
 * @param {number} feeAmount - Fee charged for the trade
 * @param {string} billId - Bill/transaction ID
 */
export async function recordReferralEarnings(traderId, feeAmount, billId) {
  if (!traderId || !feeAmount) return;

  // Find all referrers for this trader (up to 3 tiers)
  const { data: tier1Ref } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', traderId)
    .eq('status', 'active')
    .single();

  if (!tier1Ref) return;

  // Tier 1 earnings
  const tier1Earnings = feeAmount * COMMISSION_RATES.tier1;
  await recordEarning(tier1Ref.referrer_id, traderId, billId, feeAmount, tier1Earnings, 1);

  // Find Tier 2 (who referred the Tier 1 referrer)
  const { data: tier2Ref } = await supabase
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', tier1Ref.referrer_id)
    .eq('status', 'active')
    .single();

  if (tier2Ref) {
    const tier2Earnings = feeAmount * COMMISSION_RATES.tier2;
    await recordEarning(tier2Ref.referrer_id, traderId, billId, feeAmount, tier2Earnings, 2);

    // Find Tier 3
    const { data: tier3Ref } = await supabase
      .from('referrals')
      .select('referrer_id')
      .eq('referred_id', tier2Ref.referrer_id)
      .eq('status', 'active')
      .single();

    if (tier3Ref) {
      const tier3Earnings = feeAmount * COMMISSION_RATES.tier3;
      await recordEarning(tier3Ref.referrer_id, traderId, billId, feeAmount, tier3Earnings, 3);
    }
  }
}

/**
 * Record a single earning entry
 */
async function recordEarning(referrerId, traderId, billId, feeAmount, earnings, tier) {
  await supabase
    .from('referral_earnings')
    .insert({
      referrer_id: referrerId,
      trader_id: traderId,
      bill_id: billId,
      fee_amount: feeAmount,
      earnings_amount: earnings,
      tier: tier,
      status: 'pending', // Will be 'paid' after withdrawal
    });

  // Update referrer's pending balance
  await supabase.rpc('increment_referral_balance', {
    p_user_id: referrerId,
    p_amount: earnings,
  });
}

/**
 * Get earnings history for a user
 */
export async function getEarningsHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching earnings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get referral earnings summary by tier
 */
export async function getEarningsSummary(userId) {
  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('tier, earnings_amount')
    .eq('referrer_id', userId);

  const summary = { tier1: 0, tier2: 0, tier3: 0, total: 0 };

  earnings?.forEach((e) => {
    summary[`tier${e.tier}`] += e.earnings_amount;
    summary.total += e.earnings_amount;
  });

  return summary;
}

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('referral_earnings')
    .select('referrer_id, earnings_amount')
    .order('created_at', { ascending: false });

  if (error) return [];

  // Aggregate by referrer
  const totals = {};
  data?.forEach((e) => {
    totals[e.referrer_id] = (totals[e.referrer_id] || 0) + e.earnings_amount;
  });

  // Sort and limit
  const sorted = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  // Get profile info
  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, wallet_address')
    .in('id', userIds);

  return sorted.map(([userId, total], index) => {
    const profile = profiles?.find((p) => p.id === userId);
    return {
      rank: index + 1,
      userId,
      totalEarned: total,
      name: profile?.full_name || profile?.wallet_address?.slice(0, 8) + '...',
    };
  });
}

/**
 * Get referral link with tracking
 */
export function getReferralLink(referralCode) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://billhaven.app';
  return `${baseUrl}?ref=${referralCode}`;
}

export default {
  generateReferralCode,
  getReferralCode,
  applyReferralCode,
  getReferralStats,
  checkDiscountEligibility,
  recordDiscountUsage,
  getUserDiscountBalance,
  checkAndActivateReferral,
  // V2 3-Tier System
  recordReferralEarnings,
  getEarningsHistory,
  getEarningsSummary,
  getReferralLeaderboard,
  getReferralLink,
  // Constants
  REFERRAL_CONSTANTS,
  COMMISSION_RATES,
  REFERRAL_BONUSES,
};
