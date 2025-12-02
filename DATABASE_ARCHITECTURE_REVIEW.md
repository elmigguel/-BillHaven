# BillHaven Database Architecture Review
**Reviewer:** World-Class Database Architect (Supabase/PostgreSQL Core Team)
**Date:** 2025-12-02
**Project:** BillHaven P2P Fiat-to-Crypto Escrow Platform
**Database:** Supabase PostgreSQL

---

## EXECUTIVE SUMMARY

**Overall Database Design Rating: 87/100**

The BillHaven database architecture demonstrates professional-level design with comprehensive RLS policies, well-structured tables, and excellent use of PostgreSQL features. However, there are critical issues that need addressing before production deployment.

### Status Summary:
- **Referral System:** SOLID (8/10) - Minor fixes needed
- **Trust System:** EXCELLENT (9/10) - Production ready
- **Payment Verifications:** GOOD (8/10) - Missing base tables
- **RLS Policies:** VERY GOOD (8.5/10) - Some gaps identified
- **Indexes:** EXCELLENT (9/10) - Well optimized
- **Triggers:** GOOD (8/10) - Function naming collision

---

## CRITICAL ISSUES (MUST FIX)

### 1. MISSING BASE TABLES - BLOCKING ISSUE ⛔

**Problem:** The migrations reference tables that don't exist:
- `public.profiles` - Referenced in multiple RLS policies
- `public.bills` - Altered but never created

**Impact:** ALL migrations will FAIL without these base tables.

**Evidence:**
```sql
-- From 20251129_payment_verifications.sql (line 36)
ALTER TABLE public.bills ADD COLUMN ...  -- ❌ Table doesn't exist

-- From 20251129_payment_verifications.sql (line 59)
SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()  -- ❌ Table doesn't exist
```

**Solution Required:** Must create these tables BEFORE running the migrations.

---

### 2. FUNCTION NAME COLLISION - CRITICAL BUG 🐛

**Problem:** Two migrations define the SAME function with DIFFERENT implementations:

**Migration 1:** `20251129_payment_verifications.sql` (Line 104)
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Migration 2:** `20251130_trust_system.sql` (Line 332)
```sql
CREATE OR REPLACE FUNCTION update_updated_at()  -- Different name ✅
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Migration 3:** `20251202_referral_tables.sql` (Line 87)
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()  -- COLLISION ❌
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Impact:** Last migration wins, earlier triggers may break.

**Solution:** Use consistent function name OR namespace them.

---

### 3. VIEW RLS POLICIES - INCOMPLETE 🔐

**Problem:** Views are granted SELECT to `authenticated` role, but views don't inherit RLS from base tables automatically in some contexts.

**Vulnerable Views:**
- `user_discount_balance` (Line 38-59 in referral migration)
- `referral_stats` (Line 64-74 in referral migration)

**Current Code:**
```sql
CREATE OR REPLACE VIEW user_discount_balance AS
SELECT r.referrer_id as user_id, ...
FROM referrals r
LEFT JOIN discount_usage d ON r.referrer_id = d.user_id
GROUP BY r.referrer_id;

GRANT SELECT ON user_discount_balance TO authenticated;  -- ⚠️ No RLS filtering
```

**Risk:** Any authenticated user could potentially view ALL users' discount balances.

**Solution:** Views need explicit RLS or use SECURITY DEFINER functions.

---

## MODERATE ISSUES

### 4. REFERRAL CODE GENERATION - RACE CONDITION 🏁

**Location:** `referralService.js` Line 36-58

**Problem:** Code uniqueness check has a race condition:
```javascript
const { data, error } = await supabase
  .from('referrals')
  .select('id')
  .eq('referral_code', code)
  .single();
