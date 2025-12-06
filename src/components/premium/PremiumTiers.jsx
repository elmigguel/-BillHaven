/**
 * PremiumTiers - Pricing page component
 * Shows all subscription tiers with features and pricing
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Zap,
  Crown,
  Shield,
  Sparkles,
  ArrowRight,
  Calculator
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  PREMIUM_TIERS,
  getAllTiers,
  getFeeDiscount,
  calculateMonthlySavings,
  getUserSubscription
} from '@/services/premiumService'

const tierColors = {
  free: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
  silver: 'from-slate-400/20 to-slate-500/20 border-slate-400/30',
  gold: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  platinum: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
}

const tierButtonColors = {
  free: 'bg-gray-600 hover:bg-gray-700',
  silver: 'bg-slate-500 hover:bg-slate-600',
  gold: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
  platinum: 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600',
}

export default function PremiumTiers({ onSelectTier }) {
  const { user } = useAuth()
  const [isYearly, setIsYearly] = useState(false)
  const [currentTier, setCurrentTier] = useState('free')
  const [monthlyVolume, setMonthlyVolume] = useState(5000)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadCurrentSubscription()
    }
  }, [user])

  const loadCurrentSubscription = async () => {
    const { tier } = await getUserSubscription(user?.id)
    setCurrentTier(tier)
  }

  const tiers = getAllTiers()

  return (
    <div className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20 mb-4"
        >
          <Crown className="w-4 h-4 text-brand-purple" />
          <span className="text-sm font-medium text-brand-purple">Premium Plans</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4"
        >
          Pay Less, Trade More
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto"
        >
          Lower your platform fees and unlock exclusive features.
          Premium pays for itself with just a few trades.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <span className={`text-sm ${!isYearly ? 'text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? 'bg-brand-purple' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${isYearly ? 'text-white' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 text-xs text-success-muted">(Save 17%)</span>
          </span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        {tiers.map((tier, index) => {
          const isCurrent = tier.id === currentTier
          const discount = getFeeDiscount(tier.id)
          const price = isYearly ? tier.priceYearly : tier.priceMonthly
          const monthlyPrice = isYearly ? (tier.priceYearly / 12).toFixed(2) : tier.priceMonthly

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`
                relative rounded-2xl border p-6
                bg-gradient-to-br ${tierColors[tier.id]}
                ${tier.popular ? 'ring-2 ring-amber-500/50' : ''}
                ${isCurrent ? 'ring-2 ring-brand-purple' : ''}
              `}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-brand-purple text-white text-xs font-semibold">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Tier Icon & Name */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{tier.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  {discount > 0 && (
                    <span className="text-xs text-success-muted">
                      {discount}% lower fees
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                {tier.price === 0 ? (
                  <div className="text-4xl font-bold text-white">Free</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        €{monthlyPrice}
                      </span>
                      <span className="text-gray-400">/mo</span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-gray-400 mt-1">
                        €{price} billed yearly
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Platform Fee */}
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-white/5">
                <Zap className="w-5 h-5 text-brand-purple" />
                <div>
                  <span className="text-lg font-bold text-white">{tier.platformFee}%</span>
                  <span className="text-sm text-gray-400 ml-1">platform fee</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success-muted flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => onSelectTier?.(tier)}
                disabled={isCurrent}
                className={`w-full ${tierButtonColors[tier.id]} text-white`}
              >
                {isCurrent ? (
                  'Current Plan'
                ) : tier.price === 0 ? (
                  'Get Started'
                ) : (
                  <>
                    Upgrade to {tier.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )
        })}
      </div>

      {/* Savings Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 max-w-2xl mx-auto px-4"
      >
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="flex items-center gap-2 mx-auto text-gray-400 hover:text-white transition-colors"
        >
          <Calculator className="w-5 h-5" />
          <span>Calculate your savings</span>
        </button>

        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-6 rounded-2xl bg-dark-card border border-dark-border"
          >
            <label className="block text-sm text-gray-400 mb-2">
              Your monthly trading volume (€)
            </label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-2xl font-bold text-white mt-2">
              €{monthlyVolume.toLocaleString()}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              {['silver', 'gold', 'platinum'].map((tierId) => {
                const savings = calculateMonthlySavings(tierId, monthlyVolume)
                const tier = PREMIUM_TIERS[tierId]

                return (
                  <div
                    key={tierId}
                    className={`p-4 rounded-xl bg-gradient-to-br ${tierColors[tierId]}`}
                  >
                    <div className="text-lg font-bold text-white">{tier.name}</div>
                    <div className="text-sm text-gray-400">
                      Save €{savings.feeSavings.toFixed(2)}/mo
                    </div>
                    <div className={`text-sm font-semibold mt-2 ${
                      savings.worthIt ? 'text-success-muted' : 'text-warning'
                    }`}>
                      Net: €{savings.netSavings.toFixed(2)}/mo
                    </div>
                    {!savings.worthIt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Worth it at €{Math.ceil(savings.breakEvenVolume).toLocaleString()}+
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-6 mt-12 text-gray-500"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="text-sm">Secure Payments</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm">Cancel Anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="text-sm">Instant Upgrade</span>
        </div>
      </motion.div>
    </div>
  )
}

// Compact tier selector for dashboard
export function TierBadge({ tier = 'free', size = 'sm' }) {
  const tierData = PREMIUM_TIERS[tier]
  if (!tierData) return null

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tierColors[tier]} ${sizes[size]} font-medium text-white`}
    >
      <span>{tierData.icon}</span>
      <span>{tierData.name}</span>
    </span>
  )
}

// Current plan card for dashboard
export function CurrentPlanCard({ userId }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [userId])

  const loadSubscription = async () => {
    try {
      const { tier, subscription } = await getUserSubscription(userId)
      setSubscription({ tier, ...subscription })
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="h-24 bg-dark-card animate-pulse rounded-xl" />
  }

  const tier = PREMIUM_TIERS[subscription?.tier || 'free']

  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${tierColors[tier.id]} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tier.icon}</span>
          <div>
            <h3 className="font-bold text-white">{tier.name} Plan</h3>
            <p className="text-sm text-gray-400">{tier.platformFee}% platform fee</p>
          </div>
        </div>
        {tier.id !== 'platinum' && (
          <Button variant="outline" size="sm">
            Upgrade
          </Button>
        )}
      </div>

      {subscription?.expires_at && (
        <p className="text-xs text-gray-500 mt-4">
          Renews {new Date(subscription.expires_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
