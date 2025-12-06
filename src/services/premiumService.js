/**
 * Premium Service - Subscription Tiers for BillHaven
 *
 * Tiers:
 * - Free: 4.4% fee (competitive rate)
 * - Silver (€14/mo): 3.5% fee, priority support
 * - Gold (€29/mo): 2.5% fee, instant release, analytics
 * - Platinum (€79/mo): 1.5% fee, API access, white-glove service
 *
 * Additional fees: $3 withdrawal, 2% invoice factoring, 5% gift cards
 */

import { supabase } from '@/lib/supabase'

// Premium tier definitions - UPDATED FOR PROFITABILITY
export const PREMIUM_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    platformFee: 4.4, // % - Optimized for competitiveness
    color: 'gray',
    icon: '🆓',
    features: [
      'Up to 5 bills per month',
      'Standard support (48h response)',
      '12 blockchain networks',
      'Basic dashboard',
      'Community features',
    ],
    limits: {
      billsPerMonth: 5,
      maxBillAmount: 2500,
      supportResponseHours: 48,
    },
  },

  silver: {
    id: 'silver',
    name: 'Silver',
    price: 14,
    priceMonthly: 14,
    priceYearly: 129, // ~2 months free
    platformFee: 3.5, // %
    color: 'slate',
    icon: '🥈',
    popular: false,
    features: [
      'Up to 25 bills per month',
      'Priority support (24h response)',
      '12 blockchain networks',
      'Advanced dashboard',
      '20% lower fees (3.5%)',
      'Invoice Assignment access',
    ],
    limits: {
      billsPerMonth: 25,
      maxBillAmount: 10000,
      supportResponseHours: 24,
    },
  },

  gold: {
    id: 'gold',
    name: 'Gold',
    price: 29,
    priceMonthly: 29,
    priceYearly: 279, // ~2 months free
    platformFee: 2.5, // %
    color: 'amber',
    icon: '🥇',
    popular: true, // Best value badge
    features: [
      'Unlimited bills',
      'VIP support (4h response)',
      'Express Trading (instant match)',
      'Advanced analytics',
      'Transaction history export',
      '43% lower fees (2.5%)',
      'Invoice Factoring access',
      'Gift Card trading',
    ],
    limits: {
      billsPerMonth: Infinity,
      maxBillAmount: 50000,
      supportResponseHours: 4,
    },
  },

  platinum: {
    id: 'platinum',
    name: 'Platinum',
    price: 79,
    priceMonthly: 79,
    priceYearly: 749, // ~2 months free
    platformFee: 1.5, // %
    color: 'violet',
    icon: '💎',
    popular: false,
    features: [
      'Everything in Gold',
      'White-glove support (1h response)',
      'API access for integrations',
      'Custom invoicing & branding',
      'Dedicated account manager',
      'Priority dispute resolution',
      '66% lower fees (1.5%)',
      'OTC desk access (large trades)',
      'Tax documentation package',
    ],
    limits: {
      billsPerMonth: Infinity,
      maxBillAmount: Infinity,
      supportResponseHours: 1,
    },
  },
}

// Additional fee types for extra revenue (like major exchanges)
export const ADDITIONAL_FEES = {
  invoiceFactoring: 2.0,      // % fee on invoice assignments
  expressTrading: 0.5,        // % premium for instant match
  giftCardPremium: 5.0,       // % premium on gift card trades
  withdrawalFee: 3.0,         // $ flat fee per withdrawal (standard for exchanges)
  disputeResolution: 25,      // $ flat fee if user loses dispute
  priorityListing: 5,         // $ to feature bill at top
  documentGeneration: 2,      // $ per tax document generated
  escrowExtension: 10,        // $ to extend escrow time
  rushProcessing: 15,         // $ for priority processing
}

// Get tier by ID
export function getTier(tierId) {
  return PREMIUM_TIERS[tierId] || PREMIUM_TIERS.free
}

// Get all tiers as array
export function getAllTiers() {
  return Object.values(PREMIUM_TIERS)
}

// Get fee discount percentage compared to free tier
export function getFeeDiscount(tierId) {
  const freeFee = PREMIUM_TIERS.free.platformFee
  const tierFee = getTier(tierId).platformFee
  return Math.round(((freeFee - tierFee) / freeFee) * 100)
}

// Calculate savings per month based on volume
export function calculateMonthlySavings(tierId, monthlyVolume) {
  const freeFee = PREMIUM_TIERS.free.platformFee / 100
  const tierFee = getTier(tierId).platformFee / 100
  const tier = getTier(tierId)

  const feeSavings = (freeFee - tierFee) * monthlyVolume
  const netSavings = feeSavings - tier.priceMonthly

  return {
    feeSavings,
    subscriptionCost: tier.priceMonthly,
    netSavings,
    worthIt: netSavings > 0,
    breakEvenVolume: tier.priceMonthly / (freeFee - tierFee),
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId) {
  if (!userId) return { tier: 'free', subscription: null }

  const { data, error } = await supabase
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error)
  }

  return {
    tier: data?.tier || 'free',
    subscription: data,
  }
}

/**
 * Get user's effective platform fee (considering tier + streak discounts)
 */
export async function getUserPlatformFee(userId, streakDiscount = 0) {
  const { tier } = await getUserSubscription(userId)
  const tierData = getTier(tier)

  // Apply streak discount on top of tier fee
  let effectiveFee = tierData.platformFee
  if (streakDiscount > 0) {
    effectiveFee = effectiveFee * (1 - streakDiscount / 100)
  }

  return {
    baseFee: tierData.platformFee,
    tierDiscount: PREMIUM_TIERS.free.platformFee - tierData.platformFee,
    streakDiscount: streakDiscount > 0 ? tierData.platformFee * (streakDiscount / 100) : 0,
    effectiveFee: Math.max(0.5, effectiveFee), // Minimum 0.5% fee
    tier,
  }
}

/**
 * Create a subscription (manual - for crypto payments)
 */
export async function createSubscription(userId, tierId, durationMonths = 1) {
  const tier = getTier(tierId)
  if (tier.id === 'free') {
    throw new Error('Cannot subscribe to free tier')
  }

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths)

  // Cancel any existing active subscription first
  await supabase
    .from('premium_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('premium_subscriptions')
    .insert({
      user_id: userId,
      tier: tierId,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: durationMonths === 12 ? tier.priceYearly : tier.priceMonthly * durationMonths,
      payment_method: 'crypto',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId) {
  const { data, error } = await supabase
    .from('premium_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'active')
    .select()
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

/**
 * Check if user can create more bills this month (for free tier)
 */
export async function checkBillLimit(userId) {
  const { tier } = await getUserSubscription(userId)
  const tierData = getTier(tier)

  if (tierData.limits.billsPerMonth === Infinity) {
    return { canCreate: true, remaining: Infinity }
  }

  // Count bills this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('Error counting bills:', error)
    return { canCreate: true, remaining: tierData.limits.billsPerMonth }
  }

  const remaining = tierData.limits.billsPerMonth - (count || 0)

  return {
    canCreate: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: tierData.limits.billsPerMonth,
  }
}

export default {
  PREMIUM_TIERS,
  getTier,
  getAllTiers,
  getFeeDiscount,
  calculateMonthlySavings,
  getUserSubscription,
  getUserPlatformFee,
  createSubscription,
  cancelSubscription,
  checkBillLimit,
}
