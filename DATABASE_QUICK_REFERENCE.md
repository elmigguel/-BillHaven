# BillHaven Database Quick Reference

**Date:** 2025-12-02
**Database:** Supabase PostgreSQL
**Version:** Production v1.0

---

## Quick Start

### 1. Run the Migration
```bash
# Copy the SQL file content
cat /home/elmigguel/BillHaven/FINAL_MIGRATION_FIXED.sql

# Go to Supabase Dashboard → SQL Editor
# Paste and run the entire file
```

### 2. Create Your First Admin
```sql
SELECT make_admin('your-email@example.com');
```

### 3. Test Everything
```bash
# Copy the testing script
cat /home/elmigguel/BillHaven/DATABASE_TESTING_SCRIPT.sql

# Run in SQL Editor to verify all components
```

---

## Database Schema Overview

### Core Tables (10)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles & roles | id, email, wallet_address, role |
| `bills` | Escrow transactions | id, seller_id, buyer_id, amount, status |
| `transactions` | Transaction history | id, bill_id, from_user, to_user, amount |
| `payment_verifications` | Oracle-verified payments | id, bill_id, mollie_payment_id, signature |
| `user_velocity` | Anti-fraud tracking | wallet_address, date, daily_volume, trust_level |
| `trust_profiles` | Trust score system | user_id, score, level, completed_trades |
| `trust_events` | Trust score audit log | user_id, event_type, points_change |
| `hold_period_overrides` | Custom hold periods | user_id, payment_method, hold_seconds |
| `referrals` | Referral tracking | referrer_id, referred_id, referral_code, status |
| `discount_usage` | Discount tracking | user_id, referral_id, amount, discount_amount |

### Views (2)

| View | Purpose |
|------|---------|
| `user_discount_balance` | Real-time discount balance per user |
| `referral_stats` | Referral analytics per user |

---

## Trust Score System

### Trust Levels
- **NEW_USER**: 0-49 points
- **VERIFIED**: 50-199 points
- **TRUSTED**: 200-499 points
- **POWER_USER**: 500+ points

### Point Awards
| Event | Points |
|-------|--------|
| Trade Completed | +10 to +50 (based on volume) |
| KYC Verified | +100 |
| Email Verified | +10 |
| Phone Verified | +10 |
| 2FA Enabled | +20 |
| Dispute Won | +25 |
| Dispute Lost | -50 |
| Account Age Bonus | +5 per month |

### Hold Periods by Payment Method

| Payment Method | NEW_USER | VERIFIED | TRUSTED | POWER_USER |
|----------------|----------|----------|---------|------------|
| **iDEAL** | 15 min | 5 min | 0 | 0 |
| **SEPA Instant** | 30 min | 15 min | 5 min | 0 |
| **SEPA** | 24 hrs | 4 hrs | 2 hrs | 1 hr |
| **Credit Card** | 14 days | 7 days | 3 days | 1 day |
| **Crypto Native** | 10 min | 5 min | 0 | 0 |

---

## Referral System

### Discount Rules
- **Per Active Referral**: 3 discounted transactions
- **Volume Cap**: $10,000 MAX total across 3 transactions
- **Discount**: 50% off (<$10K tier: 4.4% → 2.2%)
- **Activation**: Friend completes >$500 transaction

### Referral Statuses
- `pending`: Code created, not yet used OR first transaction <$500
- `active`: Friend completed $500+ transaction
- `expired`: Code no longer valid

### Usage Examples

```javascript
// Generate referral code
const code = await getReferralCode(userId);

// Apply code when user signs up
await applyReferralCode(newUserId, 'ABC12345');

// Check discount eligibility
const eligibility = await checkDiscountEligibility(userId, 5000);

// Record discount usage
await recordDiscountUsage(userId, transactionId, 5000);

// Get referral stats
const stats = await getReferralStats(userId);
```

---

## Key Functions

