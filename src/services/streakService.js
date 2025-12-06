/**
 * Streak Service - Duolingo-style gamification for BillHaven
 * UNIQUE FEATURE - No other crypto platform has this!
 */

import { supabase } from '@/lib/supabase'

// XP rewards for different actions
export const XP_REWARDS = {
  DAILY_LOGIN: 10,
  COMPLETE_TRADE: 50,
  FIRST_TRADE: 100,
  REFER_FRIEND: 200,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
  STREAK_100_DAYS: 2000,
}

// Streak milestones with rewards
export const STREAK_MILESTONES = [
  { days: 7, badge: 'week_warrior', xp: 100, feeDiscount: 5 },
  { days: 14, badge: 'two_week_titan', xp: 200, feeDiscount: 7 },
  { days: 30, badge: 'monthly_master', xp: 500, feeDiscount: 10 },
  { days: 60, badge: 'sixty_day_sage', xp: 1000, feeDiscount: 12 },
  { days: 100, badge: 'century_champion', xp: 2000, feeDiscount: 15 },
  { days: 365, badge: 'yearly_legend', xp: 10000, feeDiscount: 20 },
]

// Badge definitions
export const BADGES = {
  week_warrior: { name: 'Week Warrior', icon: '🔥', color: '#F59E0B' },
  two_week_titan: { name: 'Two Week Titan', icon: '⚡', color: '#3B82F6' },
  monthly_master: { name: 'Monthly Master', icon: '🏆', color: '#8B5CF6' },
  sixty_day_sage: { name: 'Sixty Day Sage', icon: '💎', color: '#EC4899' },
  century_champion: { name: 'Century Champion', icon: '👑', color: '#F59E0B' },
  yearly_legend: { name: 'Yearly Legend', icon: '🌟', color: '#10B981' },
  first_trade: { name: 'First Trade', icon: '🎯', color: '#6366F1' },
  whale: { name: 'Whale', icon: '🐋', color: '#0EA5E9' },
  referral_king: { name: 'Referral King', icon: '👥', color: '#F97316' },
}

/**
 * Get or create user streak data
 */
export async function getUserStreak(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // No streak record, create one
    return createUserStreak(userId)
  }

  return data
}

/**
 * Create initial streak record for new user
 */
export async function createUserStreak(userId) {
  const { data, error } = await supabase
    .from('user_streaks')
    .insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      total_xp: 0,
      last_activity_date: null,
      badges: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating streak:', error)
    return null
  }

  return data
}

/**
 * Record daily activity and update streak
 */
export async function recordDailyActivity(userId) {
  const streak = await getUserStreak(userId)
  if (!streak) return null

  const today = new Date().toISOString().split('T')[0]
  const lastActivity = streak.last_activity_date

  let newStreak = streak.current_streak
  let xpEarned = 0
  let newBadges = [...(streak.badges || [])]

  if (lastActivity === today) {
    // Already logged today
    return { ...streak, alreadyLogged: true }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastActivity === yesterdayStr) {
    // Continue streak
    newStreak = streak.current_streak + 1
    xpEarned = XP_REWARDS.DAILY_LOGIN
  } else if (!lastActivity) {
    // First activity ever
    newStreak = 1
    xpEarned = XP_REWARDS.DAILY_LOGIN + XP_REWARDS.FIRST_TRADE
    newBadges.push('first_trade')
  } else {
    // Streak broken, start over
    newStreak = 1
    xpEarned = XP_REWARDS.DAILY_LOGIN
  }

  // Check for milestone badges
  for (const milestone of STREAK_MILESTONES) {
    if (newStreak >= milestone.days && !newBadges.includes(milestone.badge)) {
      newBadges.push(milestone.badge)
      xpEarned += milestone.xp
    }
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak)

  const { data, error } = await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      total_xp: streak.total_xp + xpEarned,
      last_activity_date: today,
      badges: newBadges,
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating streak:', error)
    return null
  }

  return {
    ...data,
    xpEarned,
    newBadges: newBadges.filter(b => !streak.badges?.includes(b)),
    streakContinued: lastActivity === yesterdayStr,
  }
}

/**
 * Add XP for completing a trade
 */
export async function addTradeXP(userId, tradeValue) {
  const streak = await getUserStreak(userId)
  if (!streak) return null

  let xpEarned = XP_REWARDS.COMPLETE_TRADE
  let newBadges = [...(streak.badges || [])]

  // Bonus XP for large trades (whale badge)
  if (tradeValue >= 10000 && !newBadges.includes('whale')) {
    newBadges.push('whale')
    xpEarned += 500
  }

  const { data, error } = await supabase
    .from('user_streaks')
    .update({
      total_xp: streak.total_xp + xpEarned,
      badges: newBadges,
    })
    .eq('user_id', userId)
    .select()
    .single()

  return { ...data, xpEarned }
}

/**
 * Get fee discount based on streak
 */
export function getStreakDiscount(currentStreak) {
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak >= STREAK_MILESTONES[i].days) {
      return STREAK_MILESTONES[i].feeDiscount
    }
  }
  return 0
}

/**
 * Get leaderboard (top users by XP)
 */
export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('user_streaks')
    .select(`
      user_id,
      current_streak,
      total_xp,
      badges,
      profiles!inner(full_name, avatar_url)
    `)
    .order('total_xp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data
}

/**
 * Get user rank on leaderboard
 */
export async function getUserRank(userId) {
  const { data, error } = await supabase
    .rpc('get_user_xp_rank', { target_user_id: userId })

  if (error) {
    console.error('Error getting rank:', error)
    return null
  }

  return data
}

export default {
  getUserStreak,
  recordDailyActivity,
  addTradeXP,
  getStreakDiscount,
  getLeaderboard,
  getUserRank,
  XP_REWARDS,
  STREAK_MILESTONES,
  BADGES,
}
