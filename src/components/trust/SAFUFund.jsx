/**
 * SAFU Fund Display - Insurance & Protection
 * Like Binance SAFU Fund ($1B+) - builds trust with users
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Wallet, CheckCircle, ExternalLink } from 'lucide-react'

// SAFU Fund configuration (update with real values)
const SAFU_CONFIG = {
  fundSize: 50000, // Starting fund size in USD
  insuranceCoverage: 'Up to $10,000 per trade',
  lastAudit: '2025-12-01',
  walletAddress: '0x...', // Treasury wallet
  features: [
    {
      icon: Shield,
      title: 'Trade Protection',
      description: 'All trades are protected by our SAFU fund',
    },
    {
      icon: Lock,
      title: 'Smart Contract Security',
      description: 'Audited escrow contracts on Polygon',
    },
    {
      icon: Wallet,
      title: 'Cold Storage',
      description: 'Insurance funds in secure cold storage',
    },
  ],
}

export default function SAFUFund({ compact = false }) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-muted/10 border border-success-muted/20"
      >
        <Shield className="w-4 h-4 text-success-muted" />
        <span className="text-sm font-medium text-success-muted">SAFU Protected</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-500/20">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">SAFU Fund</h3>
            <p className="text-sm text-gray-400">Secure Asset Fund for Users</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            ${SAFU_CONFIG.fundSize.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500">Insurance Reserve</p>
        </div>
      </div>

      {/* Coverage Info */}
      <div className="p-4 rounded-xl bg-black/20 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="font-medium text-white">Coverage</span>
        </div>
        <p className="text-gray-300">{SAFU_CONFIG.insuranceCoverage}</p>
        <p className="text-xs text-gray-500 mt-2">
          Last audit: {new Date(SAFU_CONFIG.lastAudit).toLocaleDateString()}
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAFU_CONFIG.features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-black/20"
            >
              <Icon className="w-5 h-5 text-green-400 mb-2" />
              <h4 className="font-medium text-white text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-400">{feature.description}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-green-500/20">
        <span className="text-xs text-gray-500">Protected by:</span>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 text-xs text-gray-300">
          <Lock className="w-3 h-3" />
          Smart Contract Escrow
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 text-xs text-gray-300">
          <Shield className="w-3 h-3" />
          Multi-sig Treasury
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/30 text-xs text-gray-300">
          <Wallet className="w-3 h-3" />
          12 Blockchains
        </div>
      </div>
    </motion.div>
  )
}

// Mini version for header/footer
export function SAFUBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
      <Shield className="w-3.5 h-3.5 text-green-400" />
      <span className="text-xs font-medium text-green-400">SAFU Protected</span>
    </div>
  )
}
