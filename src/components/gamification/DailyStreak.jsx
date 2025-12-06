/**
 * DailyStreak - Duolingo-style streak counter
 * UNIQUE to BillHaven - no other crypto platform has this!
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, Star, Zap, Gift, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserStreak,
  recordDailyActivity,
  getStreakDiscount,
  STREAK_MILESTONES,
  BADGES
} from '@/services/streakService'

// Streak fire colors based on streak length
const getFireColor = (streak) => {
  if (streak >= 100) return 'from-purple-500 to-pink-500'
  if (streak >= 30) return 'from-yellow-400 to-orange-500'
  if (streak >= 7) return 'from-orange-400 to-red-500'
  return 'from-gray-400 to-gray-500'
}

export default function DailyStreak({ compact = false }) {
  const { user } = useAuth()
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReward, setShowReward] = useState(false)
  const [xpGained, setXpGained] = useState(0)

  useEffect(() => {
    if (user) {
      loadStreak()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadStreak = async () => {
    try {
      const data = await getUserStreak(user.id)
      setStreak(data)

      // Auto-record daily activity
      if (data && !data.alreadyLogged) {
        const result = await recordDailyActivity(user.id)
        if (result && result.xpEarned > 0) {
          setXpGained(result.xpEarned)
          setShowReward(true)
          setStreak(result)
          setTimeout(() => setShowReward(false), 3000)
        }
      }
    } catch (error) {
      console.error('Error loading streak:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return compact ? null : (
      <div className="animate-pulse bg-dark-card rounded-xl p-4 h-24" />
    )
  }

  if (!streak) return null

  const discount = getStreakDiscount(streak.current_streak)
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak.current_streak)
  const progress = nextMilestone
    ? (streak.current_streak / nextMilestone.days) * 100
    : 100

  // Compact version for header
  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-card/80 border border-dark-border"
      >
        <div className={`p-1 rounded-full bg-gradient-to-br ${getFireColor(streak.current_streak)}`}>
          <Flame className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white">{streak.current_streak}</span>
        {discount > 0 && (
          <span className="text-xs text-success-muted">-{discount}%</span>
        )}
      </motion.div>
    )
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-dark-card border border-dark-border rounded-2xl p-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getFireColor(streak.current_streak)} opacity-5`} />

      {/* XP Reward Animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full bg-success-muted/20 border border-success-muted/30"
          >
            <Star className="w-4 h-4 text-success-muted" />
            <span className="text-sm font-bold text-success-muted">+{xpGained} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-start justify-between">
        {/* Left side - Streak info */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${getFireColor(streak.current_streak)} shadow-lg`}
          >
            <Flame className="w-8 h-8 text-white" />
          </motion.div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{streak.current_streak}</span>
              <span className="text-gray-400">day streak</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Longest: {streak.longest_streak} days
            </p>
          </div>
        </div>

        {/* Right side - XP and discount */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Zap className="w-5 h-5 text-brand-purple" />
            <span className="text-2xl font-bold text-white">
              {streak.total_xp?.toLocaleString() || 0}
            </span>
            <span className="text-gray-400">XP</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center gap-1 justify-end mt-2">
              <Gift className="w-4 h-4 text-success-muted" />
              <span className="text-success-muted font-semibold">
                {discount}% fee discount
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Next milestone</span>
            <span className="text-gray-300">
              {nextMilestone.days} days ({nextMilestone.feeDiscount}% discount)
            </span>
          </div>
          <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getFireColor(streak.current_streak)}`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {nextMilestone.days - streak.current_streak} days to go
          </p>
        </div>
      )}

      {/* Badges */}
      {streak.badges && streak.badges.length > 0 && (
        <div className="mt-6 pt-6 border-t border-dark-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-brand-purple" />
            <span className="text-sm font-medium text-gray-300">Badges</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {streak.badges.map((badgeId) => {
              const badge = BADGES[badgeId]
              if (!badge) return null
              return (
                <motion.div
                  key={badgeId}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-elevated border border-dark-border"
                  style={{ borderColor: badge.color + '40' }}
                >
                  <span>{badge.icon}</span>
                  <span className="text-xs font-medium text-gray-300">{badge.name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Streak badge for display in header/cards
export function StreakBadge({ streak, size = 'sm' }) {
  if (!streak || streak === 0) return null

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${getFireColor(streak)} ${sizes[size]}`}>
      <Flame className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="font-bold text-white">{streak}</span>
    </div>
  )
}

// Mini streak counter for notifications
export function StreakReminder({ streak, lastActivity }) {
  const today = new Date().toISOString().split('T')[0]

  if (lastActivity === today) return null // Already active today

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-4 z-50 p-4 rounded-2xl bg-dark-card border border-warning/30 shadow-lg max-w-xs"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-warning/20">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="font-semibold text-white">Keep your streak!</p>
          <p className="text-sm text-gray-400">
            Complete a trade today to maintain your {streak} day streak
          </p>
        </div>
      </div>
    </motion.div>
  )
}
