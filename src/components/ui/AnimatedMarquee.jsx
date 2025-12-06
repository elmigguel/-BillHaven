/**
 * AnimatedMarquee - Infinite scrolling chain logos
 * Premium crypto aesthetic like Uniswap/1inch
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ChainLogos } from './ChainSelector'

// Supported chains with labels (12 chains including ZEC)
const CHAINS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'base', name: 'Base' },
  { id: 'bsc', name: 'BNB Chain' },
  { id: 'avalanche', name: 'Avalanche' },
  { id: 'solana', name: 'Solana' },
  { id: 'ton', name: 'TON' },
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'lightning', name: 'Lightning' },
  { id: 'zcash', name: 'Zcash' },
]

// Double the chains for seamless loop
const MARQUEE_CHAINS = [...CHAINS, ...CHAINS]

export default function AnimatedMarquee({ speed = 30, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-dark-primary to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-dark-primary to-transparent z-10" />

      {/* Scrolling container */}
      <motion.div
        className="flex gap-8 items-center"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {MARQUEE_CHAINS.map((chain, index) => {
          const Logo = ChainLogos[chain.id]
          return (
            <div
              key={`${chain.id}-${index}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-card/50 border border-dark-border/50 hover:border-brand-purple/30 transition-all duration-300 flex-shrink-0 group"
            >
              <div className="w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                {Logo && <Logo />}
              </div>
              <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
                {chain.name}
              </span>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactMarquee({ speed = 25, className = '' }) {
  return (
    <div className={`relative overflow-hidden py-2 ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dark-primary to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-dark-primary to-transparent z-10" />

      <motion.div
        className="flex gap-6 items-center"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {MARQUEE_CHAINS.map((chain, index) => {
          const Logo = ChainLogos[chain.id]
          return (
            <div
              key={`${chain.id}-${index}`}
              className="w-10 h-10 flex-shrink-0 p-2 rounded-lg bg-dark-card/30 border border-dark-border/30 hover:border-brand-purple/30 transition-colors"
            >
              {Logo && <Logo />}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
