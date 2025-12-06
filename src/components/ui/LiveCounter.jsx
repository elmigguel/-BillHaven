/**
 * LiveCounter - Animated counting numbers
 * Creates trust by showing platform activity
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// Easing function for smooth counting
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedNumber({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const startTime = useRef(null)
  const animationFrame = useRef(null)

  useEffect(() => {
    if (!isInView) return

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      setDisplayValue(Math.floor(easedProgress * value))

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrame.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [value, duration, isInView])

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : displayValue.toLocaleString()

  return (
    <span ref={ref} className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

// Platform stats counter bar
export default function LiveCounter({ className = '' }) {
  // Mock data - would come from API in production
  const stats = [
    { label: 'Bills Paid', value: 15847, suffix: '+', icon: '💸' },
    { label: 'Total Volume', value: 2.4, prefix: '€', suffix: 'M', decimals: 1, icon: '📊' },
    { label: 'Active Users', value: 3291, suffix: '', icon: '👥' },
    { label: 'Chains', value: 11, suffix: '', icon: '⛓️' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`w-full py-6 px-4 ${className}`}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 rounded-xl bg-dark-card/30 border border-dark-border/30"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                <AnimatedNumber
                  value={stat.value}
                  prefix={stat.prefix || ''}
                  suffix={stat.suffix || ''}
                  decimals={stat.decimals || 0}
                  duration={2500}
                />
              </div>
              <div className="text-xs lg:text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Compact inline counter for header/footer
export function CompactCounter({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-4 text-xs text-gray-400 ${className}`}
    >
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-success-muted animate-pulse" />
        <span><AnimatedNumber value={15847} /> bills paid</span>
      </div>
      <div className="hidden sm:block">•</div>
      <div className="hidden sm:flex items-center gap-1">
        <span>€<AnimatedNumber value={2.4} decimals={1} />M volume</span>
      </div>
    </motion.div>
  )
}