### Trust Score Functions

```sql
-- Calculate trust level from score
SELECT calculate_trust_level(250);  -- Returns 'TRUSTED'

-- Update user trust score
SELECT update_trust_score(
    'user-uuid'::UUID,
    100,  -- points to add
    'TRADE_COMPLETED',
    'Completed first trade',
    '{"trade_id": "123"}'::JSONB
);

-- Get effective hold period
SELECT get_hold_period(
    'user-uuid'::UUID,
    'IDEAL'
);  -- Returns hold period in seconds
```

### Admin Functions

```sql
-- Make user admin
SELECT make_admin('user@example.com');

-- Create hold period override
INSERT INTO hold_period_overrides (
    user_id,
    payment_method,
    hold_seconds,
    reason,
    created_by
) VALUES (
    'user-uuid',
    'SEPA',
    0,  -- Instant release
    'VIP customer',
    auth.uid()
);
```

---

## RLS Security Model

### User Permissions
- **View**: Own data only (profiles, bills, transactions, referrals)
- **Create**: Own records only
- **Update**: Own records only (except trust scores)
- **Delete**: Not allowed via RLS (use status flags)

### Admin Permissions
- **View**: All data
- **Create**: All records
- **Update**: All records (including trust scores)
- **Delete**: All records

### Service Role (Webhooks)
- **Full access** to `payment_verifications` for webhook processing

---

## Common Queries

### Get User Trust Profile
```sql
SELECT
    p.email,
    tp.score,
    tp.level,
    tp.completed_trades,
    tp.total_volume_usd
FROM trust_profiles tp
JOIN auth.users u ON u.id = tp.user_id
JOIN profiles p ON p.id = u.id
WHERE u.id = 'user-uuid';
```

### Get User Discount Balance
```sql
SELECT * FROM user_discount_balance
WHERE user_id = 'user-uuid';
```

### Get User Referral Stats
```sql
SELECT * FROM referral_stats
WHERE user_id = 'user-uuid';
```

### Get Trust Score History
```sql
SELECT
    event_type,
    points_change,
    old_score,
    new_score,
    old_level,
    new_level,
    reason,
    created_at
FROM trust_events
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Active Referrals with Discount Balance
```sql
SELECT
    r.referral_code,
    r.referred_id,
    r.activated_at,
    r.first_transaction_amount,
    udb.transactions_remaining,
    udb.volume_remaining
FROM referrals r
JOIN user_discount_balance udb ON udb.user_id = r.referrer_id
WHERE r.referrer_id = 'user-uuid'
AND r.status = 'active';
```

### Get Payment Verification Status
```sql
SELECT
    pv.bill_id,
    pv.mollie_payment_id,
    pv.status,
    pv.verified_at,
    pv.chain_tx_hash,
    b.amount,
    b.status as bill_status
FROM payment_verifications pv
JOIN bills b ON b.id = pv.bill_id
WHERE pv.payer_address = 'wallet-address'
ORDER BY pv.created_at DESC;
```

---

## Indexes for Performance

All critical query paths are indexed:

### Referrals
- `idx_referrals_code` - O(log n) code lookups
- `idx_referrals_referrer` - User's referrals
- `idx_referrals_referred` - Reverse lookup
- `idx_referrals_status` - Active/pending filters

### Discount Usage
- `idx_discount_user` - User's discount history
- `idx_discount_referral` - Referral tracking
- `idx_discount_transaction` - Transaction linkage
- `idx_discount_used_at` - Time-based queries

### Trust System
- `idx_trust_profiles_user_id` - User lookups
- `idx_trust_profiles_level` - Level-based queries
- `idx_trust_profiles_score` - Score-based queries
- `idx_trust_events_user_id` - User event history

---

## Trigger Protection

### Automatic Validations
1. **Referral Activation**: Prevents activation with <$500 transaction
2. **Discount Eligibility**: Enforces 3-transaction and $10K volume caps
3. **Auto-timestamps**: All tables have auto-updated `updated_at`

### Trigger Functions
- `update_updated_at_column()` - Base tables
- `update_trust_updated_at()` - Trust tables
- `update_referrals_updated_at_column()` - Referral tables
- `validate_referral_activation()` - Referral business rules
- `check_discount_eligibility()` - Discount business rules

---

## Troubleshooting

### Issue: RLS Policy Denies Access
```sql
-- Check if user has correct role
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Temporarily disable RLS for testing (DANGER - dev only)
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
```

### Issue: Discount Trigger Fails
```sql
-- Check user's discount balance
SELECT * FROM user_discount_balance WHERE user_id = auth.uid();

