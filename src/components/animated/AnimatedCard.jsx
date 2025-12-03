import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cardHoverVariants } from '@/utils/animationVariants';

/**
 * AnimatedCard - Enhanced Card component with Framer Motion animations
 *
 * Features:
 * - Staggered entry animations for list items
 * - Hover lift effect with shadow
 * - Optional glow effect on hover
 * - Respects reduced motion preferences
 *
 * @param {object} props
 * @param {number} props.index - Index for stagger animation (optional)
 * @param {boolean} props.withGlow - Enable glow effect on hover (default: false)
 * @param {boolean} props.withHoverLift - Enable lift effect on hover (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 */
export function AnimatedCard({
  index = 0,
  withGlow = false,
  withHoverLift = true,
  className = '',
  children,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
      scale: prefersReducedMotion ? 1 : 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: prefersReducedMotion ? 0 : index * 0.08,
      },
    },
  };

  const hoverVariants = withHoverLift && !prefersReducedMotion
    ? {
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        transition: { duration: 0.3 },
      }
    : {};

  const tapVariants = !prefersReducedMotion ? { scale: 0.98 } : {};

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover={hoverVariants}
      whileTap={tapVariants}
      className="relative"
    >
      {withGlow && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}

/**
 * AnimatedCardHeader - Animated version of CardHeader
 */
export function AnimatedCardHeader({ className = '', children, ...props }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <CardHeader className={className} {...props}>
        {children}
      </CardHeader>
    </motion.div>
  );
}

/**
 * AnimatedCardContent - Animated version of CardContent
 */
export function AnimatedCardContent({ className = '', children, delay = 0.15, ...props }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReducedMotion ? 0 : delay, duration: 0.3 }}
    >
      <CardContent className={className} {...props}>
        {children}
      </CardContent>
    </motion.div>
  );
}

/**
 * AnimatedCardFooter - Animated version of CardFooter
 */
export function AnimatedCardFooter({ className = '', children, delay = 0.2, ...props }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReducedMotion ? 0 : delay, duration: 0.3 }}
    >
      <CardFooter className={className} {...props}>
        {children}
      </CardFooter>
    </motion.div>
  );
}

// Export all components
export default AnimatedCard;
