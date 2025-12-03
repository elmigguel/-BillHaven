import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * useCountUp - Animates a number from start to end
 *
 * Features:
 * - Smooth count-up/down animation
 * - Configurable duration and easing
 * - Auto-start or manual trigger
 * - Respects reduced motion preferences
 *
 * @param {number} end - Target number
 * @param {object} options
 * @param {number} options.start - Starting number (default: 0)
 * @param {number} options.duration - Animation duration in seconds (default: 2)
 * @param {number} options.decimals - Decimal places (default: 0)
 * @param {string} options.easing - Easing function: 'linear', 'easeOut', 'easeIn', 'easeInOut' (default: 'easeOut')
 * @param {boolean} options.autoStart - Auto-start animation (default: true)
 * @param {function} options.onComplete - Callback when animation completes
 * @returns {object} { count, start, reset, pause, resume }
 *
 * Usage:
 * const { count } = useCountUp(1000, { duration: 2, decimals: 0 });
 * <span>{count}</span>
 */
export function useCountUp(
  end,
  {
    start = 0,
    duration = 2,
    decimals = 0,
    easing = 'easeOut',
    autoStart = true,
    onComplete = null,
  } = {}
) {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(null);

  // Easing functions
  const easingFunctions = {
    linear: (t) => t,
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeIn: (t) => Math.pow(t, 3),
    easeInOut: (t) => (t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2),
    easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };

  const easingFn = easingFunctions[easing] || easingFunctions.easeOut;

  const animate = useCallback(
    (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easedProgress = easingFn(progress);
      const currentCount = start + (end - start) * easedProgress;

      setCount(parseFloat(currentCount.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
        if (onComplete) onComplete();
      }
    },
    [start, end, duration, decimals, easingFn, onComplete]
  );

  const startAnimation = useCallback(() => {
    if (prefersReducedMotion) {
      setCount(end);
      if (onComplete) onComplete();
      return;
    }

    setIsAnimating(true);
    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);
  }, [prefersReducedMotion, end, animate, onComplete]);

  const reset = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    setCount(start);
    setIsAnimating(false);
    startTimeRef.current = null;
    pausedTimeRef.current = null;
  }, [start]);

  const pause = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      pausedTimeRef.current = Date.now();
      setIsAnimating(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (pausedTimeRef.current) {
      const pauseDuration = Date.now() - pausedTimeRef.current;
      if (startTimeRef.current) {
        startTimeRef.current += pauseDuration;
      }
      pausedTimeRef.current = null;
      setIsAnimating(true);
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Auto-start on mount or when end value changes
  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, autoStart, startAnimation]);

  return {
    count,
    start: startAnimation,
    reset,
    pause,
    resume,
    isAnimating,
  };
}

/**
 * useIncrementalCounter - Counter that increments in steps
 * Useful for tickers and live updates
 *
 * @param {number} target - Target value
 * @param {object} options
 * @param {number} options.increment - Increment per step (default: 1)
 * @param {number} options.interval - Interval in ms (default: 100)
 * @param {boolean} options.autoStart - Auto-start (default: true)
 * @returns {object} { count, start, stop, reset }
 */
export function useIncrementalCounter(
  target,
  { increment = 1, interval = 100, autoStart = true } = {}
) {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= target) {
          clearInterval(intervalRef.current);
          return target;
        }
        return next;
      });
    }, interval);
  }, [target, increment, interval, prefersReducedMotion]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setCount(0);
  }, [stop]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => stop();
  }, [autoStart, start, stop]);

  return { count, start, stop, reset };
}

/**
 * useTypingEffect - Simulates typing animation
 * Great for displaying text character by character
 *
 * @param {string} text - Text to type
 * @param {object} options
 * @param {number} options.speed - Typing speed in ms (default: 50)
 * @param {boolean} options.autoStart - Auto-start (default: true)
 * @returns {object} { displayText, isTyping, start, reset }
 */
export function useTypingEffect(text, { speed = 50, autoStart = true } = {}) {
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      return;
    }

    setIsTyping(true);
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText((prev) => prev + text[indexRef.current]);
        indexRef.current++;
      } else {
        clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, speed);
  }, [text, speed, prefersReducedMotion]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDisplayText('');
    indexRef.current = 0;
    setIsTyping(false);
  }, []);

  useEffect(() => {
    if (autoStart && text) {
      start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, autoStart, start]);

  return { displayText, isTyping, start, reset };
}

/**
 * useCountdown - Countdown timer hook
 * Counts down from a starting value to 0
 *
 * @param {number} initialTime - Starting time in seconds
 * @param {object} options
 * @param {boolean} options.autoStart - Auto-start countdown (default: false)
 * @param {function} options.onComplete - Callback when countdown reaches 0
 * @returns {object} { time, start, pause, reset, isRunning }
 */
export function useCountdown(initialTime, { autoStart = false, onComplete = null } = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onComplete]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setTime(initialTime);
  }, [initialTime, pause]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, start]);

  return { time, start, pause, reset, isRunning };
}

export default useCountUp;
