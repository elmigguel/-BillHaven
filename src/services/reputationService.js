/**
 * Reputation Service - Trust & Verification System
 * Like Paxful/LocalBitcoins reputation but BETTER
 *
 * Features:
 * - Trust score (0-100)
 * - Trade history & volume
 * - User reviews & ratings
 * - Verification badges
 * - Trade response time
 * - Dispute rate tracking
 */

import { supabase } from '@/lib/supabase'

// Trust level definitions
export const TRUST_LEVELS = {
  new: { min: 0, max: 0, name: 'New Trader', color: 'gray', icon: '🆕' },
  beginner: { min: 1, max: 5, name: 'Beginner', color: 'blue', icon: '🌱' },
  trusted: { min: 6, max: 20, name: 'Trusted', color: 'green', icon: '✅' },
  verified: { min: 21, max: 50, name: 'Verified Trader', color: 'purple', icon: '💎' },
  expert: { min: 51, max: 100, name: 'Expert Trader', color: 'gold', icon: '⭐' },
  elite: { min: 101, max: Infinity, name: 'Elite Trader', color: 'rainbow', icon: '👑' },
}

// Verification badges
export const VERIFICATION_BADGES = {
  wallet_verified: {
    id: 'wallet_verified',
    name: 'Wallet Verified',
    icon: '🔐',
    description: 'Connected and verified wallet address',
    auto: true,
  },
  email_verified: {
    id: 'email_verified',
    name: 'Email Verified',
    icon: '📧',
    description: 'Email address verified',
    auto: true,
  },
  phone_verified: {
    id: 'phone_verified',
    name: 'Phone Verified',
    icon: '📱',
    description: 'Phone number verified',
    auto: false,
  },
  id_verified: {
    id: 'id_verified',
    name: 'ID Verified',
    icon: '🪪',
    description: 'Government ID verified (optional)',
    auto: false,
  },
  trade_100: {
    id: 'trade_100',
    name: '100 Trades',
    icon: '💯',
    description: 'Completed 100+ successful trades',
    auto: true,
  },
  trade_500: {
    id: 'trade_500',
    name: '500 Trades',
    icon: '🏆',
    description: 'Completed 500+ successful trades',
    auto: true,
  },
  volume_10k: {
    id: 'volume_10k',
    name: '$10K+ Volume',
    icon: '💰',
    description: 'Traded $10,000+ total volume',
    auto: true,
  },
  volume_100k: {
    id: 'volume_100k',
    name: '$100K+ Volume',
    icon: '🐋',
    description: 'Traded $100,000+ total volume',
    auto: true,
  },
  fast_responder: {
    id: 'fast_responder',
    name: 'Fast Responder',
    icon: '⚡',
    description: 'Average response time under 5 minutes',
    auto: true,
  },
  zero_disputes: {
    id: 'zero_disputes',
    name: 'Zero Disputes',
    icon: '🕊️',
    description: 'No disputes in last 100 trades',
    auto: true,
  },
  og_trader: {
    id: 'og_trader',
    name: 'OG Trader',
    icon: '🎖️',
    description: 'Trading since platform launch',
    auto: true,
  },
}

/**
 * Calculate trust score based on various factors
 */
