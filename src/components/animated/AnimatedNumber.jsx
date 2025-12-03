import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * AnimatedNumber - Smoothly animates number changes
 *
 * Features:
 * - Count-up/down animations
 * - Currency formatting
 * - Configurable duration and easing
 * - Respects reduced motion preferences
 *
 * @param {object} props
 * @param {number} props.value - The target number to display
 * @param {string} props.format - Format type: 'number', 'currency', 'percent' (default: 'number')
 * @param {string} props.currency - Currency code for currency format (default: 'USD')
 * @param {number} props.decimals - Number of decimal places (default: 2)
 * @param {number} props.duration - Animation duration in seconds (default: 1)
 * @param {string} props.className - Additional CSS classes
 */
export function AnimatedNumber({
  value = 0,
  format = 'number',
  currency = 'USD',
  decimals = 2,
  duration = 1,
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion();
  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: prefersReducedMotion ? 0 : duration * 1000,
  });

  const display = useTransform(springValue, (latest) => {
    let formatted;

    switch (format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest);
        break;

      case 'percent':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest / 100);
        break;

      case 'number':
      default:
        formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(latest);
        break;
    }

    return formatted;
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span className={className}>{display}</motion.span>;
}

/**
 * CountUp - Simple count-up animation
 * Lighter alternative to AnimatedNumber
 */
export function CountUp({ end, start = 0, duration = 2, decimals = 0, className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = React.useState(start);
  const countRef = useRef(start);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);

      // Easing function (easeOutExpo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (end - start) * eased;

      countRef.current = current;
      setCount(current);

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [end, start, duration, prefersReducedMotion]);

  return (
    <span className={className}>
      {count.toFixed(decimals)}
    </span>
  );
}

/**
 * BalanceChange - Shows balance changes with directional animation
 * Green for increase, red for decrease
 */
export function BalanceChange({ oldValue, newValue, currency = 'USD', className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const difference = newValue - oldValue;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  const variants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : (isIncrease ? 10 : -10) },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const color = isIncrease ? 'text-green-500' : isDecrease ? 'text-red-500' : 'text-gray-400';
  const sign = isIncrease ? '+' : '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatedNumber value={newValue} format="currency" currency={currency} />
      {difference !== 0 && (
        <motion.span
          variants={variants}
          initial="initial"
          animate="animate"
          className={`text-sm font-medium ${color}`}
        >
          ({sign}
          <AnimatedNumber value={difference} format="currency" currency={currency} duration={0.5} />
          )
        </motion.span>
      )}
    </div>
  );
}

/**
 * ProgressNumber - Number with progress indicator
 * Shows progress towards a goal
 */
export function ProgressNumber({ current, goal, format = 'number', className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-baseline">
        <AnimatedNumber value={current} format={format} className="text-2xl font-bold" />
        <span className="text-sm text-gray-500">
          / <AnimatedNumber value={goal} format={format} />
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-blue-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 1,
            ease: 'easeOut',
          }}
        />
      </div>
      <div className="text-xs text-gray-500 text-right">
        <AnimatedNumber value={percentage} decimals={0} />%
      </div>
    </div>
  );
}

/**
 * FlipNumber - Animated flip effect for number changes
 * Great for lottery-style reveals or odometer effects
 */
export function FlipNumber({ value, className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(value);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const timeout = setTimeout(() => setDisplayValue(value), 50);
    return () => clearTimeout(timeout);
  }, [value, prefersReducedMotion]);

  const variants = {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 },
  };

  return (
    <motion.span
      key={displayValue}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {displayValue}
    </motion.span>
  );
}

export default AnimatedNumber;
