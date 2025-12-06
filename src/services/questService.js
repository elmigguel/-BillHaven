/**
 * Quest Service - Gamified Tasks for User Engagement
 * Like Layer3/Galxe quests - keeps users coming back
 *
 * Quest Types:
 * - Daily quests (refresh daily)
 * - Weekly quests (bigger rewards)
 * - Achievement quests (one-time)
 * - Special event quests (limited time)
 */

import { supabase } from '@/lib/supabase'

// Quest definitions
export const QUEST_DEFINITIONS = {
  // ========== DAILY QUESTS ==========
  daily_login: {
    id: 'daily_login',
    type: 'daily',
    title: 'Daily Check-in',
    description: 'Log in to BillHaven',
    xp: 10,
    icon: '📅',
    autoComplete: true,
  },
  daily_view_bills: {
    id: 'daily_view_bills',
    type: 'daily',
    title: 'Market Explorer',
    description: 'View 5 bills on the marketplace',
    xp: 15,
    requirement: 5,
    icon: '👀',
  },
  daily_share: {
    id: 'daily_share',
    type: 'daily',
    title: 'Social Butterfly',
    description: 'Share your referral link',
    xp: 20,
    icon: '🦋',
  },

  // ========== WEEKLY QUESTS ==========
  weekly_trade: {
    id: 'weekly_trade',
    type: 'weekly',
    title: 'Weekly Trader',
    description: 'Complete 3 trades this week',
    xp: 100,
    requirement: 3,
    icon: '📊',
  },
  weekly_volume: {
    id: 'weekly_volume',
    type: 'weekly',
    title: 'Volume King',
    description: 'Trade $1,000+ this week',
    xp: 150,
    requirement: 1000,
    icon: '👑',
  },
  weekly_referral: {
    id: 'weekly_referral',
    type: 'weekly',
    title: 'Invite Master',
    description: 'Refer 2 new users this week',
    xp: 200,
    requirement: 2,
    icon: '🎯',
  },

  // ========== ACHIEVEMENT QUESTS (One-time) ==========
  first_trade: {
    id: 'first_trade',
    type: 'achievement',
    title: 'First Steps',
    description: 'Complete your first trade',
    xp: 100,
    icon: '🚀',
    badge: 'first_trade',
  },
  verify_wallet: {
    id: 'verify_wallet',
    type: 'achievement',
    title: 'Wallet Verified',
    description: 'Connect and verify your wallet',
    xp: 50,
    icon: '🔐',
    badge: 'wallet_verified',
  },
  trade_10: {
    id: 'trade_10',
    type: 'achievement',
    title: 'Experienced Trader',
    description: 'Complete 10 trades',
    xp: 250,
    requirement: 10,
    icon: '⭐',
  },
  trade_50: {
    id: 'trade_50',
    type: 'achievement',
    title: 'Trade Veteran',
    description: 'Complete 50 trades',
    xp: 500,
    requirement: 50,
    icon: '🏆',
  },
  trade_100: {
    id: 'trade_100',
    type: 'achievement',
    title: 'Trade Master',
    description: 'Complete 100 trades',
    xp: 1000,
    requirement: 100,
    icon: '💎',
    badge: 'trade_100',
  },
  volume_1k: {
    id: 'volume_1k',
    type: 'achievement',
    title: 'Thousand Club',
    description: 'Trade $1,000+ total volume',
    xp: 100,
    requirement: 1000,
    icon: '💰',
  },
  volume_10k: {
    id: 'volume_10k',
    type: 'achievement',
    title: 'Big Player',
    description: 'Trade $10,000+ total volume',
    xp: 500,
    requirement: 10000,
    icon: '🐳',
    badge: 'volume_10k',
  },
  volume_100k: {
    id: 'volume_100k',
    type: 'achievement',
    title: 'Whale Status',
    description: 'Trade $100,000+ total volume',
    xp: 2000,
    requirement: 100000,
    icon: '🌊',
    badge: 'volume_100k',
  },
  streak_7: {
    id: 'streak_7',
    type: 'achievement',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    xp: 100,
    requirement: 7,
    icon: '🔥',
    badge: 'week_warrior',
  },
  streak_30: {
    id: 'streak_30',
    type: 'achievement',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    xp: 500,
    requirement: 30,
    icon: '🔥',
    badge: 'monthly_master',
  },
  referral_5: {
    id: 'referral_5',
    type: 'achievement',
    title: 'Referral Pro',
    description: 'Refer 5 active users',
    xp: 300,
    requirement: 5,
    icon: '👥',
  },
  referral_20: {
    id: 'referral_20',
    type: 'achievement',
    title: 'Ambassador',
    description: 'Refer 20 active users',
    xp: 1000,
    requirement: 20,
    icon: '🎖️',
    badge: 'referral_king',
  },
  perfect_rating: {
    id: 'perfect_rating',
    type: 'achievement',
    title: 'Perfect Record',
    description: '100% positive reviews (min 10)',
    xp: 500,
    requirement: 10,
    icon: '⭐',
  },
  fast_responder: {
    id: 'fast_responder',
    type: 'achievement',
    title: 'Lightning Fast',
    description: 'Average response time under 5 minutes',
    xp: 200,
    icon: '⚡',
    badge: 'fast_responder',
  },
}

/**
 * Get user's active quests and progress
 */