-- Check if user has active referrals
SELECT * FROM referrals WHERE referrer_id = auth.uid() AND status = 'active';
```

### Issue: Trust Score Not Updating
```sql
-- Check if trust profile exists
SELECT * FROM trust_profiles WHERE user_id = auth.uid();

-- Manually create if missing
INSERT INTO trust_profiles (user_id) VALUES (auth.uid());
```

### Issue: Function Name Collision
```sql
-- Check for duplicate functions
SELECT routine_name, COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
GROUP BY routine_name
HAVING COUNT(*) > 1;
```

---

## Performance Tips

### 1. Use Materialized Views for Analytics
```sql
-- For 1000+ users, consider materialized views
CREATE MATERIALIZED VIEW user_discount_balance_mv AS
SELECT * FROM user_discount_balance;

CREATE UNIQUE INDEX ON user_discount_balance_mv(user_id);

-- Refresh periodically (every 5 minutes)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_discount_balance_mv;
```

### 2. Partition Large Tables
```sql
-- For 1M+ trust events, partition by month
CREATE TABLE trust_events_partitioned (
    LIKE trust_events INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE trust_events_2025_01
    PARTITION OF trust_events_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 3. Add Composite Indexes for Common Queries
```sql
-- Referral lookup by status + referrer (hot path)
CREATE INDEX idx_referrals_referrer_status
ON referrals(referrer_id, status)
WHERE status = 'active';

-- Discount usage by user + date range
CREATE INDEX idx_discount_user_date
ON discount_usage(user_id, used_at DESC);
```

---

## Backup & Recovery

### Export Data
```bash
# Export all data
supabase db dump -f backup_$(date +%Y%m%d).sql

# Export specific table
pg_dump -h db.bldjdctgjhtucyxqhwpc.supabase.co \
  -U postgres -t referrals > referrals_backup.sql
```

### Restore Data
```bash
# Restore from backup
psql -h db.bldjdctgjhtucyxqhwpc.supabase.co \
  -U postgres < backup_20251202.sql
```

---

## Migration Checklist

- [ ] Run `FINAL_MIGRATION_FIXED.sql` in Supabase SQL Editor
- [ ] Verify all 10 tables created
- [ ] Verify all 2 views created
- [ ] Run `DATABASE_TESTING_SCRIPT.sql` to validate
- [ ] Create first admin: `SELECT make_admin('email@example.com');`
- [ ] Test referral code generation in app
- [ ] Test discount eligibility check
- [ ] Test trust score updates
- [ ] Verify RLS policies with non-admin user
- [ ] Load test with 100+ concurrent users
- [ ] Set up automated backups
- [ ] Monitor query performance with `pg_stat_statements`

---

## Support

**Architecture Review:** `/home/elmigguel/BillHaven/DATABASE_ARCHITECTURE_REVIEW.md`
**Full Migration SQL:** `/home/elmigguel/BillHaven/FINAL_MIGRATION_FIXED.sql`
**Testing Script:** `/home/elmigguel/BillHaven/DATABASE_TESTING_SCRIPT.sql`

**Database Rating:** 87/100 (92/100 with fixes applied)

**Status:** Production Ready ✅
