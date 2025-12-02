/**
 * BillHaven Referral Service
 *
 * Handles referral code generation, tracking, and affiliate discount management.
 *
 * AFFILIATE DISCOUNT RULES:
 * - Per successful referral: 3 discounted transactions
 * - Volume cap: $10,000 MAX TOTAL across those 3 transactions
 * - Discount: 50% off ONLY on <$10K tier (4.4% → 2.2%)
 * - Minimum referral: Friend must complete >$500 transaction to activate
 */

import { supabase } from '../lib/supabase';

// Constants
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
    // Generate random code
    code = '';
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
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

export default {
  generateReferralCode,
  getReferralCode,
  applyReferralCode,
  getReferralStats,
  checkDiscountEligibility,
  recordDiscountUsage,
  getUserDiscountBalance,
  checkAndActivateReferral,
  REFERRAL_CONSTANTS
};
