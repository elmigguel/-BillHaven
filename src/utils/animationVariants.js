// Animation Variants Library for BillHaven
// Ready-to-use Framer Motion animation patterns

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 20,
  },
};

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export const pageScaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
  },
};

export const pageSpringTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// ============================================
// LIST ANIMATIONS
// ============================================

export const listContainerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export const listItemBlurVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(4px)',
    y: 10,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// ============================================
// MODAL ANIMATIONS
// ============================================

export const backdropVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  },
};

export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

export const modalSlideUpVariants = {
  hidden: {
    opacity: 0,
    y: '100%',
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: {
      duration: 0.25,
    },
  },
};

// ============================================
// BUTTON INTERACTIONS
// ============================================

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const magneticSpringConfig = {
  stiffness: 150,
  damping: 15,
};

// ============================================
// FORM FEEDBACK
// ============================================

export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, 0],
  transition: {
    duration: 0.5,
    ease: 'easeInOut',
  },
};

export const successCheckVariants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const errorMessageVariants = {
  initial: {
    opacity: 0,
    y: -10,
    height: 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const inputFocusVariants = {
  focused: {
    scale: 1.01,
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    transition: { duration: 0.2 },
  },
  blurred: {
    scale: 1,
    boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)',
    transition: { duration: 0.2 },
  },
};

// ============================================
// PAYMENT SUCCESS
// ============================================

export const checkmarkPathVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.5,
        ease: 'easeInOut',
      },
      opacity: { duration: 0.2 },
    },
  },
};

export const successCircleVariants = {
  hidden: {
    scale: 0,
    rotate: -180,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 0.3, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

// ============================================
// LOADING SKELETONS
// ============================================

export const shimmerAnimation = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulseAnimation = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const skeletonFadeInVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHoverVariants = {
  hover: {
    y: -8,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    transition: { duration: 0.3 },
  },
  tap: {
    scale: 0.98,
  },
};

export const cardGlowVariants = {
  initial: {
    opacity: 0,
  },
  hover: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const flipCardTransition = {
  duration: 0.6,
  type: 'spring',
  stiffness: 200,
};

export const expandableCardVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

export const toastVariants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: 300,
    transition: {
      duration: 0.2,
    },
  },
};

export const toastSlideFromBottomVariants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// NUMBER COUNTER
// ============================================

export const counterSpringConfig = {
  stiffness: 50,
  damping: 20,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// ============================================
// EASING PRESETS
// ============================================

export const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
};

// ============================================
// SPRING PRESETS
// ============================================

export const springs = {
  default: { stiffness: 300, damping: 30 },
  gentle: { stiffness: 150, damping: 20 },
  wobbly: { stiffness: 400, damping: 15 },
  stiff: { stiffness: 500, damping: 40 },
  slow: { stiffness: 100, damping: 30 },
  molasses: { stiffness: 50, damping: 20 },
};

// ============================================
// DURATION PRESETS
// ============================================

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  slowest: 1.2,
};