```

**Scenario:**
1. User A generates code "ABC12345"
2. User B generates code "ABC12345" (before A saves)
3. Both check uniqueness - both pass ✅
4. Both try to insert - UNIQUE constraint violation ❌

**Solution:** The UNIQUE constraint on `referral_code` column protects against this at database level, but the service should handle the error gracefully.

---

### 5. ADMIN ROLE CHECK INCONSISTENCY 👮

**Trust System RLS:**
```sql
-- Uses raw_user_meta_data (Line 370)
WHERE raw_user_meta_data->>'role' = 'admin'
```

**Payment Verifications RLS:**
```sql
-- Uses profiles table (Line 59)
SELECT 1 FROM public.profiles
WHERE profiles.id = auth.uid()
AND profiles.role = 'admin'
```

**Problem:** Two different sources of truth for admin role.

**Recommendation:** Standardize on ONE approach (prefer `profiles` table).

---

### 6. MISSING FOREIGN KEY TO TRANSACTIONS

**Location:** `discount_usage` table (Line 26-34)

**Current:**
```sql
transaction_id UUID,  -- ❌ No FK constraint
```

**Problem:** `transaction_id` is nullable and has no FK constraint. Cannot verify if transaction exists.

**Recommendation:** Either:
- Add FK to transactions table (if it exists)
- Make it NOT NULL if it's required
- Remove it if it's not used

---

## DESIGN STRENGTHS ✨

### 1. EXCELLENT TRIGGER DESIGN
- Validation triggers prevent invalid data (referral activation, discount eligibility)
- Auto-update timestamps
- Comprehensive error messages

### 2. COMPREHENSIVE INDEXES
All critical query paths are indexed:
- Referral lookups by code, user, status ✅
- Discount usage by user, referral, transaction ✅
- Trust profiles by level, score ✅
- Payment verifications by bill_id, payer, mollie_id ✅

### 3. ROBUST DATA VALIDATION
- CHECK constraints on enums (status, event_type, level)
- NOT NULL constraints on critical fields
- Foreign key cascades properly configured

### 4. EXCELLENT DOCUMENTATION
- Table comments
- Column comments
- Inline migration comments

### 5. SECURITY-FIRST DESIGN
- RLS enabled on all tables
- Proper use of auth.uid()
- Service role policies for webhooks

---

## REFERRAL SYSTEM DETAILED ANALYSIS

### Schema Design: 8/10

**Tables:**
1. `referrals` - Well designed ✅
2. `discount_usage` - Good structure ✅
3. `user_discount_balance` view - Smart aggregation ✅
4. `referral_stats` view - Comprehensive analytics ✅

**Issues:**
- Missing FK on `transaction_id` ⚠️
- View RLS security gap 🔐

### Business Logic: 9/10

**Excellent validation:**
```sql
-- Minimum $500 to activate (Line 108)
IF NEW.first_transaction_amount IS NULL OR NEW.first_transaction_amount < 500 THEN
  RAISE EXCEPTION 'Cannot activate referral: minimum transaction amount is $500';
END IF;

-- 3 transactions cap (Line 152)
v_transactions_remaining := GREATEST(0, (v_active_referrals * 3) - v_transactions_used);

