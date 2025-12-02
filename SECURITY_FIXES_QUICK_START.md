# BillHaven Security Fixes - Quick Start Guide
**Priority:** CRITICAL - Complete before production deployment
**Estimated Time:** 4-6 hours

---

## 🚨 CRITICAL FIXES (Do These First)

### 1. Fix NPM Vulnerabilities (15 mins)
```bash
cd /home/elmigguel/BillHaven

# Try non-breaking fixes first
npm audit fix

# If that doesn't work, force update (may need testing)
npm audit fix --force

# Verify fixes
npm audit --production

# Expected result: 0 vulnerabilities
```

**Test After:**
```bash
npm run build  # Ensure build still works
npm run dev    # Test locally
```

---

### 2. Install Security Packages (5 mins)
```bash
cd /home/elmigguel/BillHaven

# Frontend security packages
npm install dompurify crypto-js
npm install --save-dev @types/dompurify

# Backend security packages
cd server
npm install helmet express-rate-limit

cd ..
```

---

### 3. Add Security Headers to Backend (10 mins)

**File:** `/home/elmigguel/BillHaven/server/index.js`

**Add at line 6 (with other imports):**
```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
```

**Add at line 88 (before CORS config):**
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // We handle CSP in index.html
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Replace the existing rateLimit function (lines 14-40) with:**
```javascript
// Production-grade rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 payment attempts per 15 minutes
  message: 'Too many payment attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Replace line 244 (old rate limiter usage):**
```javascript
// Old: app.post('/api/create-payment-intent', rateLimit, async (req, res) => {
// New:
app.post('/api/create-payment-intent', paymentLimiter, async (req, res) => {
```

**Replace line 269 (old rate limiter usage):**
```javascript
// Old: app.post('/api/create-lightning-invoice', rateLimit, async (req, res) => {
// New:
app.post('/api/create-lightning-invoice', paymentLimiter, async (req, res) => {
```

**Add global rate limiter at line 198 (after JSON parser):**
```javascript
// Apply global rate limiter to all routes
app.use(globalLimiter);
```

---

### 4. Add Security Headers to Frontend (5 mins)

**File:** `/home/elmigguel/BillHaven/vercel.json`

**Replace entire file with:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=(), payment=(self)"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

### 5. Create Secure Logger Utility (10 mins)

**Create file:** `/home/elmigguel/BillHaven/src/utils/logger.js`

```javascript
/**
 * Secure Logger - Only logs in development
 * In production, use Sentry for error tracking
 */
import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logs - only in development
   */
  log: isDev ? console.log.bind(console) : () => {},

  /**
   * Warnings - always shown
   */
  warn: console.warn.bind(console),

  /**
   * Errors - logged to console and Sentry
   */
  error: (message, error = null) => {
    console.error(message, error);

    // Send to Sentry in production
    if (!isDev && error) {
      Sentry.captureException(error, {
        tags: { source: 'logger' },
        extra: { message }
      });
    }
  },

  /**
   * Debug info - only in development
   */
  debug: isDev ? console.debug.bind(console) : () => {},

  /**
   * Info logs - only in development
   */
  info: isDev ? console.info.bind(console) : () => {}
};

export default logger;
```

---

### 6. Replace Console Logs (30-60 mins)

**Find all console.log usage:**
```bash
cd /home/elmigguel/BillHaven
grep -rn "console\.log" src/ --include="*.js" --include="*.jsx"
```

**Files to update:**
1. `src/services/trustScoreService.js` (1 occurrence)
2. `src/services/paymentService.js` (4 occurrences)
3. `src/api/base44Client.js` (9 occurrences)
4. `src/contexts/TonWalletContext.jsx` (5 occurrences)
5. `src/contexts/WalletContext.jsx` (4 occurrences)

**Example replacement:**

**Before:**
```javascript
console.log('Payment initiated:', paymentData);
```

**After:**
```javascript
import logger from '../utils/logger';

logger.log('Payment initiated:', paymentData); // Only logs in dev
```

**For errors, keep console.error but also log to Sentry:**
```javascript
// Before
console.error('Payment failed:', error);

// After
import logger from '../utils/logger';
logger.error('Payment failed', error); // Logs to console + Sentry in prod
```

---

### 7. Enhance sanitize.js with DOMPurify (10 mins)

**File:** `/home/elmigguel/BillHaven/src/utils/sanitize.js`

**Add at top (line 1):**
```javascript
import DOMPurify from 'dompurify';
```

**Replace the sanitizeText function (lines 12-26) with:**
```javascript
/**
 * Sanitize text input by removing dangerous characters and HTML tags
 * @param {string} input - User input string
 * @param {number} maxLength - Maximum allowed length (default: 1000)
 * @returns {string} Sanitized string
 */
export function sanitizeText(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';

  // Remove ALL HTML tags with DOMPurify (more secure than regex)
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: []
  });

  // Additional protections
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim and limit length
  sanitized = sanitized.trim().slice(0, maxLength);

  return sanitized;
}
```

**Add new function at line 27:**
```javascript
/**
 * Sanitize HTML content for rich text (when needed)
 * @param {string} dirty - Untrusted HTML
 * @returns {string} Safe HTML
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // For opening links in new tabs
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
}
```

---

### 8. Add localStorage Encryption (20 mins)

**Create file:** `/home/elmigguel/BillHaven/src/utils/secureStorage.js`

```javascript
/**
 * Secure Storage - Encrypted localStorage for sensitive data
 * Uses AES encryption via crypto-js
 */
import CryptoJS from 'crypto-js';

// Use environment-specific key (never commit real key to git)
const STORAGE_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY ||
  (import.meta.env.DEV ? 'dev-encryption-key-change-in-production' : '');

// Warn if using default key in production
if (!import.meta.env.DEV && !import.meta.env.VITE_STORAGE_ENCRYPTION_KEY) {
  console.warn('WARNING: Using default encryption key. Set VITE_STORAGE_ENCRYPTION_KEY in production.');
}

export const secureStorage = {
  /**
   * Store encrypted data in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  set(key, value) {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, STORAGE_KEY).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('secureStorage.set error:', error);
    }
  },

  /**
   * Get and decrypt data from localStorage
   * @param {string} key - Storage key
   * @returns {any} Decrypted value or null
   */
  get(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, STORAGE_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) return null; // Decryption failed

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('secureStorage.get error:', error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clear all localStorage
   */
  clear() {
    localStorage.clear();
  }
};

export default secureStorage;
```

**Update .env.example to include:**
```bash
# ====================
# SECURITY CONFIGURATION
# ====================
# Encryption key for localStorage (generate with: openssl rand -base64 32)
VITE_STORAGE_ENCRYPTION_KEY=your-256-bit-encryption-key-here
```

**Update files that use localStorage:**

Example for `src/services/invisibleSecurityService.js`:
```javascript
// Before
const storedFingerprint = localStorage.getItem('device_fingerprint');

// After
import { secureStorage } from '../utils/secureStorage';
const storedFingerprint = secureStorage.get('device_fingerprint');
```

---

### 9. Enhance Sentry Integration (5 mins)

**File:** `/home/elmigguel/BillHaven/src/main.jsx`

**Update beforeSend function (line 23):**
```javascript
beforeSend(event, hint) {
  // Filter sensitive data from errors
  if (event.request?.headers) {
    delete event.request.headers.Authorization;
    delete event.request.headers['X-API-Key'];
  }

  // Sanitize user context (NEW)
  if (event.user) {
    delete event.user.wallet_address;
    delete event.user.private_key;
    delete event.user.mnemonic;
  }

  // Sanitize breadcrumbs (NEW)
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data) {
        delete breadcrumb.data.wallet_address;
        delete breadcrumb.data.private_key;
        delete breadcrumb.data.api_key;
      }
      return breadcrumb;
    });
  }

  return event;
},
```

---

### 10. Update ErrorBoundary with Sentry (5 mins)

**File:** `/home/elmigguel/BillHaven/src/components/ErrorBoundary.jsx`

**Update componentDidCatch (line 13):**
```javascript
componentDidCatch(error, errorInfo) {
  // ENHANCED ERROR LOGGING
  console.group('🚨 ERROR BOUNDARY TRIGGERED');
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  console.error('Component Stack:', errorInfo.componentStack);
  console.groupEnd();

  // Send to Sentry in production (NEW)
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
  }

  this.setState({ error, errorInfo });
}
```

**Add import at top:**
```javascript
import * as Sentry from '@sentry/react';
```

---

## ✅ TESTING CHECKLIST

After implementing fixes, test:

### Backend Tests
```bash
cd /home/elmigguel/BillHaven/server