export async function getUserQuests(userId) {
  if (!userId) return { daily: [], weekly: [], achievements: [] }

  // Get user's quest progress
  const { data: progress } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId)

  const progressMap = {}
  progress?.forEach(p => {
    progressMap[p.quest_id] = p
  })

  // Get user stats for calculating progress
  const { data: reputation } = await supabase
    .from('user_reputations')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: referralStats } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', userId)
    .eq('status', 'active')

  // Build quest lists with progress
  const daily = []
  const weekly = []
  const achievements = []

  for (const [id, quest] of Object.entries(QUEST_DEFINITIONS)) {
    const userProgress = progressMap[id]
    const isCompleted = userProgress?.status === 'completed'
    const currentProgress = userProgress?.progress || 0

    // Calculate auto-progress for some quests
    let autoProgress = currentProgress
    if (!isCompleted) {
      if (id === 'trade_10' || id === 'trade_50' || id === 'trade_100') {
        autoProgress = reputation?.completed_trades || 0
      } else if (id === 'volume_1k' || id === 'volume_10k' || id === 'volume_100k') {
        autoProgress = reputation?.total_volume || 0
      } else if (id === 'streak_7' || id === 'streak_30') {
        autoProgress = streak?.current_streak || 0
      } else if (id === 'referral_5' || id === 'referral_20') {
        autoProgress = referralStats?.length || 0
      }
    }

    const questWithProgress = {
      ...quest,
      progress: autoProgress,
      isCompleted,
      completedAt: userProgress?.completed_at,
    }

    if (quest.type === 'daily') daily.push(questWithProgress)
    else if (quest.type === 'weekly') weekly.push(questWithProgress)
    else achievements.push(questWithProgress)
  }

  return { daily, weekly, achievements }
}

/**
 * Complete a quest
 */
export async function completeQuest(userId, questId) {
  const quest = QUEST_DEFINITIONS[questId]
  if (!quest) throw new Error('Quest not found')

  // Check if already completed
  const { data: existing } = await supabase
    .from('user_quests')
    .select('status')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .single()

  if (existing?.status === 'completed') {
    return { success: false, error: 'Quest already completed' }
  }

  // Mark as completed
  const { error } = await supabase
    .from('user_quests')
    .upsert({
      user_id: userId,
      quest_id: questId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })

  if (error) throw error

  // Award XP
  await supabase.rpc('add_user_xp', {
    p_user_id: userId,
    p_xp: quest.xp,
  })

  // Award badge if applicable
  if (quest.badge) {
    await supabase.rpc('add_user_badge', {
      p_user_id: userId,
      p_badge: quest.badge,
    })
  }

  return { success: true, xpAwarded: quest.xp, badge: quest.badge }
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(userId, questId, progress) {
  const quest = QUEST_DEFINITIONS[questId]
  if (!quest) return

  const { error } = await supabase
    .from('user_quests')
    .upsert({
      user_id: userId,
      quest_id: questId,
      progress,
      status: progress >= (quest.requirement || 1) ? 'completed' : 'in_progress',
      completed_at: progress >= (quest.requirement || 1) ? new Date().toISOString() : null,
    })

  if (error) console.error('Error updating quest progress:', error)

  // Check if now completed
  if (progress >= (quest.requirement || 1)) {
    await completeQuest(userId, questId)
  }
}

/**
 * Check and complete auto-complete quests
 */
export async function checkAutoCompleteQuests(userId) {
  const autoQuests = ['daily_login', 'verify_wallet']

  for (const questId of autoQuests) {
    await completeQuest(userId, questId).catch(() => {})
  }
}

/**
 * Reset daily quests (call via cron at midnight)
 */
export async function resetDailyQuests() {
  const dailyQuestIds = Object.entries(QUEST_DEFINITIONS)
    .filter(([_, q]) => q.type === 'daily')
    .map(([id]) => id)

  await supabase
    .from('user_quests')
    .delete()
    .in('quest_id', dailyQuestIds)
}

/**
 * Reset weekly quests (call via cron on Monday)
 */
export async function resetWeeklyQuests() {
  const weeklyQuestIds = Object.entries(QUEST_DEFINITIONS)
    .filter(([_, q]) => q.type === 'weekly')
    .map(([id]) => id)

  await supabase
    .from('user_quests')
    .delete()
    .in('quest_id', weeklyQuestIds)
}

/**
 * Get quest completion stats
 */
export async function getQuestStats(userId) {
  const { data } = await supabase
    .from('user_quests')
    .select('quest_id, status')
    .eq('user_id', userId)
    .eq('status', 'completed')

  const completedCount = data?.length || 0
  const totalQuests = Object.keys(QUEST_DEFINITIONS).length

  // Calculate total XP from quests
  let totalXP = 0
  data?.forEach(q => {
    const quest = QUEST_DEFINITIONS[q.quest_id]
    if (quest) totalXP += quest.xp
  })

  return {
    completedCount,
    totalQuests,
    completionRate: totalQuests > 0 ? (completedCount / totalQuests) * 100 : 0,
    totalXPFromQuests: totalXP,
  }
}

export default {
  QUEST_DEFINITIONS,
  getUserQuests,
  completeQuest,
  updateQuestProgress,
  checkAutoCompleteQuests,
  resetDailyQuests,
  resetWeeklyQuests,
  getQuestStats,
}
