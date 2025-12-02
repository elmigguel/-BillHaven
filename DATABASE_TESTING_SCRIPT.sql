-- ============================================================================
-- BILLHAVEN DATABASE TESTING SCRIPT
-- Run these queries in Supabase SQL Editor to verify everything works
-- ============================================================================

-- ============================================================================
-- 1. VERIFY ALL TABLES EXIST
-- ============================================================================

SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'profiles', 'bills', 'transactions', 'payment_verifications', 'user_velocity',
    'trust_profiles', 'trust_events', 'hold_period_overrides', 'referrals', 'discount_usage'
)
ORDER BY table_name;

-- Expected: 10 rows

-- ============================================================================
-- 2. VERIFY ALL INDEXES EXIST
-- ============================================================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'bills', 'transactions', 'payment_verifications', 'user_velocity',
    'trust_profiles', 'trust_events', 'hold_period_overrides', 'referrals', 'discount_usage'
)
ORDER BY tablename, indexname;

-- Expected: 30+ indexes

-- ============================================================================
-- 3. VERIFY ALL RLS POLICIES EXIST
-- ============================================================================

SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: 25+ policies

-- ============================================================================
-- 4. VERIFY ALL FUNCTIONS EXIST
-- ============================================================================

SELECT
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'update_trust_updated_at',
    'update_referrals_updated_at_column',
    'calculate_trust_level',
    'update_trust_score',
    'get_hold_period',
    'validate_referral_activation',
    'check_discount_eligibility',
    'make_admin'
)
ORDER BY routine_name;

-- Expected: 9 functions

-- ============================================================================
-- 5. VERIFY ALL TRIGGERS EXIST
-- ============================================================================

SELECT
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected: 10+ triggers

-- ============================================================================
-- 6. VERIFY VIEWS EXIST
-- ============================================================================

SELECT
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('user_discount_balance', 'referral_stats');

-- Expected: 2 views

-- ============================================================================
-- 7. TEST TRUST SCORE SYSTEM
-- ============================================================================

-- Test calculate_trust_level function
SELECT
    score,
    calculate_trust_level(score) as level
FROM (
    VALUES (0), (25), (50), (100), (200), (300), (500), (1000)
) as test_scores(score);

-- Expected:
-- 0    -> NEW_USER
-- 25   -> NEW_USER
-- 50   -> VERIFIED
-- 100  -> VERIFIED
-- 200  -> TRUSTED
-- 300  -> TRUSTED
-- 500  -> POWER_USER
-- 1000 -> POWER_USER

-- ============================================================================
-- 8. TEST HOLD PERIOD CALCULATION
-- ============================================================================

-- First, create a test user trust profile
-- (Replace 'your-user-uuid-here' with actual user UUID from auth.users)
-- INSERT INTO trust_profiles (user_id, score, level)
-- VALUES ('your-user-uuid-here', 100, 'VERIFIED');

-- Test hold periods for different payment methods and trust levels
SELECT
    payment_method,
    level,
    get_hold_period(NULL, payment_method) as hold_seconds,
    ROUND(get_hold_period(NULL, payment_method) / 60.0, 2) as hold_minutes,
    ROUND(get_hold_period(NULL, payment_method) / 3600.0, 2) as hold_hours
FROM (
    VALUES
        ('IDEAL', 'NEW_USER'),
        ('IDEAL', 'VERIFIED'),
        ('SEPA_INSTANT', 'NEW_USER'),
        ('SEPA', 'NEW_USER'),
        ('CREDIT_CARD', 'NEW_USER'),
        ('CRYPTO_NATIVE', 'NEW_USER')
) as test_methods(payment_method, level);

-- ============================================================================
-- 9. VERIFY RLS IS ENABLED
-- ============================================================================

SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'bills', 'transactions', 'payment_verifications', 'user_velocity',
    'trust_profiles', 'trust_events', 'hold_period_overrides', 'referrals', 'discount_usage'
)
ORDER BY tablename;

-- Expected: All should have rowsecurity = TRUE

-- ============================================================================
-- 10. TEST REFERRAL CODE CONSTRAINTS
-- ============================================================================

-- Verify referral_code is UNIQUE
SELECT
    conname as constraint_name,
    contype as constraint_type,
    conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'referrals'::regclass
AND contype = 'u';

-- Expected: referrals_referral_code_key (UNIQUE)

-- ============================================================================
-- 11. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: All FK relationships properly defined

-- ============================================================================
-- 12. VERIFY COLUMN DEFAULTS
-- ============================================================================

SELECT
    table_name,
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'referrals'
ORDER BY ordinal_position;

-- Verify defaults:
-- - id: gen_random_uuid()
-- - status: 'pending'
-- - created_at: NOW()

-- ============================================================================
-- 13. TEST DISCOUNT ELIGIBILITY CALCULATION
-- ============================================================================

-- This tests the view logic
-- After creating some test referrals, run:
/*
SELECT
    user_id,
    active_referrals,
    transactions_used,
    volume_used,
    total_transactions_available,
    total_volume_available,
    transactions_remaining,
    volume_remaining,
    has_discount_available
FROM user_discount_balance
LIMIT 5;
*/

