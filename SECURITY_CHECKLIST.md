# BillHaven Security Checklist

Quick reference for security verification and deployment.

---

## Pre-Deployment Checklist

### Environment Variables
- [ ] All required vars in `.env` file
- [ ] `STRIPE_WEBHOOK_SECRET` starts with `whsec_`
- [ ] `VITE_SENTRY_DSN` configured for production
- [ ] Different API keys for dev vs production
- [ ] `.env` file NOT committed to git
- [ ] Production `.env` encrypted/secured

### Server Configuration
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] CORS whitelist configured
- [ ] Rate limiting enabled
- [ ] Webhook endpoints secured
- [ ] Environment validation passes

### Frontend Security
- [ ] CSP meta tag in place
- [ ] Sentry initialized
- [ ] Input validation on all forms
- [ ] File upload limits enforced
- [ ] No inline scripts (CSP compliant)

### Payment Security
- [ ] Stripe webhook signature verification enabled
- [ ] OpenNode HMAC verification enabled
- [ ] Webhook secrets configured
- [ ] Test webhooks working
- [ ] Payment flows tested end-to-end

---

## Testing Checklist

### Input Validation Tests
- [ ] Submit form with XSS attempt (`<script>alert(1)</script>`)
- [ ] Submit with SQL injection attempt (`' OR 1=1--`)
- [ ] Submit with very long strings (>1000 chars)
- [ ] Submit with invalid amounts (0, -1, 999999999)
- [ ] Submit with invalid TON address
- [ ] Submit with oversized file (>10MB)
- [ ] Submit with wrong file type (.exe, .php)

### Rate Limiting Tests
- [ ] Submit form 3 times rapidly
- [ ] Verify cooldown message appears
- [ ] Wait 3 seconds and submit again
- [ ] Test server rate limit (30 req/min)

### Webhook Security Tests
- [ ] Send webhook without signature (should fail)
- [ ] Send webhook with wrong signature (should fail)
- [ ] Send webhook with correct signature (should succeed)
- [ ] Verify constant-time comparison prevents timing attacks

### Error Monitoring Tests
- [ ] Trigger intentional error
- [ ] Verify error appears in Sentry
- [ ] Verify sensitive data filtered (API keys, headers)
- [ ] Test session replay capture

---

## Post-Deployment Monitoring

### Daily
- [ ] Check Sentry for new errors
- [ ] Review Stripe webhook logs
- [ ] Monitor rate limit hits

### Weekly
- [ ] Review CSP violation reports
- [ ] Check for failed validation attempts
- [ ] Review server logs for anomalies
- [ ] Test all payment flows

### Monthly
- [ ] Rotate webhook secrets
- [ ] Update dependencies
- [ ] Review security policies
- [ ] Conduct security audit

### Quarterly
- [ ] Penetration testing
- [ ] Compliance review
- [ ] Update documentation
- [ ] Team security training

---

## Incident Response

### Suspected Attack
1. Check Sentry for anomalies
2. Review server logs
3. Check Stripe/OpenNode for suspicious activity
4. Block malicious IPs if confirmed
5. Rotate API keys if compromised

### Webhook Bypass Attempt
1. Immediately rotate webhook secrets
2. Review all recent transactions
3. Implement additional monitoring
4. Document incident

### XSS Detection
1. Review CSP violation reports
2. Check for unauthorized scripts
3. Update CSP policy if needed
4. Scan codebase for vulnerabilities

---

## Security Metrics to Track

- Total requests per day
- Rate limit hits per day
- Failed webhook verifications
- Failed input validations
- Sentry errors per day
- CSP violations per day
- File upload rejections

---

## Contact Information

**Stripe Support:** https://support.stripe.com
**OpenNode Support:** support@opennode.com
**Sentry Support:** support@sentry.io

---

**Last Updated:** 2025-12-02
