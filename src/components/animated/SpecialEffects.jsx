import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Check, X, AlertCircle, Sparkles, Zap, Trophy, Gift } from 'lucide-react';

/**
 * SuccessAnimation - Animated checkmark for success states
 *
 * @param {object} props
 * @param {boolean} props.show - Show animation
 * @param {string} props.message - Success message
 * @param {number} props.size - Icon size (default: 64)
 */
export function SuccessAnimation({ show, message = 'Success!', size = 64, onComplete }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const circleVariants = {
    hidden: { scale: 0, rotate: -180 },
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

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
        opacity: { duration: 0.2, delay: 0.2 },
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 0, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            {/* Pulse rings */}
            {!prefersReducedMotion && (
              <>
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  className="absolute inset-0 rounded-full bg-green-500"
                  style={{ width: size, height: size }}
                />
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  transition={{ delay: 0.3 }}
                  className="absolute inset-0 rounded-full bg-green-400"
                  style={{ width: size, height: size }}
                />
              </>
            )}

            {/* Success circle with checkmark */}
            <motion.div
              variants={circleVariants}
              initial="hidden"
              animate="visible"
              className="relative bg-green-500 rounded-full flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <svg
                width={size * 0.6}
                height={size * 0.6}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6L9 17l-5-5"
                  variants={checkVariants}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg font-semibold text-gray-700"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ErrorAnimation - Animated X mark for error states
 */
export function ErrorAnimation({ show, message = 'Error!', size = 64, onComplete }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const shakeVariants = prefersReducedMotion
    ? {}
    : {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 },
      };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
          animate={{ opacity: 1, scale: 1, ...shakeVariants }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            className="bg-red-500 rounded-full flex items-center justify-center"
            style={{ width: size, height: size }}
            animate={prefersReducedMotion ? {} : { rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <X className="text-white" size={size * 0.6} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-semibold text-gray-700"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Confetti - Celebration confetti effect
 * Perfect for successful payments!
 */
export function Confetti({ show, duration = 3000 }) {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show && !prefersReducedMotion) {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * window.innerWidth,
        startY: -20,
        endY: window.innerHeight + 20,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, prefersReducedMotion]);

  if (prefersReducedMotion || !show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.x,
            y: particle.startY,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: particle.endY,
            rotate: particle.rotation,
            opacity: 0,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}

/**
 * WalletConnectionCelebration - Special celebration for wallet connections
 */
export function WalletConnectionCelebration({ show, walletName = 'Wallet' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti show={show} />
          <motion.div
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                transition={{ repeat: 3, duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <Zap className="w-16 h-16 text-yellow-500" />
                  {!prefersReducedMotion && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0"
                    >
                      <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                Wallet Connected!
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {walletName} successfully connected to BillHaven
              </p>

              <div className="flex justify-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Ready to transact</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * PaymentSuccessAnimation - Complete payment success flow
 * Shows checkmark, confetti, and success message
 */
export function PaymentSuccessAnimation({ show, amount, currency = 'USD', onComplete }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti show={show} duration={4000} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: prefersReducedMotion ? 1 : 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: prefersReducedMotion ? 1 : 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-12 shadow-2xl max-w-md mx-4 text-center"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </div>
                  {!prefersReducedMotion && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-green-400 rounded-full"
                    />
                  )}
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                Payment Successful!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-gray-600 mb-2">Amount paid</p>
                <p className="text-4xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                  }).format(amount)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-2 text-sm text-gray-500"
              >
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Transaction complete</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * FloatingIcons - Floating animated icons
 * Great for background effects
 */
export function FloatingIcons({ icons = [Sparkles, Zap, Trophy, Gift], count = 10 }) {
  const prefersReducedMotion = useReducedMotion();
  const [elements, setElements] = useState([]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const newElements = Array.from({ length: count }, (_, i) => ({
      id: i,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
    setElements(newElements);
  }, [count, icons, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          initial={{ y: '100vh', opacity: 0.3 }}
          animate={{
            y: '-10vh',
            opacity: [0.3, 0.6, 0.3, 0],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute"
          style={{ left: `${element.x}%` }}
        >
          <element.Icon className="w-8 h-8 text-blue-400/30" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * CelebrationBurst - Burst of particles from center
 * Alternative to confetti
 */
export function CelebrationBurst({ show, particleCount = 20 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion || !show) return null;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 200 + Math.random() * 100;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { id: i, x, y };
  });

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default SuccessAnimation;
