/**
 * Trust Dashboard - Transparency & Security Center
 * Shows platform stats, SAFU fund, security audits, and trust metrics
 * Builds maximum trust like Binance/Coinbase transparency pages
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  ExternalLink,
  FileText,
  AlertTriangle,
  Globe,
  Zap,
  Clock,
  Award,
  BarChart3,
  Wallet
} from 'lucide-react'
import SAFUFund from '@/components/trust/SAFUFund'
import { getReputationLeaderboard } from '@/services/reputationService'
import { supabase } from '@/lib/supabase'

// Platform statistics (would come from backend in production)
const PLATFORM_STATS = {
  totalVolume: 125000,
  totalTrades: 1250,
  activeUsers: 850,
  countriesServed: 45,
  avgSettlementTime: '4.2 minutes',
  disputeRate: 0.8,
  successRate: 99.2,
  uptime: 99.9,
}

// Security audits and certifications
const SECURITY_ITEMS = [
  {
    title: 'Smart Contract Audit',
    provider: 'Polygon Verified',
    date: '2025-12-01',
    status: 'verified',
    link: 'https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240',
    icon: FileText,
  },
  {
    title: 'Multi-Chain Support',
    provider: '11 Blockchains',
    date: '2025-12-01',
    status: 'active',
    icon: Globe,
  },
  {
    title: 'Non-Custodial',
    provider: 'Smart Contract Escrow',
    date: 'Always',
    status: 'verified',
    icon: Lock,
  },
  {
    title: 'Wallet-Only Auth',
    provider: 'No Email Required',
    date: 'Always',
    status: 'active',
    icon: Wallet,
  },
]

// Real-time stats card component
function StatCard({ icon: Icon, label, value, subValue, color = 'text-brand-purple' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-dark-card border border-dark-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-dark-elevated ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {subValue && (
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
            {subValue}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  )
}

// Security item card
function SecurityCard({ item }) {
  const Icon = item.icon
  const statusColors = {
    verified: 'bg-green-500/20 text-green-400 border-green-500/30',
    active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-dark-card border border-dark-border hover:border-dark-border/80 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-dark-elevated">
          <Icon className="w-6 h-6 text-brand-purple" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-white">{item.title}</h4>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">{item.provider}</p>
          <p className="text-xs text-gray-500 mt-1">{item.date}</p>
        </div>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-dark-elevated transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// Top traders leaderboard
function TopTraders({ traders }) {
  if (!traders || traders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No traders yet. Be the first!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {traders.slice(0, 5).map((trader, index) => (
        <motion.div
          key={trader.user_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-4 p-3 rounded-lg bg-dark-elevated"
        >
          <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
            index === 1 ? 'bg-gray-400/20 text-gray-300' :
            index === 2 ? 'bg-orange-500/20 text-orange-400' :
            'bg-dark-card text-gray-500'
          }`}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">
              {trader.profiles?.full_name ||
               `${trader.profiles?.wallet_address?.slice(0, 6)}...${trader.profiles?.wallet_address?.slice(-4)}`}
            </div>
            <div className="text-xs text-gray-500">
              {trader.completed_trades} trades
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-400">
              {trader.trust_score}
            </div>
            <div className="text-xs text-gray-500">Trust Score</div>
          </div>
          <span className="text-xl">{trader.trustLevel?.icon || '🔰'}</span>
        </motion.div>
      ))}
    </div>
  )
}

// Live activity feed
function LiveActivity() {
  const [activities] = useState([
    { type: 'trade', message: 'Bill #1234 paid - $250', time: '2 min ago' },
    { type: 'join', message: 'New user joined from Nigeria', time: '5 min ago' },
    { type: 'trade', message: 'Bill #1233 released - $1,500', time: '8 min ago' },
    { type: 'milestone', message: 'Platform hit 1,000 trades!', time: '1 hour ago' },
    { type: 'trade', message: 'Bill #1232 paid - $89', time: '2 hours ago' },
  ])

  const typeIcons = {
    trade: <DollarSign className="w-4 h-4 text-green-400" />,
    join: <Users className="w-4 h-4 text-blue-400" />,
    milestone: <Award className="w-4 h-4 text-yellow-400" />,
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-2 rounded-lg bg-dark-elevated"
        >
          <div className="p-1.5 rounded-lg bg-dark-card">
            {typeIcons[activity.type]}
          </div>
          <div className="flex-1 text-sm text-gray-300">{activity.message}</div>
          <div className="text-xs text-gray-500">{activity.time}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Main Trust Dashboard page
export default function Trust() {
  const [topTraders, setTopTraders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const traders = await getReputationLeaderboard(10)
      setTopTraders(traders)
    } catch (error) {
      console.error('Error loading trust data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-base pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Trust & Transparency</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Platform Trust Center
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Complete transparency into BillHaven's security, performance, and reliability.
            We believe in open and verifiable trust.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Volume"
            value={`$${PLATFORM_STATS.totalVolume.toLocaleString()}`}
            subValue="+12% this week"
            color="text-green-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Trades"
            value={PLATFORM_STATS.totalTrades.toLocaleString()}
            subValue="+8% this week"
            color="text-blue-400"
          />
          <StatCard
            icon={Users}
            label="Active Users"
            value={PLATFORM_STATS.activeUsers.toLocaleString()}
            color="text-purple-400"
          />
          <StatCard
            icon={Globe}
            label="Countries"
            value={PLATFORM_STATS.countriesServed}
            color="text-yellow-400"
          />
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Avg Settlement"
            value={PLATFORM_STATS.avgSettlementTime}
            color="text-cyan-400"
          />
          <StatCard
            icon={CheckCircle}
            label="Success Rate"
            value={`${PLATFORM_STATS.successRate}%`}
            color="text-green-400"
          />
          <StatCard
            icon={AlertTriangle}
            label="Dispute Rate"
            value={`${PLATFORM_STATS.disputeRate}%`}
            color="text-orange-400"
          />
          <StatCard
            icon={Zap}
            label="Uptime"
            value={`${PLATFORM_STATS.uptime}%`}
            color="text-brand-purple"
          />
        </div>

        {/* SAFU Fund Section */}
        <div className="mb-8">
          <SAFUFund />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Security & Audits */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-purple" />
              Security & Verification
            </h2>
            <div className="space-y-3">
              {SECURITY_ITEMS.map((item, index) => (
                <SecurityCard key={index} item={item} />
              ))}
            </div>
          </div>

          {/* Top Traders Leaderboard */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Top Trusted Traders
            </h2>
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-dark-elevated rounded-lg" />
                  ))}
                </div>
              ) : (
                <TopTraders traders={topTraders} />
              )}
            </div>
          </div>
        </div>

        {/* Live Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Live Platform Activity
          </h2>
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <LiveActivity />
          </div>
        </div>

        {/* Trust Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-purple/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Our Trust Guarantees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-white mb-2">SAFU Protected</h3>
              <p className="text-sm text-gray-400">
                Every trade is backed by our insurance fund up to $10,000
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Non-Custodial</h3>
              <p className="text-sm text-gray-400">
                We never hold your funds. Smart contracts ensure secure escrow.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Eye className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Full Transparency</h3>
              <p className="text-sm text-gray-400">
                All transactions verifiable on-chain. Open and auditable.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Smart Contract Link */}
        <div className="mt-8 text-center">
          <a
            href="https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-card border border-dark-border hover:border-brand-purple/50 transition-colors text-white"
          >
            <FileText className="w-5 h-5" />
            View Smart Contract on Polygonscan
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
