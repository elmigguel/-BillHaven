// BillHaven Animation Configuration
// Consistent timing, easing, and animation variants across the app

// ============================================
// TIMING STANDARDS
// ============================================
export const timing = {
  fast: 150,      // Micro-interactions (hover, focus, click)
  normal: 300,    // Component transitions (modals, dropdowns)
  slow: 500,      // Page transitions, complex animations
  verySlow: 700,  // Financial confirmations, celebrations
};

// ============================================
// EASING FUNCTIONS
// ============================================
export const easing = {
  // Entry animations - fast start, slow end (responsive feel)
  easeOut: [0.16, 1, 0.3, 1],

  // Exit animations - slow start, fast end (graceful disappear)
  easeIn: [0.7, 0, 0.84, 0],

  // Both directions - balanced
  easeInOut: [0.65, 0, 0.35, 1],

  // Spring animations - natural, bouncy feel
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  softSpring: { type: 'spring', stiffness: 200, damping: 25 },

  // Snappy spring - for button clicks
  snapSpring: { type: 'spring', stiffness: 400, damping: 25 },
};

// ============================================
// COMMON ANIMATION VARIANTS
// ============================================

// Fade in/out
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: timing.normal / 1000 },
};

// Slide up from bottom
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: timing.normal / 1000, ease: easing.easeOut },
};

// Slide down from top
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: timing.normal / 1000, ease: easing.easeOut },
};

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: timing.normal / 1000, ease: easing.easeOut },
};

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: timing.normal / 1000, ease: easing.easeOut },
};

// Scale in (modal/dialog)
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: timing.fast / 1000, ease: easing.easeOut },
};

// Pop in (celebration/success)
export const popIn = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { ...easing.snapSpring },
};

// Shimmer effect (loading states)
export const shimmer = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear'
    }
  },
};

// Pulse (pending states)
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
};

// Breathe (waiting states)
export const breathe = {
  animate: {
    scale: [1, 1.03, 1],
    opacity: [1, 0.85, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
};

// Shake (error states)
export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  },
};

// Rotate (loading spinner)
export const rotate = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  },
};

// ============================================
// STAGGER ANIMATIONS (for lists)
// ============================================

// Container for staggered children
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Fast stagger (small lists < 5 items)
export const fastStagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

// Slow stagger (emphasis on each item)
export const slowStagger = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Stagger item (use with containers above)
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: timing.normal / 1000,
      ease: easing.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: timing.fast / 1000,
      ease: easing.easeIn
    }
  },
};

// ============================================
// FINANCIAL-SPECIFIC ANIMATIONS
// ============================================

// Counter/number animation (for amounts)
export const countUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  },
};

// Success celebration
export const celebration = {
  initial: { opacity: 0, scale: 0, rotate: -180 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      ...easing.spring,
      delay: 0.2
    }
  },
};

// Progress bar fill
export const progressFill = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: {
      duration: timing.slow / 1000,
      ease: easing.easeOut
    }
  },
};

// ============================================
// HOVER/TAP ANIMATIONS
// ============================================

// Button hover/tap
export const buttonTap = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { duration: timing.fast / 1000, ease: easing.easeOut }
};

// Card hover lift
export const cardHover = {
  whileHover: {
    y: -8,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
  },
  transition: { duration: timing.fast / 1000, ease: easing.easeOut }
};

// Icon hover
export const iconHover = {
  whileHover: { scale: 1.1, rotate: 5 },
  whileTap: { scale: 0.9 },
  transition: { duration: timing.fast / 1000 }
};

// ============================================
// BACKDROP ANIMATIONS
// ============================================

export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: timing.fast / 1000 }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get animation with reduced motion support
export const getAnimation = (animation, prefersReducedMotion = false) => {
  if (prefersReducedMotion) {
    // Return simplified version with no motion
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 }
    };
  }
  return animation;
};

// Delay stagger based on index
export const getStaggerDelay = (index, baseDelay = 0.1) => {
  return index * baseDelay;
};

// Get spring config based on speed
export const getSpringConfig = (speed = 'normal') => {
  const configs = {
    slow: { stiffness: 150, damping: 20 },
    normal: { stiffness: 300, damping: 30 },
    fast: { stiffness: 400, damping: 25 },
  };
  return { type: 'spring', ...configs[speed] };
};
