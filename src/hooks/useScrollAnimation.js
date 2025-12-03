import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * useScrollAnimation - Trigger animations when element enters viewport
 *
 * Features:
 * - Detects when element is visible
 * - Optional trigger once or repeat
 * - Configurable threshold
 * - Respects reduced motion preferences
 *
 * @param {object} options
 * @param {number} options.threshold - Percentage of element visible to trigger (0-1, default: 0.1)
 * @param {boolean} options.triggerOnce - Only trigger animation once (default: true)
 * @param {string} options.rootMargin - Margin around root (default: '0px')
 * @returns {object} { ref, isVisible }
 *
 * Usage:
 * const { ref, isVisible } = useScrollAnimation();
 * <motion.div
 *   ref={ref}
 *   initial={{ opacity: 0 }}
 *   animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
 * />
 */
export function useScrollAnimation({
  threshold = 0.1,
  triggerOnce = true,
  rootMargin = '0px',
} = {}) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // If reduced motion, show immediately
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;

        if (visible && triggerOnce && hasTriggered.current) {
          return; // Already triggered, don't trigger again
        }

        if (visible) {
          hasTriggered.current = true;
          setIsVisible(true);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, triggerOnce, rootMargin, prefersReducedMotion]);

  return { ref, isVisible };
}

/**
 * useScrollProgress - Track scroll progress of an element
 * Returns a value between 0 and 1
 *
 * @param {object} options
 * @param {string} options.container - Container selector (default: window)
 * @returns {number} progress - Scroll progress (0-1)
 *
 * Usage:
 * const progress = useScrollProgress();
 * <motion.div style={{ scaleX: progress }} />
 */
export function useScrollProgress({ container = null } = {}) {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    const handleScroll = () => {
      let scrollElement;
      let scrollHeight;
      let clientHeight;
      let scrollTop;

      if (container) {
        scrollElement = document.querySelector(container);
        if (!scrollElement) return;
        scrollHeight = scrollElement.scrollHeight;
        clientHeight = scrollElement.clientHeight;
        scrollTop = scrollElement.scrollTop;
      } else {
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
        scrollTop = window.scrollY;
      }

      const maxScroll = scrollHeight - clientHeight;
      const currentProgress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setProgress(Math.min(Math.max(currentProgress, 0), 1));
    };

    const scrollElement = container ? document.querySelector(container) : window;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial calculation
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [container, prefersReducedMotion]);

  return progress;
}

/**
 * useParallax - Create parallax scrolling effect
 * Returns a transform value based on scroll position
 *
 * @param {number} speed - Parallax speed multiplier (default: 0.5)
 * @returns {object} { ref, y }
 *
 * Usage:
 * const { ref, y } = useParallax(0.5);
 * <motion.div ref={ref} style={{ y }} />
 */
export function useParallax(speed = 0.5) {
  const ref = useRef(null);
  const [y, setY] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setY(0);
      return;
    }

    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const viewportCenter = scrolled + window.innerHeight / 2;

      // Calculate parallax offset
      const offset = (viewportCenter - elementTop) * speed;
      setY(offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, prefersReducedMotion]);

  return { ref, y };
}

/**
 * useScrollDirection - Detect scroll direction
 * Returns 'up', 'down', or null
 *
 * @param {number} threshold - Minimum scroll distance to detect (default: 10)
 * @returns {string|null} direction - 'up', 'down', or null
 *
 * Usage:
 * const direction = useScrollDirection();
 * // Hide header on scroll down, show on scroll up
 */
export function useScrollDirection(threshold = 10) {
  const [direction, setDirection] = useState(null);
  const lastScrollY = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDirection(null);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const difference = scrollY - lastScrollY.current;

      if (Math.abs(difference) < threshold) {
        return; // Not enough movement
      }

      setDirection(difference > 0 ? 'down' : 'up');
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    lastScrollY.current = window.scrollY; // Initialize

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, prefersReducedMotion]);

  return direction;
}

/**
 * useScrollLock - Lock/unlock body scroll
 * Useful for modals and overlays
 *
 * @param {boolean} locked - Whether scroll should be locked
 *
 * Usage:
 * useScrollLock(isModalOpen);
 */
export function useScrollLock(locked = false) {
  useEffect(() => {
    if (locked) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [locked]);
}

export default useScrollAnimation;
