/**
 * BillHavenLogo - Professional animated logo component
 * Like Coinbase/Phantom level branding
 */

import React from 'react';
import { motion } from 'framer-motion';

// SVG Logo mark - Modern shield with crypto elements
const LogoMark = ({ size = 32, animated = false }) => (
  <motion.svg
    viewBox="0 0 40 40"
    width={size}
    height={size}
    className="flex-shrink-0"
    initial={animated ? { scale: 0.8, opacity: 0 } : false}
    animate={animated ? { scale: 1, opacity: 1 } : false}
    transition={{ duration: 0.5, type: 'spring' }}
  >
    <defs>
      {/* Main gradient - Trust Blue to Purple */}
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0052FF" />
        <stop offset="50%" stopColor="#7F84F6" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>

      {/* Glow effect */}
      <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Inner gradient */}
      <linearGradient id="inner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
      </linearGradient>
    </defs>

    {/* Shield background */}
    <motion.path
      d="M20 2L4 10v12c0 9.39 6.84 16.54 16 18 9.16-1.46 16-8.61 16-18V10L20 2z"
      fill="url(#logo-gradient)"
      filter="url(#logo-glow)"
      initial={animated ? { pathLength: 0 } : false}
      animate={animated ? { pathLength: 1 } : false}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    />

    {/* Inner shield highlight */}
    <path
      d="M20 5L7 11.5v10.5c0 7.52 5.47 13.23 13 14.4V5z"
      fill="url(#inner-gradient)"
    />

    {/* Bill/Document icon inside */}
    <g transform="translate(12, 10)">
      <rect x="0" y="0" width="16" height="20" rx="2" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="3" y="4" width="10" height="2" rx="1" fill="#0052FF" fillOpacity="0.6" />
      <rect x="3" y="8" width="7" height="2" rx="1" fill="#0052FF" fillOpacity="0.4" />
      <rect x="3" y="12" width="8" height="2" rx="1" fill="#0052FF" fillOpacity="0.3" />

      {/* Checkmark */}
      <circle cx="12" cy="16" r="3" fill="#10B981" />
      <path d="M10.5 16l1 1 2-2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </motion.svg>
);

// Full logo with text
export default function BillHavenLogo({
  size = 'default', // 'sm' | 'default' | 'lg' | 'xl'
  showText = true,
  animated = false,
  className = '',
}) {
  const sizes = {
    sm: { logo: 24, text: 'text-lg' },
    default: { logo: 32, text: 'text-xl' },
    lg: { logo: 40, text: 'text-2xl' },
    xl: { logo: 56, text: 'text-4xl' },
  };

  const config = sizes[size];

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
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
          <span className={`${config.text} font-bold tracking-tight`}>
            <span className="text-white">Bill</span>
            <span className="bg-gradient-to-r from-brand-blue via-brand-purple to-success-muted bg-clip-text text-transparent">Haven</span>
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-xs text-gray-500 tracking-wide">
              P2P Crypto Escrow
            </span>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  );
}

// Export individual components
export { LogoMark };