# 1. Start backend
npm start

# 2. Test health endpoint
curl http://localhost:3001/health

# 3. Test rate limiting (should get 429 after 30 requests)
for i in {1..35}; do curl http://localhost:3001/health; done

# 4. Test security headers
curl -I http://localhost:3001/health | grep -i "x-frame\|hsts\|content-type"
```

### Frontend Tests
```bash
cd /home/elmigguel/BillHaven

# 1. Build (check for errors)
npm run build

# 2. Run dev server
npm run dev

# 3. Test in browser
# - Open http://localhost:5173
# - Check console for errors
# - Test login/signup
# - Test bill submission
# - Verify no console.logs in production build
```

### Security Header Tests (after deployment)
```bash
# Test Vercel headers
curl -I https://your-vercel-app.vercel.app | grep -i "hsts\|x-frame\|x-content"

# Test Render.com headers
curl -I https://billhaven.onrender.com/health | grep -i "hsts\|x-frame\|x-content"
```

### Vulnerability Scan
```bash
# Re-run npm audit
npm audit --production

# Expected: 0 vulnerabilities
```

---

## 🚀 DEPLOYMENT STEPS

### 1. Test Locally
```bash
# Backend
cd server && npm start

# Frontend (new terminal)
npm run dev

# Test all payment flows
# Test all authentication flows
# Test wallet connections
```

### 2. Deploy Backend (Render.com)
```bash
# Commit changes
git add server/
git commit -m "security: Add Helmet, upgrade rate limiting, fix vulnerabilities"

