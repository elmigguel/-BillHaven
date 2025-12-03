import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Loader2 } from 'lucide-react';

/**
 * AnimatedButton - Enhanced Button with smooth animations
 *
 * Features:
 * - Scale on hover/tap
 * - Loading state with spinner
 * - Success animation
 * - Shake animation on error
 * - Respects reduced motion preferences
 *
 * @param {object} props
 * @param {boolean} props.isLoading - Show loading spinner
 * @param {boolean} props.success - Show success state
 * @param {boolean} props.error - Trigger error shake
 * @param {string} props.loadingText - Text to show when loading
 * @param {React.ReactNode} props.children - Button content
 */
export function AnimatedButton({
  isLoading = false,
  success = false,
  error = false,
  loadingText = 'Loading...',
  className = '',
  disabled,
  children,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: prefersReducedMotion ? 1 : 1.05 },
    tap: { scale: prefersReducedMotion ? 1 : 0.95 },
    success: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    error: prefersReducedMotion
      ? {}
      : {
          x: [0, -10, 10, -10, 10, -5, 5, 0],
          transition: { duration: 0.5, ease: 'easeInOut' },
        },
  };

  const spinnerVariants = {
    rotate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <motion.div
      variants={buttonVariants}
      initial="idle"
      animate={success ? 'success' : error ? 'error' : 'idle'}
      whileHover={!disabled && !isLoading ? 'hover' : undefined}
      whileTap={!disabled && !isLoading ? 'tap' : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <Button
        disabled={disabled || isLoading}
        className={className}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.div
              variants={spinnerVariants}
              animate="rotate"
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
            {loadingText}
          </span>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}

/**
 * PulseButton - Button with continuous pulse effect
 * Great for CTAs and important actions
 */
export function PulseButton({ children, className = '', ...props }) {
  const prefersReducedMotion = useReducedMotion();

  const pulseVariants = prefersReducedMotion
    ? {}
    : {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0px rgba(59, 130, 246, 0.7)',
          '0 0 0 10px rgba(59, 130, 246, 0)',
          '0 0 0 0px rgba(59, 130, 246, 0)',
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

  return (
    <motion.div animate={pulseVariants}>
      <AnimatedButton className={className} {...props}>
        {children}
      </AnimatedButton>
    </motion.div>
  );
}

/**
 * GlowButton - Button with glow effect on hover
 * Perfect for primary actions and payments
 */
export function GlowButton({ children, className = '', glowColor = 'blue', ...props }) {
  const prefersReducedMotion = useReducedMotion();

  const glowColors = {
    blue: 'rgba(59, 130, 246, 0.5)',
    green: 'rgba(34, 197, 94, 0.5)',
    purple: 'rgba(168, 85, 247, 0.5)',
    red: 'rgba(239, 68, 68, 0.5)',
  };

  return (
    <motion.div
      className="relative inline-block"
      whileHover={
        !prefersReducedMotion
          ? {
              filter: `drop-shadow(0 0 20px ${glowColors[glowColor] || glowColors.blue})`,
              transition: { duration: 0.3 },
            }
          : undefined
      }
    >
      <AnimatedButton className={className} {...props}>
        {children}
      </AnimatedButton>
    </motion.div>
  );
}

/**
 * MagneticButton - Button that follows cursor on hover
 * Creates an engaging interactive effect
 */
export function MagneticButton({ children, className = '', strength = 0.3, ...props }) {
  const prefersReducedMotion = useReducedMotion();
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * strength;
    const y = (e.clientY - rect.top - rect.height / 2) * strength;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
    >
      <AnimatedButton className={className} {...props}>
        {children}
      </AnimatedButton>
    </motion.div>
  );
}

export default AnimatedButton;