-- ============================================================================
-- 14. VERIFY COMMENTS/DOCUMENTATION
-- ============================================================================

SELECT
    c.table_name,
    pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description AS pgd
    ON pgd.objoid = st.relid
INNER JOIN information_schema.tables AS c
    ON (c.table_schema = st.schemaname AND c.table_name = st.relname)
WHERE c.table_schema = 'public'
ORDER BY c.table_name;

-- Expected: Comments on key tables

-- ============================================================================
-- 15. CHECK TRIGGER FUNCTIONS ARE ATTACHED
-- ============================================================================

SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE t.tgtype::integer & cast(28 as int2)
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        ELSE 'MULTIPLE'
    END AS trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 16. REFERRAL SYSTEM INTEGRATION TEST
-- ============================================================================

/*
-- MANUAL TEST SEQUENCE (Replace UUIDs with real ones from auth.users)

-- 1. Create a referral code
INSERT INTO referrals (referrer_id, referral_code, status)
VALUES ('user-uuid-1', 'TEST1234', 'pending');

-- 2. Apply referral code (user 2 signs up with code)
UPDATE referrals
SET referred_id = 'user-uuid-2'
WHERE referral_code = 'TEST1234';

-- 3. Activate referral (user 2 completes $500+ transaction)
UPDATE referrals
SET
    status = 'active',
    first_transaction_amount = 600,
    activated_at = NOW()
WHERE referral_code = 'TEST1234';

-- 4. Check discount balance
SELECT * FROM user_discount_balance WHERE user_id = 'user-uuid-1';

-- Expected:
-- active_referrals: 1
-- total_transactions_available: 3
-- total_volume_available: 10000
-- transactions_remaining: 3
-- volume_remaining: 10000
-- has_discount_available: true

-- 5. Try to use discount
INSERT INTO discount_usage (user_id, referral_id, transaction_id, amount, discount_amount)
SELECT
    'user-uuid-1',
    id,
    'some-transaction-uuid',
    5000,
    110  -- 50% of (5000 * 0.044) = 110
FROM referrals WHERE referral_code = 'TEST1234';

-- 6. Check updated balance
SELECT * FROM user_discount_balance WHERE user_id = 'user-uuid-1';

-- Expected:
-- transactions_used: 1
-- volume_used: 5000
-- transactions_remaining: 2
-- volume_remaining: 5000
*/

-- ============================================================================
-- 17. TRUST SCORE UPDATE TEST
-- ============================================================================

/*
-- Test updating trust score (replace with real user UUID)
SELECT update_trust_score(
    'user-uuid-here'::UUID,
    100,  -- points to add
    'TRADE_COMPLETED',
    'User completed first trade',
    '{"trade_id": "123", "amount": 1000}'::JSONB
);

-- Check trust events log
SELECT * FROM trust_events
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
*/

-- ============================================================================
-- 18. ADMIN FUNCTION TEST
-- ============================================================================

/*
-- Make a user admin (replace with real email)
SELECT make_admin('your-email@example.com');

-- Verify
SELECT id, email, role FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
*/

-- ============================================================================
-- 19. PERFORMANCE CHECK
-- ============================================================================

-- Check for missing indexes on FK columns
SELECT
    c.conrelid::regclass AS table_name,
    a.attname AS column_name,
    c.confrelid::regclass AS referenced_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'f'
AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
    AND a.attnum = ANY(i.indkey)
)
AND c.conrelid::regclass::text LIKE 'public.%';

-- Expected: No results (all FK columns should have indexes)

-- ============================================================================
-- 20. FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_index_count INTEGER;
    v_policy_count INTEGER;
    v_function_count INTEGER;
    v_trigger_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'profiles', 'bills', 'transactions', 'payment_verifications', 'user_velocity',
        'trust_profiles', 'trust_events', 'hold_period_overrides', 'referrals', 'discount_usage'
    );

    -- Count indexes
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public';

    -- Count policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public';

    -- Count triggers
    SELECT COUNT(*) INTO v_trigger_count
    FROM information_schema.triggers
    WHERE event_object_schema = 'public';

    -- Count views
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_schema = 'public';

    -- Report
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'BILLHAVEN DATABASE VALIDATION REPORT';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables:    % / 10 expected', v_table_count;
    RAISE NOTICE 'Indexes:   % (30+ expected)', v_index_count;
    RAISE NOTICE 'Policies:  % (25+ expected)', v_policy_count;
    RAISE NOTICE 'Functions: % (9+ expected)', v_function_count;
    RAISE NOTICE 'Triggers:  % (10+ expected)', v_trigger_count;
    RAISE NOTICE 'Views:     % / 2 expected', v_view_count;
    RAISE NOTICE '==========================================';

    -- Validation
    IF v_table_count = 10 AND v_view_count = 2 THEN
        RAISE NOTICE '✓ DATABASE MIGRATION SUCCESSFUL';
    ELSE
        RAISE WARNING '⚠ SOME OBJECTS MISSING - CHECK MIGRATION';
    END IF;
END $$;

-- ============================================================================
-- TESTING COMPLETE
-- ============================================================================
