# BillHaven Security Implementation Checklist

## Pre-Production Security Fixes

### Critical Fixes (REQUIRED before production)

- [ ] **1. Fix NPM Vulnerabilities** (15 mins)
  ```bash
  npm audit fix
  npm audit fix --force  # If needed
  npm audit --production  # Verify 0 vulnerabilities
  ```

- [ ] **2. Install Security Packages** (5 mins)
  ```bash
  # Frontend
  npm install dompurify crypto-js
  npm install --save-dev @types/dompurify
  
  # Backend
  cd server && npm install helmet express-rate-limit
  ```

- [ ] **3. Add Helmet.js to Backend** (10 mins)
  - [ ] Import helmet in `server/index.js`
  - [ ] Configure HSTS, frameguard, XSS filter
  - [ ] Add before CORS configuration

- [ ] **4. Add Security Headers to Vercel** (5 mins)
  - [ ] Update `vercel.json` with HSTS header
  - [ ] Add X-Frame-Options: DENY
  - [ ] Add Permissions-Policy

- [ ] **5. Create Secure Logger** (10 mins)
  - [ ] Create `src/utils/logger.js`
  - [ ] Integrate with Sentry for production errors
  - [ ] Development-only logging

- [ ] **6. Replace Console Logs** (60 mins)
  - [ ] `src/services/trustScoreService.js` (1 occurrence)
  - [ ] `src/services/paymentService.js` (4 occurrences)
  - [ ] `src/api/base44Client.js` (9 occurrences)
  - [ ] `src/contexts/TonWalletContext.jsx` (5 occurrences)
  - [ ] `src/contexts/WalletContext.jsx` (4 occurrences)

- [ ] **7. Add DOMPurify to Sanitization** (10 mins)
  - [ ] Update `src/utils/sanitize.js`
  - [ ] Replace regex-based HTML stripping
  - [ ] Add `sanitizeHtml()` function

- [ ] **8. Implement localStorage Encryption** (30 mins)
  - [ ] Create `src/utils/secureStorage.js`
  - [ ] Use crypto-js AES encryption
  - [ ] Update files using localStorage:
    - [ ] `src/services/invisibleSecurityService.js`
    - [ ] `src/services/creditCardPayment.js`
    - [ ] `src/contexts/WalletContext.jsx`

- [ ] **9. Upgrade Rate Limiting** (15 mins)
  - [ ] Replace in-memory limiter with express-rate-limit
  - [ ] Add global limiter (30 req/min)
  - [ ] Add payment limiter (5 req/15min)
  - [ ] Apply to all API routes

- [ ] **10. Enhance Sentry Integration** (10 mins)
  - [ ] Update beforeSend to filter wallet addresses
  - [ ] Sanitize breadcrumbs
  - [ ] Add ErrorBoundary → Sentry integration

---

## Testing Checklist

### Backend Tests
- [ ] Backend starts without errors
- [ ] Health endpoint responds
- [ ] Rate limiting works (429 after 30 requests)
- [ ] Security headers present in response
- [ ] Webhooks work (Stripe + OpenNode)

### Frontend Tests
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts
- [ ] No console.logs in production build
- [ ] Login/signup works
- [ ] Bill submission works
- [ ] Wallet connections work

### Security Tests
- [ ] NPM audit shows 0 vulnerabilities
- [ ] HSTS header present
- [ ] X-Frame-Options: DENY present
- [ ] CSP header present
- [ ] No sensitive data in localStorage (check encryption)
- [ ] Sentry receives errors (test with throw new Error)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All critical fixes implemented
- [ ] All tests passing
- [ ] Security score >= 90/100
- [ ] Code reviewed
- [ ] Environment variables ready

### Backend (Render.com)
- [ ] Commit and push backend changes
- [ ] Verify deployment succeeds
- [ ] Check logs for errors
- [ ] Test health endpoint
- [ ] Verify security headers

### Frontend (Vercel)
- [ ] Commit and push frontend changes
- [ ] Verify deployment succeeds
- [ ] Check build logs
- [ ] Test in production
- [ ] Verify security headers

### Post-Deployment
- [ ] Test all payment flows
- [ ] Test all authentication flows
- [ ] Monitor Sentry for errors
- [ ] Check rate limiting logs
- [ ] Verify webhooks working

---

## Environment Variables Checklist

### Backend (.env)
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET (starts with whsec_)
- [ ] VITE_OPENNODE_API_KEY
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] PORT=3001
- [ ] FRONTEND_URL
- [ ] SERVER_URL

### Frontend (.env)
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_STRIPE_PUBLISHABLE_KEY
- [ ] VITE_OPENNODE_API_KEY
- [ ] VITE_SENTRY_DSN
- [ ] VITE_STORAGE_ENCRYPTION_KEY (generate: `openssl rand -base64 32`)
- [ ] All blockchain RPC URLs

---

## Final Verification

### Security Score
- [ ] Authentication & Authorization: >= 85/100
- [ ] Data Protection: >= 85/100
- [ ] Network Security: >= 85/100
- [ ] API Security: >= 85/100
- [ ] Monitoring & Logging: >= 85/100
- [ ] Dependencies: >= 85/100
- [ ] **OVERALL: >= 90/100**

### Production Readiness
- [ ] All CRITICAL issues resolved
- [ ] All HIGH issues resolved
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained on security practices
- [ ] Incident response plan ready

---

## Ongoing Security Tasks

### Weekly
- [ ] Review Sentry errors
- [ ] Check webhook logs for anomalies
- [ ] Monitor rate limiting effectiveness

### Monthly
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review API key usage
- [ ] Check for new security advisories
- [ ] Update dependencies

### Quarterly
- [ ] Security audit
- [ ] Rotate API keys
- [ ] Rotate webhook secrets
- [ ] Penetration testing
- [ ] Review access controls

---

## Contacts & Resources

### Documentation
- Full Audit: `SECURITY_AUDIT_REPORT_PRODUCTION.md`
- Quick Fixes: `SECURITY_FIXES_QUICK_START.md`
- Summary: `SECURITY_SUMMARY.txt`

### Tools
- NPM Audit: `npm audit --production`
- Sentry: https://sentry.io/dashboard
- Helmet.js: https://helmetjs.github.io/
- DOMPurify: https://github.com/cure53/DOMPurify

### Support
- Security Email: security@billhaven.com
- Bug Bounty: Coming soon
- Disclosure Policy: 90-day responsible disclosure

---

## Sign-Off

**Security Audit Date:** December 2, 2025
**Audit Status:** ⚠️ NEEDS ATTENTION
**Security Score:** 72/100 → Target: 90+/100
**Estimated Fix Time:** 4-6 hours

**Sign-off by Security Team:**
- [ ] Security fixes implemented
- [ ] All tests passing
- [ ] Score >= 90/100
- [ ] Ready for production

**Approved by:** _____________________ **Date:** _____________________

**Production Deployment:** ⏸️ BLOCKED until security fixes complete

---

**Next Audit:** After fixes implemented + 1 month post-launch
