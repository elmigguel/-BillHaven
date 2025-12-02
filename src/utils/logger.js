/**
 * Production-safe logger utility
 * Only logs in development mode to prevent sensitive data leakage
 */

const isDev = import.meta.env.DEV || import.meta.env.VITE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDev) console.log('[BillHaven]', ...args);
  },

  info: (...args) => {
    if (isDev) console.info('[BillHaven INFO]', ...args);
  },

  warn: (...args) => {
    if (isDev) console.warn('[BillHaven WARN]', ...args);
  },

  error: (...args) => {
    // Errors always log for debugging, but sanitize in production
    if (isDev) {
      console.error('[BillHaven ERROR]', ...args);
    } else {
      // In production, only log error message without stack trace
      const sanitized = args.map(arg =>
        arg instanceof Error ? arg.message : arg
      );
      console.error('[BillHaven ERROR]', ...sanitized);
    }
  },

  debug: (...args) => {
    if (isDev) console.debug('[BillHaven DEBUG]', ...args);
  },

  // For payment/security sensitive operations - never log details in production
  secure: (...args) => {
    if (isDev) console.log('[BillHaven SECURE]', ...args);
  }
};

export default logger;