export function calculateTrustScore(stats) {
  let score = 0

  // Base score from completed trades (max 30 points)
  score += Math.min(stats.completedTrades * 0.3, 30)

  // Positive review percentage (max 25 points)
  if (stats.totalReviews > 0) {
    const positiveRate = stats.positiveReviews / stats.totalReviews
    score += positiveRate * 25
  }

  // Trade volume score (max 20 points)
  if (stats.totalVolume > 0) {
    const volumeScore = Math.log10(stats.totalVolume) * 3
    score += Math.min(volumeScore, 20)
  }

  // Account age bonus (max 10 points)
  const accountAgeDays = stats.accountAgeDays || 0
  score += Math.min(accountAgeDays / 36.5, 10) // 1 year = 10 points

  // Response time bonus (max 10 points)
  if (stats.avgResponseTime && stats.avgResponseTime < 300) { // Under 5 min
    score += 10
  } else if (stats.avgResponseTime && stats.avgResponseTime < 900) { // Under 15 min
    score += 5
  }

  // Dispute penalty
  if (stats.disputeRate > 0) {
    score -= stats.disputeRate * 20 // Heavy penalty for disputes
  }

  // Verification bonuses (max 5 points)
  if (stats.walletVerified) score += 2
  if (stats.emailVerified) score += 1
  if (stats.phoneVerified) score += 1
  if (stats.idVerified) score += 1

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Get trust level from score
 */
export function getTrustLevel(completedTrades) {
  for (const [key, level] of Object.entries(TRUST_LEVELS)) {
    if (completedTrades >= level.min && completedTrades <= level.max) {
      return { ...level, key }
    }
  }
  return TRUST_LEVELS.new
}

/**
 * Get user reputation profile
 */
export async function getUserReputation(userId) {
  if (!userId) return null

  // Get or create reputation record
  let { data, error } = await supabase
    .from('user_reputations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // Create new reputation record
    const { data: newData, error: createError } = await supabase
      .from('user_reputations')
      .insert({
        user_id: userId,
        trust_score: 0,
        completed_trades: 0,
        total_volume: 0,
        positive_reviews: 0,
        negative_reviews: 0,
        neutral_reviews: 0,
        avg_response_time: null,
        dispute_count: 0,
        badges: ['wallet_verified'],
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating reputation:', createError)
      return null
    }
    data = newData
  }

  if (!data) return null

  // Calculate derived fields
  const totalReviews = (data.positive_reviews || 0) + (data.negative_reviews || 0) + (data.neutral_reviews || 0)
  const positiveRate = totalReviews > 0 ? (data.positive_reviews / totalReviews) * 100 : 0
  const trustLevel = getTrustLevel(data.completed_trades)

  return {
    ...data,
    totalReviews,
    positiveRate,
    trustLevel,
    badges: data.badges || [],
  }
}

/**
 * Get user reviews
 */
export async function getUserReviews(userId, limit = 10) {
  const { data, error } = await supabase
    .from('user_reviews')
    .select(`
      *,
      reviewer:reviewer_id(id, profiles(full_name, wallet_address))
    `)
    .eq('reviewed_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching reviews:', error)
    return []
  }

  return data || []
}

/**
 * Submit a review after trade
 */
export async function submitReview(reviewerId, reviewedUserId, billId, rating, comment) {
  // Rating: 1 = negative, 2 = neutral, 3 = positive

  const { data, error } = await supabase
    .from('user_reviews')
    .insert({
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      bill_id: billId,
      rating,
      comment,
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting review:', error)
    throw error
  }

  // Update reputation counts
  const updateField = rating === 3 ? 'positive_reviews' :
                      rating === 1 ? 'negative_reviews' : 'neutral_reviews'

  await supabase.rpc('increment_reputation_field', {
    p_user_id: reviewedUserId,
    p_field: updateField,
  })

  // Recalculate trust score
  await recalculateTrustScore(reviewedUserId)

  return data
}

/**
 * Update reputation after trade completion
 */
export async function recordTradeCompletion(userId, tradeVolume, responseTime) {
  const { data, error } = await supabase
    .from('user_reputations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return

  // Calculate new average response time
  const currentAvg = data.avg_response_time || responseTime
  const tradeCount = data.completed_trades || 0
  const newAvg = (currentAvg * tradeCount + responseTime) / (tradeCount + 1)

  // Update reputation
  const { error: updateError } = await supabase
    .from('user_reputations')
    .update({
      completed_trades: tradeCount + 1,
      total_volume: (data.total_volume || 0) + tradeVolume,
      avg_response_time: Math.round(newAvg),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating reputation:', updateError)
  }

  // Check for new badges
  await checkAndAwardBadges(userId)
  await recalculateTrustScore(userId)
}

/**
 * Check and award automatic badges
 */
export async function checkAndAwardBadges(userId) {
  const rep = await getUserReputation(userId)
  if (!rep) return

  const newBadges = [...(rep.badges || [])]

  // Trade count badges
  if (rep.completed_trades >= 100 && !newBadges.includes('trade_100')) {
    newBadges.push('trade_100')
  }
  if (rep.completed_trades >= 500 && !newBadges.includes('trade_500')) {
    newBadges.push('trade_500')
  }

  // Volume badges
  if (rep.total_volume >= 10000 && !newBadges.includes('volume_10k')) {
    newBadges.push('volume_10k')
  }
  if (rep.total_volume >= 100000 && !newBadges.includes('volume_100k')) {
    newBadges.push('volume_100k')
  }

  // Fast responder
  if (rep.avg_response_time && rep.avg_response_time < 300 && !newBadges.includes('fast_responder')) {
    newBadges.push('fast_responder')
  }

  // Zero disputes (only if 10+ trades)
  if (rep.completed_trades >= 10 && rep.dispute_count === 0 && !newBadges.includes('zero_disputes')) {
    newBadges.push('zero_disputes')
  }

  // Update if new badges added
  if (newBadges.length > (rep.badges || []).length) {
    await supabase
      .from('user_reputations')
      .update({ badges: newBadges })
      .eq('user_id', userId)
  }
}

/**
 * Recalculate and update trust score
 */
export async function recalculateTrustScore(userId) {
  const rep = await getUserReputation(userId)
  if (!rep) return

  // Get account age
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at, wallet_address')
    .eq('id', userId)
    .single()

  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const stats = {
    completedTrades: rep.completed_trades || 0,
    totalReviews: rep.totalReviews || 0,
    positiveReviews: rep.positive_reviews || 0,
    totalVolume: rep.total_volume || 0,
    accountAgeDays,
    avgResponseTime: rep.avg_response_time,
    disputeRate: rep.completed_trades > 0 ? rep.dispute_count / rep.completed_trades : 0,
    walletVerified: !!profile?.wallet_address,
    emailVerified: true, // From Supabase auth
    phoneVerified: rep.badges?.includes('phone_verified'),
    idVerified: rep.badges?.includes('id_verified'),
  }

  const newScore = calculateTrustScore(stats)

  await supabase
    .from('user_reputations')
    .update({ trust_score: newScore })
    .eq('user_id', userId)
}

/**
 * Get leaderboard by reputation
 */
export async function getReputationLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('user_reputations')
    .select(`
      *,
      profiles!inner(full_name, wallet_address)
    `)
    .order('trust_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching reputation leaderboard:', error)
    return []
  }

  return data?.map(rep => ({
    ...rep,
    trustLevel: getTrustLevel(rep.completed_trades),
  })) || []
}

export default {
  TRUST_LEVELS,
  VERIFICATION_BADGES,
  calculateTrustScore,
  getTrustLevel,
  getUserReputation,
  getUserReviews,
  submitReview,
  recordTradeCompletion,
  checkAndAwardBadges,
  recalculateTrustScore,
  getReputationLeaderboard,
}
