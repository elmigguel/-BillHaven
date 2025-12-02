import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Respects accessibility preference: prefers-reduced-motion
 *
 * @returns {boolean} true if user prefers reduced motion
 *
 * Usage:
 * const prefersReducedMotion = useReducedMotion();
 *
 * <motion.div
 *   animate={{ x: 100 }}
 *   transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 * />
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if browser supports the media query
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}
