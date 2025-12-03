import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Loader2 } from 'lucide-react';

/**
 * Spinner - Rotating loading spinner
 *
 * @param {object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} props.color - Color class (default: 'text-blue-500')
 * @param {string} props.className - Additional classes
 */
export function Spinner({ size = 'md', color = 'text-blue-500', className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <motion.div
      animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
      transition={{
        duration: 1,
        repeat: prefersReducedMotion ? 0 : Infinity,
        ease: 'linear',
      }}
      className={`${sizeClass} ${color} ${className}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
}

/**
 * DotsLoader - Three bouncing dots
 * Classic loading indicator
 */
export function DotsLoader({ color = 'bg-blue-500', className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: prefersReducedMotion ? 0 : [-10, 0, -10],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: i * 0.15 }}
          className={`w-3 h-3 rounded-full ${color}`}
        />
      ))}
    </div>
  );
}

/**
 * PulseLoader - Pulsing circle
 * Minimal and elegant
 */
export function PulseLoader({ size = 'md', color = 'bg-blue-500', className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`${sizeClass} rounded-full ${color}`}
        animate={
          prefersReducedMotion
            ? {}
            : {
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

/**
 * ProgressBar - Linear progress indicator
 *
 * @param {object} props
 * @param {number} props.progress - Progress value (0-100)
 * @param {boolean} props.indeterminate - Indeterminate state (default: false)
 * @param {string} props.color - Bar color (default: 'bg-blue-500')
 * @param {string} props.height - Height class (default: 'h-2')
 */
export function ProgressBar({
  progress = 0,
  indeterminate = false,
  color = 'bg-blue-500',
  height = 'h-2',
  className = '',
  showPercentage = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  const barVariants = indeterminate
    ? {
        animate: {
          x: prefersReducedMotion ? 0 : ['0%', '100%'],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }
    : {};

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        {indeterminate ? (
          <motion.div
            className={`${height} w-1/3 ${color} rounded-full`}
            variants={barVariants}
            animate="animate"
          />
        ) : (
          <motion.div
            className={`${height} ${color} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              ease: 'easeOut',
            }}
          />
        )}
      </div>
      {showPercentage && !indeterminate && (
        <motion.div
          className="text-xs text-gray-600 mt-1 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  );
}

/**
 * CircularProgress - Circular progress indicator
 * Great for percentages and goals
 */
export function CircularProgress({
  progress = 0,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: 'easeOut',
          }}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-2xl font-bold text-gray-700">{Math.round(progress)}%</span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * SkeletonLoader - Loading skeleton for content
 * Shows placeholder while content loads
 */
export function SkeletonLoader({ className = '', variant = 'rectangle' }) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    rectangle: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  const variantClass = variants[variant] || variants.rectangle;

  return (
    <motion.div
      className={`bg-gray-200 ${variantClass} ${className}`}
      animate={
        prefersReducedMotion
          ? {}
          : {
              opacity: [0.5, 1, 0.5],
            }
      }
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/**
 * SkeletonCard - Pre-made skeleton for card loading
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-6 border rounded-xl ${className}`}>
      <div className="flex items-start gap-4">
        <SkeletonLoader variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-3">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-4 w-1/2" />
          <SkeletonLoader className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * ShimmerLoader - Shimmer effect loader
 * Modern gradient shimmer animation
 */
export function ShimmerLoader({ className = '', children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

/**
 * LoadingOverlay - Full-screen loading overlay
 * Blocks interaction while loading
 */
export function LoadingOverlay({ show, message = 'Loading...', className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
    >
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4"
      >
        <Spinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
}

/**
 * InlineLoader - Small inline loader
 * For buttons and inline elements
 */
export function InlineLoader({ text = 'Loading', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size="sm" />
      <span>{text}</span>
    </span>
  );
}

export default Spinner;
