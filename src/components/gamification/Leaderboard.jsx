/**
 * Leaderboard - Top users by XP
 * Gamification feature unique to BillHaven
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Zap, Flame, Crown } from 'lucide-react'
import { getLeaderboard, BADGES } from '@/services/streakService'
import { useAuth } from '@/contexts/AuthContext'

const getRankIcon = (rank) => {
  switch (rank) {
    case 1: return <Crown className="w-5 h-5 text-yellow-400" />
    case 2: return <Medal className="w-5 h-5 text-gray-300" />
    case 3: return <Medal className="w-5 h-5 text-amber-600" />
    default: return <span className="text-gray-500 font-mono">#{rank}</span>
  }
}

const getRankStyle = (rank) => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    case 2: return 'bg-gradient-to-r from-gray-400/10 to-gray-300/10 border-gray-400/30'
    case 3: return 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30'
    default: return 'bg-dark-card/50 border-dark-border'
  }
}

export default function Leaderboard({ limit = 10, showFull = false }) {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(limit)
      setLeaders(data || [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-dark-card animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (leaders.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No leaderboard data yet</p>
        <p className="text-sm text-gray-500">Be the first to earn XP!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-purple" />
          <h3 className="font-semibold text-white">Top Traders</h3>
        </div>
        <span className="text-xs text-gray-500">This Week</span>
      </div>

      {/* Leaderboard entries */}
      {leaders.map((entry, index) => {
        const rank = index + 1
        const isCurrentUser = user?.id === entry.user_id
        const profile = entry.profiles

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center gap-4 p-4 rounded-xl border transition-all
              ${getRankStyle(rank)}
              ${isCurrentUser ? 'ring-2 ring-brand-purple/50' : ''}
            `}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-semibold">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Name and badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white truncate">
                  {profile?.full_name || 'Anonymous'}
                </span>
                {isCurrentUser && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-400">{entry.current_streak} days</span>
                </div>
                {entry.badges?.slice(0, 3).map((badgeId) => {
                  const badge = BADGES[badgeId]
                  return badge ? (
                    <span key={badgeId} title={badge.name}>{badge.icon}</span>
                  ) : null
                })}
              </div>
            </div>

            {/* XP */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Zap className="w-4 h-4 text-brand-purple" />
                <span className="font-bold text-white">
                  {entry.total_xp?.toLocaleString() || 0}
                </span>
              </div>
              <span className="text-xs text-gray-500">XP</span>
            </div>
          </motion.div>
        )
      })}

      {/* View all link */}
      {!showFull && leaders.length >= limit && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 text-center text-sm text-brand-purple hover:text-brand-purple/80 transition-colors"
        >
          View Full Leaderboard →
        </motion.button>
      )}
    </div>
  )
}

// Mini leaderboard for sidebar
export function MiniLeaderboard() {
  return <Leaderboard limit={5} />
}