# Push to trigger Render.com deploy
git push origin main

# Verify deployment
curl https://billhaven.onrender.com/health
```

### 3. Deploy Frontend (Vercel)
```bash
# Commit changes
git add .
git commit -m "security: Add DOMPurify, secure logger, localStorage encryption"

# Push to trigger Vercel deploy
git push origin main

# Verify deployment
curl -I https://your-vercel-app.vercel.app
```

### 4. Update Environment Variables

**Render.com (Backend):**
- Add all required env vars from `.env.example`
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Verify `VITE_OPENNODE_API_KEY` is set

**Vercel (Frontend):**
- Add `VITE_SENTRY_DSN`
- Add `VITE_STORAGE_ENCRYPTION_KEY` (generate with `openssl rand -base64 32`)
- Add all blockchain RPC URLs

---

## 📊 FINAL VERIFICATION

### Security Checklist
- [ ] NPM audit shows 0 vulnerabilities
- [ ] Helmet.js installed and configured
- [ ] Security headers present (HSTS, X-Frame-Options)
- [ ] Rate limiting upgraded (express-rate-limit)
- [ ] DOMPurify installed and used
- [ ] Console.logs replaced with logger utility
- [ ] localStorage encrypted for sensitive data
- [ ] Sentry configured with data sanitization
- [ ] ErrorBoundary sends errors to Sentry
- [ ] All tests passing

### Deployment Checklist
- [ ] Backend deployed to Render.com
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] HTTPS enforced
- [ ] Webhooks tested (Stripe + OpenNode)
- [ ] Payment flows tested
- [ ] Sentry receiving errors

---

## 🆘 TROUBLESHOOTING

### "npm audit fix" breaks the build
```bash
# Revert changes
git restore package.json package-lock.json

# Update packages manually
npm update @solana/spl-token@latest
npm update bitcoinjs-lib@latest
npm update ecpair@latest

# Test build
npm run build
```

### Rate limiting not working
```bash
# Check Helmet is installed
npm list helmet

# Check server logs for errors
tail -f server/logs/server.log

# Test with curl
for i in {1..35}; do curl http://localhost:3001/health; echo "Request $i"; done
```

### Sentry not receiving errors
```bash
# Check DSN is set
echo $VITE_SENTRY_DSN

# Check Sentry is initialized
grep "Sentry.init" src/main.jsx

# Test error manually
throw new Error('Test error for Sentry');
```

### localStorage encryption failing
```bash
# Check encryption key is set
echo $VITE_STORAGE_ENCRYPTION_KEY

# Check crypto-js is installed
npm list crypto-js

# Test manually in console
import { secureStorage } from './utils/secureStorage';
secureStorage.set('test', { data: 'hello' });
console.log(secureStorage.get('test'));
```

---

## 📞 SUPPORT

If you encounter issues:
1. Check the full audit report: `SECURITY_AUDIT_REPORT_PRODUCTION.md`
2. Review error logs: `tail -f server/logs/server.log`
3. Check Sentry dashboard for production errors
4. Review npm audit output: `npm audit --production`

---

**Estimated Total Time:** 4-6 hours
**Priority:** CRITICAL - Block production deployment until complete
**Next Steps:** After fixes, run full security audit again
