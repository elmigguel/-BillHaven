/**
 * Input Sanitization Utilities for BillHaven
 * Protects against XSS, injection attacks, and malicious input
 */

/**
 * Sanitize text input by removing dangerous characters and HTML tags
 * @param {string} input - User input string
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} Sanitized string
 */
export function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script tags and dangerous attributes
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim and limit length
  sanitized = sanitized.trim().slice(0, maxLength);

  return sanitized;
}

/**
 * Sanitize numeric input (for amounts, fees, etc.)
 * @param {string|number} input - Numeric input
 * @param {object} options - Validation options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    decimals = 2,
    allowNegative = false
  } = options;

  if (input === null || input === undefined || input === '') return null;

  const num = parseFloat(input);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) return null;

  // Check negative
  if (!allowNegative && num < 0) return null;

  // Check range
  if (num < min || num > max) return null;

  // Round to decimals
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Validate and sanitize cryptocurrency wallet addresses
 * @param {string} address - Wallet address
 * @param {string} type - Address type: 'evm', 'btc', 'ton', 'solana', 'tron'
 * @returns {object} {isValid: boolean, sanitized: string}
 */
export function sanitizeWalletAddress(address, type = 'evm') {
  if (!address || typeof address !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  // Remove whitespace
  const sanitized = address.trim();

  // Validate by type
  switch (type.toLowerCase()) {
    case 'evm':
    case 'ethereum':
    case 'polygon':
    case 'bsc':
      // EVM addresses: 0x + 40 hex chars
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      return {
        isValid: evmRegex.test(sanitized),
        sanitized: sanitized.toLowerCase()
      };

    case 'btc':
    case 'bitcoin':
      // Bitcoin addresses: P2PKH (1...), P2SH (3...), Bech32 (bc1...)
      const btcRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
      return {
        isValid: btcRegex.test(sanitized),
        sanitized
      };

    case 'ton':
      // TON addresses: EQ... or UQ... (base64)
      const tonRegex = /^[EU]Q[A-Za-z0-9_-]{46,48}$/;
      return {
        isValid: tonRegex.test(sanitized),
        sanitized
      };

    case 'solana':
      // Solana addresses: base58, 32-44 chars
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return {
        isValid: solanaRegex.test(sanitized),
        sanitized
      };

    case 'tron':
      // Tron addresses: T + 33 chars
      const tronRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
      return {
        isValid: tronRegex.test(sanitized),
        sanitized
      };

    default:
      return { isValid: false, sanitized: '' };
  }
}

/**
 * Sanitize file name to prevent directory traversal and dangerous characters
 * @param {string} filename - Original filename
 * @param {number} maxLength - Maximum filename length (default: 255)
 * @returns {string} Sanitized filename
 */
export function sanitizeFileName(filename, maxLength = 255) {
  if (!filename || typeof filename !== 'string') return 'file';

  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[/\\?%*:|"<>]/g, '_');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Limit length while preserving extension
  if (sanitized.length > maxLength) {
    const parts = sanitized.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const name = parts.join('.').slice(0, maxLength - ext.length - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized || 'file';
}

/**
 * Sanitize URL to prevent XSS and open redirects
 * @param {string} url - URL string
 * @param {array} allowedDomains - Whitelist of allowed domains
 * @returns {object} {isValid: boolean, sanitized: string}
 */
export function sanitizeUrl(url, allowedDomains = []) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const sanitized = url.trim();

  try {
    const parsed = new URL(sanitized);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, sanitized: '' };
    }

    // Check domain whitelist if provided
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        return { isValid: false, sanitized: '' };
      }
    }

    return { isValid: true, sanitized: parsed.toString() };
  } catch (error) {
    return { isValid: false, sanitized: '' };
  }
}

/**
 * Sanitize email address
 * @param {string} email - Email address
 * @returns {object} {isValid: boolean, sanitized: string}
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const sanitized = email.trim().toLowerCase();

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  return {
    isValid: emailRegex.test(sanitized),
    sanitized
  };
}

/**
 * Sanitize transaction hash (blockchain tx hash)
 * @param {string} txHash - Transaction hash
 * @returns {object} {isValid: boolean, sanitized: string}
 */
export function sanitizeTxHash(txHash) {
  if (!txHash || typeof txHash !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const sanitized = txHash.trim();

  // 0x + 64 hex chars (common for most blockchains)
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;

  return {
    isValid: txHashRegex.test(sanitized),
    sanitized: sanitized.toLowerCase()
  };
}

/**
 * Debounce function to limit rate of function calls
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit rate of function calls
 * @param {function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, limit = 1000) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Comprehensive input validator for bill submission
 * @param {object} billData - Bill form data
 * @returns {object} {isValid: boolean, errors: object, sanitized: object}
 */
export function validateBillSubmission(billData) {
  const errors = {};
  const sanitized = {};

  // Title
  if (!billData.title || billData.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (billData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  } else {
    sanitized.title = sanitizeText(billData.title, 200);
  }

  // Amount
  const amount = sanitizeNumber(billData.amount, {
    min: 1,
    max: 1000000,
    decimals: 2
  });

  if (amount === null) {
    errors.amount = 'Invalid amount (must be between $1 and $1,000,000)';
  } else {
    sanitized.amount = amount;
  }

  // Description
  if (billData.description) {
    sanitized.description = sanitizeText(billData.description, 2000);
  }

  // Payment instructions
  if (!billData.payment_instructions || billData.payment_instructions.trim().length < 10) {
    errors.payment_instructions = 'Payment instructions must be at least 10 characters';
  } else {
    sanitized.payment_instructions = sanitizeText(billData.payment_instructions, 1000);
  }

  // TON address (optional)
  if (billData.maker_ton_address && billData.maker_ton_address.trim()) {
    const tonValidation = sanitizeWalletAddress(billData.maker_ton_address, 'ton');
    if (!tonValidation.isValid) {
      errors.maker_ton_address = 'Invalid TON wallet address';
    } else {
      sanitized.maker_ton_address = tonValidation.sanitized;
    }
  }

  // Category
  const validCategories = ['rent', 'food', 'utilities', 'transport', 'healthcare', 'entertainment', 'other'];
  if (!validCategories.includes(billData.category)) {
    errors.category = 'Invalid category';
  } else {
    sanitized.category = billData.category;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}
