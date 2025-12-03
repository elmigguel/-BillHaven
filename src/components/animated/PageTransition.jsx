import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * PageTransition - Wrapper for page-level route transitions
 *
 * Features:
 * - Smooth page transitions on route changes
 * - Multiple transition variants
 * - Exit animations
 * - Respects reduced motion preferences
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.variant - Transition type: 'fade', 'slide', 'scale', 'slideUp' (default: 'fade')
 * @param {string} props.className - Additional CSS classes
 */
export function PageTransition({ children, variant = 'fade', className = '' }) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },
    slide: {
      initial: { opacity: 0, x: prefersReducedMotion ? 0 : -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: prefersReducedMotion ? 0 : 20 },
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
    slideUp: {
      initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
    scale: {
      initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 },
      transition: { duration: 0.3 },
    },
  };

  const selectedVariant = variants[variant] || variants.fade;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={selectedVariant.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * RouteTransition - Higher-order component for route animations
 * Use this in App.jsx to wrap all routes
 */
export function RouteTransition({ children }) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * FadeTransition - Simple fade transition component
 * Useful for conditional content
 */
export function FadeTransition({ show, children, className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SlideTransition - Slide in/out from different directions
 */
export function SlideTransition({
  show,
  children,
  direction = 'right',
  className = '',
}) {
  const prefersReducedMotion = useReducedMotion();

  const directions = {
    left: { initial: { x: prefersReducedMotion ? 0 : -100 }, animate: { x: 0 }, exit: { x: -100 } },
    right: { initial: { x: prefersReducedMotion ? 0 : 100 }, animate: { x: 0 }, exit: { x: 100 } },
    up: { initial: { y: prefersReducedMotion ? 0 : 100 }, animate: { y: 0 }, exit: { y: 100 } },
    down: { initial: { y: prefersReducedMotion ? 0 : -100 }, animate: { y: 0 }, exit: { y: -100 } },
  };

  const variant = directions[direction] || directions.right;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ ...variant.initial, opacity: 0 }}
          animate={{ ...variant.animate, opacity: 1 }}
          exit={{ ...variant.exit, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * CollapseTransition - Smooth collapse/expand animation
 * Perfect for expandable sections
 */
export function CollapseTransition({ show, children, className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              height: { duration: prefersReducedMotion ? 0 : 0.3 },
              opacity: { duration: prefersReducedMotion ? 0 : 0.2, delay: 0.1 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { duration: prefersReducedMotion ? 0 : 0.3 },
              opacity: { duration: prefersReducedMotion ? 0 : 0.2 },
            },
          }}
          className={className}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ModalTransition - Backdrop + Modal transition
 * Use for dialogs and modals
 */
export function ModalTransition({ show, children, onClose, className = '' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.95,
              y: prefersReducedMotion ? 0 : 20,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : 0.95,
              y: prefersReducedMotion ? 0 : 20,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PageTransition;