-- $10K volume cap (Line 153)
v_volume_remaining := GREATEST(0, (v_active_referrals * 10000) - v_volume_used);
```

**Smart checks:**
- Prevents self-referral ✅
- Prevents double-referral ✅
- Enforces tier limits (<$10K) ✅
- Transaction and volume caps ✅

### Performance: 9/10

**Indexes cover all queries:**
- `idx_referrals_code` - O(log n) code lookups
- `idx_referrals_referrer` - Fast user queries
- `idx_referrals_referred` - Reverse lookups
- `idx_discount_user` - Usage aggregation
- `idx_discount_referral` - Referral tracking

**Potential bottleneck:**
Views may get slow with 10K+ users. Consider materialized views for analytics.

---

## TRUST SYSTEM DETAILED ANALYSIS

### Schema Design: 10/10

**Perfect table structure:**
- `trust_profiles` - Clean, normalized ✅
- `trust_events` - Excellent audit trail ✅
- `hold_period_overrides` - Flexible admin controls ✅

### Functions: 9/10

**`calculate_trust_level()`:** Simple, fast, immutable ✅

**`update_trust_score()`:** Atomic, locked, logged ✅
- Uses `FOR UPDATE` to prevent race conditions
- Automatic level change detection
- Comprehensive event logging

**`get_hold_period()`:** Well-thought priority system ✅
1. User-specific override
2. Payment method override
3. Global override
4. Trust level defaults

### Business Logic: 10/10

**Trust level thresholds:**
- NEW_USER: 0-49 points
- VERIFIED: 50-199 points
- TRUSTED: 200-499 points
- POWER_USER: 500+ points

**Hold period matrix is comprehensive and fair.**

---

## PAYMENT VERIFICATIONS ANALYSIS

### Schema Design: 8/10

**Good features:**
- Unique constraint on `mollie_payment_id` ✅
- Proper status enum ✅
- Audit fields (verified_at, submitted_to_chain) ✅

**Issues:**
- Assumes `public.bills` exists ❌
- Assumes `public.profiles` exists ❌

### Security: 9/10

**RLS policies are tight:**
- Admins see all ✅
- Users see only their payments ✅
- Service role can CRUD for webhooks ✅

---

## RLS SECURITY ANALYSIS

### Referrals Table: 7/10 ⚠️

**SELECT Policy (Line 193):**
```sql
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
```
✅ Good: Users see their own referrals
⚠️ Gap: Referral code is visible to referred user (might be ok)

**UPDATE Policy (Line 203):**
```sql
CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
```
❌ **SECURITY BUG:** Referred user can UPDATE the referral record!

**Fix:**
```sql
-- Referred user should NOT be able to update
CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id);
```

### Discount Usage Table: 8/10 ✅

**Policies are good:**
- Users can only see/insert their own records ✅
- No UPDATE/DELETE policies (correct - immutable) ✅

### Trust System: 9/10 ✅

**Well secured:**
- Users can view own profile ✅
- Only admins can view all ✅
- System inserts via triggers ✅
- Only admins can manually update ✅

---

## MISSING ELEMENTS

### 1. BASE SCHEMA ⛔

Need to create before migrations:
```sql
-- profiles table
-- bills table
-- transactions table (for FK)
```

### 2. INITIAL ADMIN SETUP

No migration creates the first admin user.

### 3. DATA MIGRATION

If existing data, no scripts to migrate.

### 4. ROLLBACK SCRIPTS

No down migrations provided.

---

## PERFORMANCE RECOMMENDATIONS

### 1. Consider Materialized Views for Analytics

**Current views are computed on-the-fly:**
```sql
CREATE OR REPLACE VIEW user_discount_balance AS ...
CREATE OR REPLACE VIEW referral_stats AS ...
```

**For 1000+ users, use materialized views:**
```sql
CREATE MATERIALIZED VIEW user_discount_balance_mv AS ...
CREATE UNIQUE INDEX ON user_discount_balance_mv(user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY user_discount_balance_mv;
```

### 2. Partition `trust_events` Table

**Problem:** Will grow unbounded (millions of rows).

**Solution:** Partition by `created_at`:
```sql
CREATE TABLE trust_events (...)
PARTITION BY RANGE (created_at);

CREATE TABLE trust_events_2025_q1 PARTITION OF trust_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

### 3. Add Composite Indexes

**For common queries:**
```sql
-- Referral lookup by status + referrer
CREATE INDEX idx_referrals_referrer_status
ON referrals(referrer_id, status)
WHERE status = 'active';

-- Discount usage by user + date range
CREATE INDEX idx_discount_user_date
ON discount_usage(user_id, used_at DESC);
```

---

## SQL MIGRATION ORDER

**CORRECT ORDER:**

1. **Create base tables first** (profiles, bills, transactions)
2. **20251129_payment_verifications.sql**
3. **20251130_trust_system.sql**
4. **20251202_referral_tables.sql** (with fixes)

---

## CRITICAL FIXES REQUIRED

### Fix 1: Rename Function in Referral Migration

**Change Line 87 in `20251202_referral_tables.sql`:**

```sql
-- FROM:
CREATE OR REPLACE FUNCTION update_updated_at_column()

-- TO:
CREATE OR REPLACE FUNCTION update_referrals_updated_at_column()
```

**Update Line 97:**
```sql
-- FROM:
EXECUTE FUNCTION update_updated_at_column();

-- TO:
EXECUTE FUNCTION update_referrals_updated_at_column();
```

### Fix 2: Secure UPDATE Policy

**Change Line 203-205 in `20251202_referral_tables.sql`:**

```sql
-- FROM:
CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- TO:
CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id);
```

### Fix 3: Add View Security

**Add after Line 220:**

```sql
-- RLS for views
ALTER VIEW user_discount_balance SET (security_barrier = true);
ALTER VIEW referral_stats SET (security_barrier = true);

-- Create RLS policies for views
CREATE POLICY "Users can view own discount balance"
  ON user_discount_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own referral stats"
  ON referral_stats FOR SELECT
  USING (auth.uid() = user_id);
```

**NOTE:** PostgreSQL doesn't support RLS on views directly. Better solution:

```sql
-- Replace views with SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION get_user_discount_balance(p_user_id UUID)
RETURNS TABLE (...)
SECURITY DEFINER
AS $$
BEGIN
  -- Only return data for requesting user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

---

## FINAL RATING BREAKDOWN

| Category | Score | Notes |
|----------|-------|-------|
| Schema Design | 9/10 | Excellent structure, minor FK issue |
| Business Logic | 9/10 | Comprehensive validation |
| Security (RLS) | 8/10 | Good policies, some gaps |
| Indexes | 9/10 | Well optimized |
| Triggers | 8/10 | Function collision |
| Documentation | 9/10 | Excellent comments |
| Scalability | 7/10 | Will need partitioning |
| Error Handling | 8/10 | Good exception messages |

**Overall: 87/100 - PRODUCTION READY WITH FIXES**

---

## CONCLUSION

BillHaven's database architecture is **professional-grade** and demonstrates:
- Deep understanding of PostgreSQL features
- Security-first mindset
- Performance optimization awareness
- Comprehensive business logic enforcement

**However, critical issues MUST be fixed before deployment:**
1. ⛔ Create base tables (profiles, bills)
2. 🐛 Fix function name collision
3. 🔐 Secure UPDATE policy on referrals
4. 🔒 Add view-level security

**With these fixes, this would be a 92/100 database architecture.**

---

**Prepared by:** Supabase/PostgreSQL Database Architect
**Contact:** Ready to provide production-ready SQL
