/**
 * BillHavenLogo - Professional animated logo component
 * Concept: "Haven" - A protective harbor/shield sheltering your bills
 * Design: Modern, clean, gradient accents - Coinbase/Phantom level
 */

import React from 'react';
import { motion } from 'framer-motion';

// SVG Logo mark - Harbor/Haven protecting a bill
const LogoMark = ({ size = 32, animated = false }) => {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: 'easeInOut' }
    }
  };

  return (
    <motion.svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className="flex-shrink-0"
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <defs>
        {/* Main brand gradient - Blue to Purple */}
        <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052FF" />
          <stop offset="50%" stopColor="#7B3FF2" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Haven arc gradient */}
        <linearGradient id="haven-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052FF" />
          <stop offset="100%" stopColor="#7B3FF2" />
        </linearGradient>

        {/* Document gradient */}
        <linearGradient id="doc-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E5E7EB" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow */}
        <filter id="doc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Haven Arc - Protective curve over the document */}
      <motion.path
        d="M8 18 C8 8, 24 2, 40 18"
        fill="none"
        stroke="url(#haven-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#logo-glow)"
        variants={animated ? pathVariants : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
      />

      {/* Second Haven Arc - Depth effect */}
      <motion.path
        d="M12 22 C12 14, 24 9, 36 22"
        fill="none"
        stroke="url(#haven-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
        variants={animated ? pathVariants : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
      />

      {/* Document/Bill - Main body */}
      <g filter="url(#doc-shadow)">
        <rect
          x="14"
          y="20"
          width="20"
          height="24"
          rx="2"
          fill="url(#doc-gradient)"
        />

        {/* Document lines - representing bill content */}
        <rect x="17" y="24" width="14" height="2" rx="1" fill="#0052FF" fillOpacity="0.3" />
        <rect x="17" y="29" width="10" height="2" rx="1" fill="#0052FF" fillOpacity="0.2" />
        <rect x="17" y="34" width="12" height="2" rx="1" fill="#0052FF" fillOpacity="0.15" />

        {/* Checkmark circle - Verified/Safe */}
        <circle cx="29" cy="39" r="4" fill="#10B981" />
        <motion.path
          d="M27 39 L28.5 40.5 L31.5 37.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={animated ? {
            hidden: { pathLength: 0 },
            visible: { pathLength: 1, transition: { delay: 0.8, duration: 0.5 } }
          } : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
        />
      </g>

      {/* Subtle sparkle accent */}
      {animated && (
        <motion.circle
          cx="38"
          cy="12"
          r="2"
          fill="#FFFFFF"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ delay: 1.2, duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        />
      )}
    </motion.svg>
  );
};

// Full logo with text
export default function BillHavenLogo({
  size = 'default', // 'sm' | 'default' | 'lg' | 'xl'
  showText = true,
  animated = false,
  className = '',
}) {
  const sizes = {
    sm: { logo: 28, text: 'text-lg', gap: 'gap-2' },
    default: { logo: 36, text: 'text-xl', gap: 'gap-2.5' },
    lg: { logo: 48, text: 'text-2xl', gap: 'gap-3' },
    xl: { logo: 64, text: 'text-4xl', gap: 'gap-4' },
  };

  const config = sizes[size];

  return (
    <motion.div
      className={`flex items-center ${config.gap} ${className}`}
      initial={animated ? { opacity: 0, x: -20 } : false}
      animate={animated ? { opacity: 1, x: 0 } : false}
      transition={{ duration: 0.5 }}
    >
      <LogoMark size={config.logo} animated={animated} />

      {showText && (
        <motion.div
          className="flex flex-col"
          initial={animated ? { opacity: 0, x: -10 } : false}
          animate={animated ? { opacity: 1, x: 0 } : false}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className={`${config.text} font-bold tracking-tight leading-tight`}>
            <span className="text-white">Bill</span>
            <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-success-muted bg-clip-text text-transparent">Haven</span>
          </span>
          {(size === 'lg' || size === 'xl') && (
            <span className="text-xs text-gray-500 tracking-wide mt-0.5">
              Secure P2P Crypto Escrow
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Export individual components
export { LogoMark };

// Favicon/Icon only version
export function BillHavenIcon({ size = 32, className = '' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0052FF" />
          <stop offset="50%" stopColor="#7B3FF2" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Simplified icon for small sizes */}
      <circle cx="24" cy="24" r="22" fill="url(#icon-gradient)" />

      {/* Haven arc */}
      <path
        d="M12 22 C12 12, 24 7, 36 22"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Simple doc shape */}
      <rect x="17" y="20" width="14" height="18" rx="2" fill="#FFFFFF" />

      {/* Checkmark */}
      <circle cx="27" cy="34" r="3" fill="#10B981" />
      <path
        d="M25.5 34 L26.5 35 L28.5 33"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
