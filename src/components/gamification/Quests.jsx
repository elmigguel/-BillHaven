/**
 * Quests Component - Gamified Tasks Display
 * Shows daily, weekly, and achievement quests with progress
 * Like Layer3/Galxe quests for maximum engagement
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Clock,
  Trophy,
  CheckCircle,
  Lock,
  ChevronRight,
  Zap,
  Calendar,
  Star,
  Gift,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUserQuests,
  completeQuest,
  checkAutoCompleteQuests,
  getQuestStats,
  QUEST_DEFINITIONS
} from '@/services/questService'

// Tab definitions
const QUEST_TABS = [
  { id: 'daily', label: 'Daily', icon: Calendar, color: 'text-blue-400' },
  { id: 'weekly', label: 'Weekly', icon: Clock, color: 'text-purple-400' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-yellow-400' },
]

// Quest card component
function QuestCard({ quest, onClaim }) {
  const [claiming, setClaiming] = useState(false)
  const progress = quest.progress || 0
  const requirement = quest.requirement || 1
  const progressPercent = Math.min((progress / requirement) * 100, 100)
  const canClaim = progressPercent >= 100 && !quest.isCompleted

  const handleClaim = async () => {
    if (!canClaim || claiming) return
    setClaiming(true)
    try {
      await onClaim(quest.id)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-xl border transition-all ${
        quest.isCompleted
          ? 'bg-green-500/10 border-green-500/30'
          : canClaim
          ? 'bg-brand-purple/10 border-brand-purple/30 hover:border-brand-purple/50'
          : 'bg-dark-elevated border-dark-border hover:border-dark-border/80'
      }`}
    >
      {/* Completed overlay */}
      {quest.isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Quest Icon */}
        <div className={`text-3xl p-2 rounded-xl ${
          quest.isCompleted ? 'bg-green-500/20' : 'bg-dark-card'
        }`}>
          {quest.icon}
        </div>

        {/* Quest Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${
              quest.isCompleted ? 'text-green-400' : 'text-white'
            }`}>
              {quest.title}
            </h4>
            {quest.badge && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">
                Badge
              </span>
            )}
          </div>

          <p className="text-sm text-gray-400 mb-3">{quest.description}</p>

          {/* Progress Bar */}
          {quest.requirement && !quest.autoComplete && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress} / {requirement}</span>
              </div>
              <div className="h-2 bg-dark-card rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    quest.isCompleted
                      ? 'bg-green-500'
                      : progressPercent >= 100
                      ? 'bg-brand-purple'
                      : 'bg-brand-blue'
                  }`}
                />
              </div>
            </div>
          )}

          {/* XP Reward */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-yellow-400">
              <Zap className="w-4 h-4" />
              <span className="font-medium">+{quest.xp} XP</span>
            </div>

            {/* Action Button */}
            {quest.isCompleted ? (
              <span className="text-xs text-green-400 font-medium">
                Completed {quest.completedAt && new Date(quest.completedAt).toLocaleDateString()}
              </span>
            ) : canClaim ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaim}
                disabled={claiming}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-brand-purple text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : 'Claim'}
              </motion.button>
            ) : (
              <span className="text-xs text-gray-500">
                {quest.autoComplete ? 'Auto-complete' : 'In Progress'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Stats overview component
function QuestStatsOverview({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-dark-elevated border border-dark-border mb-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{stats.completedCount}</div>
        <div className="text-xs text-gray-500">Completed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{stats.totalQuests}</div>
        <div className="text-xs text-gray-500">Total Quests</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">{stats.totalXPFromQuests}</div>
        <div className="text-xs text-gray-500">XP Earned</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-brand-purple">
          {stats.completionRate.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500">Complete</div>
      </div>
    </div>
  )
}

// Main Quests component
export default function Quests() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('daily')
  const [quests, setQuests] = useState({ daily: [], weekly: [], achievements: [] })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadQuests()
      // Check auto-complete quests on load
      checkAutoCompleteQuests(user.id)
    }
  }, [user?.id])

  const loadQuests = async () => {
    try {
      const [questData, statsData] = await Promise.all([
        getUserQuests(user.id),
        getQuestStats(user.id)
      ])
      setQuests(questData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading quests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimQuest = async (questId) => {
    try {
      const result = await completeQuest(user.id, questId)
      if (result.success) {
        // Reload quests to update UI
        loadQuests()
      }
    } catch (error) {
      console.error('Error claiming quest:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-dark-card rounded-xl" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-24 bg-dark-card rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-dark-card rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const currentQuests = quests[activeTab] || []
  const completedQuests = currentQuests.filter(q => q.isCompleted)
  const activeQuests = currentQuests.filter(q => !q.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-brand-purple" />
            Quests
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Complete tasks to earn XP and unlock rewards
          </p>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-4xl"
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </motion.div>
      </div>

      {/* Stats Overview */}
      {stats && <QuestStatsOverview stats={stats} />}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-dark-card border border-dark-border">
        {QUEST_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const tabQuests = quests[tab.id] || []
          const incompleteCount = tabQuests.filter(q => !q.isCompleted).length

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-dark-elevated text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
              <span className="font-medium">{tab.label}</span>
              {incompleteCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-brand-purple/20 text-brand-purple">
                  {incompleteCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quest List */}
      <div className="space-y-4">
        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active ({activeQuests.length})
            </h3>
            {activeQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={handleClaimQuest}
              />
            ))}
          </div>
        )}

        {/* Completed Quests */}
        {completedQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Completed ({completedQuests.length})
            </h3>
            {completedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onClaim={handleClaimQuest}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {currentQuests.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Quests Available</h3>
            <p className="text-gray-400">Check back later for new quests!</p>
          </div>
        )}
      </div>

      {/* Reset Timer Info */}
      {activeTab === 'daily' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-sm text-blue-400">
            Daily quests reset at midnight UTC
          </p>
        </div>
      )}
      {activeTab === 'weekly' && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
          <p className="text-sm text-purple-400">
            Weekly quests reset every Monday at midnight UTC
          </p>
        </div>
      )}
    </div>
  )
}

// Compact Quest Widget for Dashboard
export function QuestWidget() {
  const { user } = useAuth()
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadActiveQuests()
    }
  }, [user?.id])

  const loadActiveQuests = async () => {
    try {
      const data = await getUserQuests(user.id)
      // Get first 3 incomplete daily quests
      const active = [...data.daily, ...data.weekly]
        .filter(q => !q.isCompleted)
        .slice(0, 3)
      setQuests(active)
    } catch (error) {
      console.error('Error loading quests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-dark-elevated rounded-lg" />
        ))}
      </div>
    )
  }

  if (quests.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        All quests completed!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {quests.map((quest) => (
        <div
          key={quest.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-dark-elevated"
        >
          <span className="text-xl">{quest.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate">
              {quest.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>+{quest.xp} XP</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      ))}
    </div>
  )
}
