# Framer Motion Animation Patterns for React Fintech Applications (2025)

Complete guide to implementing production-ready animations in BillHaven using Framer Motion (Motion) v11+ with React and Tailwind CSS.

## Table of Contents
1. [Page Transitions](#1-page-transitions)
2. [List Animations](#2-list-animations)
3. [Modal/Dialog Animations](#3-modaldialog-animations)
4. [Button Interactions](#4-button-interactions)
5. [Form Feedback](#5-form-feedback)
6. [Payment Success Animation](#6-payment-success-animation)
7. [Loading Skeletons](#7-loading-skeletons)
8. [Card Animations](#8-card-animations)
9. [Toast/Notification Animations](#9-toastnotification-animations)
10. [Number Counting](#10-number-counting)

---

## 1. Page Transitions

### Best Pattern: Slide + Fade with AnimatePresence

```jsx
// components/PageTransition.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
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

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

### Usage in App.jsx

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PageTransition } from './components/PageTransition';

function App() {
  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}
```

### Alternative: Scale + Fade (Modern Fintech Pattern)

```jsx
const pageVariants = {
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

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};
```

**Key Points:**
- Use `mode="wait"` to ensure exit animation completes before next page enters
- Keep duration under 0.4s for snappy UX
- Use `location.pathname` as key for route changes

---

## 2. List Animations

### Best Pattern: Staggered Children with Slide-In

```jsx
// components/BillsList.jsx
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {
    opacity: 0
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
      staggerDirection: -1, // Reverse stagger on exit
    },
  },
};

const itemVariants = {
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

export const BillsList = ({ bills }) => {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-3"
    >
      {bills.map((bill) => (
        <motion.li
          key={bill.id}
          variants={itemVariants}
          layout // Enable layout animations
          className="bg-white rounded-lg shadow p-4"
        >
          <BillItem bill={bill} />
        </motion.li>
      ))}
    </motion.ul>
  );
};
```

### Alternative: Fade + Blur (Premium Feel)

```jsx
const itemVariants = {
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
```

**Key Points:**
- Use `staggerChildren: 0.08` for smooth cascade (not too fast, not too slow)
- Add `delayChildren: 0.1` for slight delay before list starts
- Use `layout` prop for automatic position animations on reorder/filter
- Set `staggerDirection: -1` for reverse exit animations

---

## 3. Modal/Dialog Animations

### Best Pattern: Scale + Fade with Backdrop

```jsx
// components/Modal.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const backdropVariants = {
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
      delay: 0.1, // Exit backdrop after modal
    },
  },
};

const modalVariants = {
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

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent close on modal click
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
```

### Alternative: Slide Up from Bottom (Mobile-Friendly)

```jsx
const modalVariants = {
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
```

**Key Points:**
- Use `createPortal` to render modal at document root
- Add `e.stopPropagation()` to prevent modal close on content click
- Use `backdrop-blur-sm` for modern glassmorphism effect
- Spring animation (stiffness: 300, damping: 30) feels most natural

---

## 4. Button Interactions

### Best Pattern: Hover + Tap + Loading States

```jsx
// components/AnimatedButton.jsx
import { motion } from 'framer-motion';

export const AnimatedButton = ({
  children,
  onClick,
  isLoading = false,
  variant = 'primary',
  disabled = false,
}) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-colors relative overflow-hidden';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={!disabled && !isLoading ? {
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!disabled && !isLoading ? {
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <span>Processing...</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
```

### Magnetic Button (Premium Effect)

```jsx
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

export const MagneticButton = ({ children }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) * 0.1);
    y.set((e.clientY - centerY) * 0.1);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold"
    >
      {children}
    </motion.button>
  );
};
```

**Key Points:**
- `whileHover` with scale: 1.02 provides subtle feedback
- `whileTap` with scale: 0.98 gives satisfying press feel
- Use `AnimatePresence` for loading state transitions
- Magnetic effect adds premium feel (use sparingly)

---

## 5. Form Feedback

### Best Pattern: Error Shake + Success Checkmark

```jsx
// components/FormField.jsx
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, 0],
  transition: {
    duration: 0.5,
    ease: 'easeInOut',
  },
};

const successVariants = {
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

export const FormField = ({
  label,
  error,
  success,
  value,
  onChange,
  ...props
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="relative">
        <motion.input
          animate={error ? shakeAnimation : {}}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 border rounded-lg outline-none transition-all
            ${error ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' : ''}
            ${success ? 'border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-200' : ''}
            ${!error && !success ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : ''}
          `}
          {...props}
        />

        {/* Success Checkmark */}
        <AnimatePresence>
          {success && (
            <motion.div
              variants={successVariants}
              initial="hidden"
              animate="visible"
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Check className="w-5 h-5 text-green-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-red-600 text-sm mt-1"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

### Input Focus Animation

```jsx
const focusVariants = {
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

// Usage
const [isFocused, setIsFocused] = useState(false);

<motion.input
  animate={isFocused ? 'focused' : 'blurred'}
  variants={focusVariants}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
/>
```

**Key Points:**
- Shake animation: `x: [0, -10, 10, -10, 10, -5, 5, 0]` for error feedback
- Spring animation for success checkmark (feels natural)
- Use `height: 'auto'` for smooth error message expansion
- Duration 0.2s for focus animations (instant feel)

---

## 6. Payment Success Animation

### Best Pattern: Checkmark + Confetti + Pulse

```jsx
// components/PaymentSuccess.jsx
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const checkmarkVariants = {
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
        ease: 'easeInOut'
      },
      opacity: { duration: 0.2 },
    },
  },
};

const circleVariants = {
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

const pulseVariants = {
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

export const PaymentSuccess = ({ amount, onComplete }) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50"
    >
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className="relative flex flex-col items-center">
        {/* Pulse Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="absolute w-32 h-32 rounded-full bg-green-500"
          />
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            transition={{ delay: 0.3 }}
            className="absolute w-32 h-32 rounded-full bg-green-500"
          />
        </div>

        {/* Success Circle */}
        <motion.div
          variants={circleVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M20 6L9 17l-5-5"
              variants={checkmarkVariants}
              initial="hidden"
              animate="visible"
            />
          </svg>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Payment Successful!
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-semibold text-green-600"
          >
            ${amount.toFixed(2)}
          </motion.p>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onComplete}
          className="mt-8 px-8 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  );
};
```

### Minimal Success Animation (Faster)

```jsx
export const MinimalSuccess = ({ amount }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-green-50 border-2 border-green-500 rounded-xl p-6 flex items-center gap-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"
      >
        <Check className="w-6 h-6 text-white" />
      </motion.div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Payment Complete</h3>
        <p className="text-green-600 font-bold">${amount.toFixed(2)}</p>
      </div>
    </motion.div>
  );
};
```

**Key Points:**
- Use `react-confetti` for celebration effect (5s duration)
- SVG path animation with `pathLength` for checkmark drawing
- Pulse rings add dynamic feel (infinite animation)
- Stagger text appearance with delays (0.3s, 0.5s, 0.7s)

---

## 7. Loading Skeletons

### Best Pattern: Shimmer Effect

```jsx
// components/SkeletonLoader.jsx
import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const SkeletonLoader = ({ variant = 'card' }) => {
  const variants = {
    card: (
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <motion.div
          animate={shimmer.animate}
          className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
          style={{ backgroundSize: '200% 100%' }}
        />
        <motion.div
          animate={shimmer.animate}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"
          style={{ backgroundSize: '200% 100%' }}
        />
        <motion.div
          animate={shimmer.animate}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>
    ),
    list: (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={shimmer.animate}
            transition={{ delay: i * 0.1 }}
            className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
            style={{ backgroundSize: '200% 100%' }}
          />
        ))}
      </div>
    ),
    text: (
      <div className="space-y-2">
        <motion.div
          animate={shimmer.animate}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
          style={{ backgroundSize: '200% 100%' }}
        />
        <motion.div
          animate={shimmer.animate}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6"
          style={{ backgroundSize: '200% 100%' }}
        />
        <motion.div
          animate={shimmer.animate}
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4/6"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>
    ),
  };

  return variants[variant];
};
```

### Pulse Animation (Alternative)

```jsx
export const PulseSkeleton = () => {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="bg-gray-200 rounded-lg h-24"
    />
  );
};
```

### With Fade-In Replacement

```jsx
import { AnimatePresence } from 'framer-motion';

export const ContentLoader = ({ isLoading, children }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SkeletonLoader />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

**Key Points:**
- Shimmer uses `backgroundPosition` animation (200% range)
- Gradient: `from-gray-200 via-gray-100 to-gray-200` for effect
- Duration 2s for smooth, not-too-fast shimmer
- Stagger skeleton items by 0.1s delay

---

## 8. Card Animations

### Best Pattern: Hover Lift + Shadow

```jsx
// components/BillCard.jsx
import { motion } from 'framer-motion';

export const BillCard = ({ bill, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-6 cursor-pointer overflow-hidden relative"
      whileHover={{
        y: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        transition: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-gray-800">{bill.title}</h3>
        <p className="text-2xl font-semibold text-blue-600 mt-2">
          ${bill.amount}
        </p>
        <p className="text-sm text-gray-500 mt-1">{bill.dueDate}</p>
      </div>
    </motion.div>
  );
};
```

### Flip Card Animation (Payment Card)

```jsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export const FlipCard = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative h-56 w-96 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-2xl p-6 text-white"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        style={{
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
        }}
      >
        <div style={{ transform: 'rotateY(0deg)' }}>
          {front}
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-2xl p-6 text-white"
        animate={{ rotateY: isFlipped ? 0 : -180 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
        style={{
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
        }}
      >
        <div style={{ transform: 'rotateY(180deg)' }}>
          {back}
        </div>
      </motion.div>
    </div>
  );
};
```

### Expandable Card

```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const ExpandableCard = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center justify-between cursor-pointer"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
```

**Key Points:**
- Hover lift: `y: -8` with enhanced shadow
- Use `layout` prop for automatic position adjustments
- Flip animation uses `rotateY` with `backfaceVisibility: 'hidden'`
- Expandable cards use `height: 'auto'` for content-based sizing

---

## 9. Toast/Notification Animations

### Best Pattern: Slide In from Top/Bottom

```jsx
// components/Toast.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const toastVariants = {
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

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

const bgColorMap = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

export const Toast = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`
            fixed top-4 right-4 z-50 max-w-md
            ${bgColorMap[type]}
            border rounded-lg shadow-lg p-4
            flex items-start gap-3
          `}
        >
          {iconMap[type]}
          <p className="flex-1 text-gray-800 font-medium">{message}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
```

### Toast Stack (Multiple Toasts)

```jsx
// hooks/useToast.js
import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// components/ToastContainer.jsx
export const ToastContainer = ({ toasts, removeToast }) => {
  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              x: 300,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            layout // Animate position changes
            className={`${bgColorMap[toast.type]} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
          >
            {iconMap[toast.type]}
            <p className="flex-1 text-gray-800 font-medium">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};
```

**Key Points:**
- Slide in from top with spring animation (natural bounce)
- Exit to the right with scale: 0.95
- Use `layout` prop for automatic stack reordering
- Auto-dismiss after 4s (configurable)
- Stack multiple toasts with spacing

---

## 10. Number Counting

### Best Pattern: Animated Counter with useMotionValue

```jsx
// components/AnimatedCounter.jsx
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export const AnimatedCounter = ({
  value,
  duration = 1.5,
  prefix = '$',
  suffix = '',
  decimals = 2,
}) => {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });

  const display = useTransform(spring, current =>
    prefix + current.toFixed(decimals) + suffix
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};
```

### Alternative: With Format Utility

```jsx
import { animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

export const Counter = ({ from = 0, to, duration = 2 }) => {
  const nodeRef = useRef(null);

  useEffect(() => {
    const node = nodeRef.current;

    const controls = animate(from, to, {
      duration,
      ease: 'easeOut',
      onUpdate(value) {
        node.textContent = value.toFixed(2);
      },
    });

    return () => controls.stop();
  }, [from, to, duration]);

  return <span ref={nodeRef} />;
};
```

### With Comma Formatting

```jsx
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const CurrencyCounter = ({ value, duration = 1.5 }) => {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });

  const display = useTransform(spring, current => formatNumber(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className="text-3xl font-bold text-green-600">
      {display}
    </motion.span>
  );
};
```

### Count Up on Scroll (InView)

```jsx
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { useSpring, useTransform } from 'framer-motion';

export const ScrollCounter = ({ value }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });

  const display = useTransform(spring, current =>
    Math.floor(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return (
    <motion.span ref={ref} className="text-4xl font-bold">
      {display}
    </motion.span>
  );
};
```

**Key Points:**
- `useSpring` with stiffness: 50, damping: 20 for smooth counting
- `useTransform` to format number on each update
- Use `Intl.NumberFormat` for currency/locale formatting
- `useInView` to trigger count when element appears
- Duration 1.5-2s feels natural (not too fast)

---

## Performance Best Practices

### 1. Use GPU-Accelerated Properties

```jsx
// Good (GPU-accelerated)
<motion.div animate={{ x: 100, scale: 1.2, opacity: 0.5 }} />

// Avoid (triggers layout recalculation)
<motion.div animate={{ width: '100%', height: '200px' }} />
```

### 2. Respect Reduced Motion

```jsx
import { useReducedMotion } from 'framer-motion';

export const ResponsiveAnimation = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={variants}>
      {children}
    </motion.div>
  );
};
```

### 3. Layout Animations

```jsx
// Automatically animate position/size changes
<motion.div layout>
  Content that changes size/position
</motion.div>

// Disable layout animation for specific properties
<motion.div layout="position"> // Only animate position
  Content
</motion.div>
```

### 4. Batch State Updates

```jsx
// Bad: Multiple re-renders
setIsOpen(true);
setAnimation('enter');
setStatus('active');

// Good: Single re-render
setState(prev => ({
  ...prev,
  isOpen: true,
  animation: 'enter',
  status: 'active',
}));
```

### 5. Use willChange Sparingly

```jsx
<motion.div
  style={{ willChange: 'transform' }} // Only when necessary
  animate={{ x: 100 }}
/>
```

---

## Common Easing Functions

```jsx
// Standard easings
const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
};

// Usage
<motion.div
  animate={{ x: 100 }}
  transition={{ ease: easings.easeOut }}
/>
```

---

## Installation

```bash
npm install framer-motion react-confetti react-use lucide-react
```

---

## Sources & References

- [Motion.dev - Official Motion Documentation](https://motion.dev/)
- [Framer Motion React Animations | Refine](https://refine.dev/blog/framer-motion/)
- [Advanced Animation Patterns with Framer Motion - Maxime Heckel](https://blog.maximeheckel.com/posts/advanced-animation-patterns-with-framer-motion/)
- [LogRocket - Creating React Animations with Motion](https://blog.logrocket.com/creating-react-animations-with-motion/)
- [AnimatePresence — React Exit Animations | Motion](https://www.framer.com/motion/animate-presence/)
- [Fireship.io - Animated Modals with Framer Motion](https://fireship.io/lessons/framer-motion-modal/)
- [Medium - Creating Staggered Animations with Framer Motion](https://medium.com/@onifkay/creating-staggered-animations-with-framer-motion-0e7dc90eae33)
- [Hover.dev - Prebuilt Animations for React & Tailwind](https://www.hover.dev/components)
- [Framer Motion + Tailwind: The 2025 Animation Stack](https://dev.to/manukumar07/framer-motion-tailwind-the-2025-animation-stack-1801)
- [LogRocket - Improve React UX with Skeleton UI](https://blog.logrocket.com/improve-react-ux-skeleton-ui/)
- [Fireship.io - Animated Notifications with Framer Motion](https://fireship.io/lessons/framer-motion-advanced-notifications/)
- [GitHub - Animated Counter Component](https://github.com/driaug/animated-counter)

---

## Quick Reference: Common Patterns

| Pattern | Initial | Animate | Exit | Transition |
|---------|---------|---------|------|------------|
| **Fade In** | `{ opacity: 0 }` | `{ opacity: 1 }` | `{ opacity: 0 }` | `{ duration: 0.3 }` |
| **Slide Up** | `{ y: 20, opacity: 0 }` | `{ y: 0, opacity: 1 }` | `{ y: -20, opacity: 0 }` | `{ type: 'spring', stiffness: 300 }` |
| **Scale** | `{ scale: 0.95, opacity: 0 }` | `{ scale: 1, opacity: 1 }` | `{ scale: 0.95, opacity: 0 }` | `{ duration: 0.2 }` |
| **Shake** | N/A | `{ x: [0, -10, 10, -10, 10, 0] }` | N/A | `{ duration: 0.5 }` |
| **Blur** | `{ filter: 'blur(4px)', opacity: 0 }` | `{ filter: 'blur(0px)', opacity: 1 }` | N/A | `{ duration: 0.3 }` |

---

**Last Updated:** December 2025
**Version:** 1.0
**Framer Motion Version:** v11+
