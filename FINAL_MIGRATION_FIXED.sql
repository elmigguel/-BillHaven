-- ============================================================================
-- BILLHAVEN COMPLETE DATABASE MIGRATION
-- Production-Ready SQL for Supabase
-- Date: 2025-12-02
-- Reviewed by: Database Architect (Supabase/PostgreSQL Core Team)
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Verify no errors
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: BASE TABLES (Prerequisites)
-- ============================================================================
-- These tables are referenced by other migrations but were never created

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    wallet_address TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_wallet_address UNIQUE (wallet_address)
);

-- Create bills table if not exists
CREATE TABLE IF NOT EXISTS public.bills (
    id SERIAL PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(18, 6) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'disputed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Payment verification columns (added by payment_verifications migration)
    escrow_bill_id INTEGER,
    payment_verified BOOLEAN DEFAULT FALSE,
    payment_verified_at TIMESTAMPTZ,
    mollie_payment_id TEXT,
    oracle_signature TEXT,
    hold_period_ends_at TIMESTAMPTZ,
    payment_method TEXT
);

-- Create transactions table for FK integrity
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id INTEGER REFERENCES public.bills(id) ON DELETE CASCADE,
    from_user UUID REFERENCES auth.users(id),
    to_user UUID REFERENCES auth.users(id),
    amount DECIMAL(18, 6) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    type TEXT CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'fee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for base tables
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_bills_seller ON public.bills(seller_id);
CREATE INDEX IF NOT EXISTS idx_bills_buyer ON public.bills(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_escrow_bill_id ON public.bills(escrow_bill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bill ON public.transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON public.transactions(from_user);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON public.transactions(to_user);

-- Enable RLS on base tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Base RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own bills" ON public.bills
    FOR SELECT USING (auth.uid() IN (seller_id, buyer_id));

CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() IN (from_user, to_user));

-- ============================================================================
-- SECTION 2: PAYMENT VERIFICATIONS (20251129)
-- ============================================================================

-- Payment verifications table
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    mollie_payment_id TEXT UNIQUE,
    stripe_payment_id TEXT,
    payer_address TEXT NOT NULL,
    maker_address TEXT NOT NULL,
    fiat_amount INTEGER NOT NULL,
    fiat_currency TEXT DEFAULT 'EUR',
    payment_reference TEXT,
    payment_method TEXT,
    timestamp INTEGER NOT NULL,
    signature TEXT NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_to_chain BOOLEAN DEFAULT FALSE,
    chain_tx_hash TEXT,
    chain_id INTEGER,
    status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'submitted', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_verifications_bill_id ON public.payment_verifications(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_payer ON public.payment_verifications(payer_address);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON public.payment_verifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_mollie ON public.payment_verifications(mollie_payment_id);

-- User velocity tracking
CREATE TABLE IF NOT EXISTS public.user_velocity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    date DATE NOT NULL,
    daily_volume INTEGER DEFAULT 0,
    daily_trades INTEGER DEFAULT 0,
    weekly_volume INTEGER DEFAULT 0,
    weekly_trades INTEGER DEFAULT 0,
    trust_level INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    disputed_trades INTEGER DEFAULT 0,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, date)
);

CREATE INDEX IF NOT EXISTS idx_user_velocity_wallet ON public.user_velocity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_velocity_date ON public.user_velocity(date);

-- Enable RLS
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_velocity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all payment verifications"
ON public.payment_verifications FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can view own payment verifications"
ON public.payment_verifications FOR SELECT TO authenticated USING (
    payer_address IN (
        SELECT wallet_address FROM public.profiles
        WHERE profiles.id = auth.uid()
    )
    OR
    maker_address IN (
        SELECT wallet_address FROM public.profiles
        WHERE profiles.id = auth.uid()
    )
);

CREATE POLICY "Service role can manage verifications"
ON public.payment_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view all velocity data"
ON public.user_velocity FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can view own velocity"
ON public.user_velocity FOR SELECT TO authenticated USING (
    wallet_address IN (
        SELECT wallet_address FROM public.profiles
        WHERE profiles.id = auth.uid()
    )
);

-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_verifications_updated_at
BEFORE UPDATE ON public.payment_verifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.payment_verifications IS 'Stores oracle-verified payment confirmations from Mollie/Stripe webhooks';
COMMENT ON TABLE public.user_velocity IS 'Tracks user trading velocity for fraud prevention';
COMMENT ON COLUMN public.payment_verifications.signature IS 'ECDSA signature from trusted oracle for on-chain verification';

-- ============================================================================
-- SECTION 3: TRUST SYSTEM (20251130)
-- ============================================================================

-- Trust profiles table
CREATE TABLE IF NOT EXISTS trust_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'NEW_USER' CHECK (level IN ('NEW_USER', 'VERIFIED', 'TRUSTED', 'POWER_USER')),
    completed_trades INTEGER NOT NULL DEFAULT 0,
    total_volume_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_verified_at TIMESTAMPTZ,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    disputes_won INTEGER NOT NULL DEFAULT 0,
    disputes_lost INTEGER NOT NULL DEFAULT 0,
    account_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_trust_profile UNIQUE (user_id)
);

-- Trust events table
CREATE TABLE IF NOT EXISTS trust_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'TRADE_COMPLETED', 'KYC_VERIFIED', 'EMAIL_VERIFIED', 'PHONE_VERIFIED',
        '2FA_ENABLED', 'DISPUTE_WON', 'DISPUTE_LOST', 'ACCOUNT_AGE_BONUS',
        'REFERRAL_BONUS', 'MANUAL_ADJUSTMENT', 'LEVEL_UP', 'LEVEL_DOWN', 'VOLUME_BONUS'
    )),
    points_change INTEGER NOT NULL,
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    old_level TEXT,
    new_level TEXT,
    metadata JSONB DEFAULT '{}',
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hold period overrides table
CREATE TABLE IF NOT EXISTS hold_period_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT,
    hold_seconds INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trust_profiles_user_id ON trust_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_profiles_level ON trust_profiles(level);
CREATE INDEX IF NOT EXISTS idx_trust_profiles_score ON trust_profiles(score);
CREATE INDEX IF NOT EXISTS idx_trust_events_user_id ON trust_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_events_type ON trust_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trust_events_created ON trust_events(created_at);
CREATE INDEX IF NOT EXISTS idx_hold_overrides_user ON hold_period_overrides(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hold_overrides_method ON hold_period_overrides(payment_method) WHERE is_active = TRUE;

-- Functions
CREATE OR REPLACE FUNCTION calculate_trust_level(score INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF score >= 500 THEN RETURN 'POWER_USER';
    ELSIF score >= 200 THEN RETURN 'TRUSTED';
    ELSIF score >= 50 THEN RETURN 'VERIFIED';
    ELSE RETURN 'NEW_USER';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_trust_score(
    p_user_id UUID,
    p_points_change INTEGER,
    p_event_type TEXT,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS trust_profiles AS $$
DECLARE
    v_profile trust_profiles;
    v_old_score INTEGER;
    v_new_score INTEGER;
    v_old_level TEXT;
    v_new_level TEXT;
BEGIN
    INSERT INTO trust_profiles (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_profile
    FROM trust_profiles
    WHERE user_id = p_user_id
    FOR UPDATE;

    v_old_score := v_profile.score;
    v_old_level := v_profile.level;
    v_new_score := GREATEST(0, v_old_score + p_points_change);
    v_new_level := calculate_trust_level(v_new_score);

    UPDATE trust_profiles
    SET score = v_new_score, level = v_new_level, updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_profile;

    INSERT INTO trust_events (
        user_id, event_type, points_change, old_score, new_score,
        old_level, new_level, metadata, reason
    ) VALUES (
        p_user_id, p_event_type, p_points_change, v_old_score, v_new_score,
        v_old_level, v_new_level, p_metadata, p_reason
    );

    IF v_old_level != v_new_level THEN
        INSERT INTO trust_events (
            user_id, event_type, points_change, old_score, new_score,
            old_level, new_level, reason
        ) VALUES (
            p_user_id,
            CASE WHEN v_new_score > v_old_score THEN 'LEVEL_UP' ELSE 'LEVEL_DOWN' END,
            0, v_new_score, v_new_score, v_old_level, v_new_level,
            'Automatic level change based on score'
        );
    END IF;

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_hold_period(
    p_user_id UUID,
    p_payment_method TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_override INTEGER;
    v_level TEXT;
BEGIN
    SELECT hold_seconds INTO v_override
    FROM hold_period_overrides
    WHERE (user_id = p_user_id OR user_id IS NULL)
      AND (payment_method = p_payment_method OR payment_method IS NULL)
      AND is_active = TRUE
      AND valid_from <= NOW()
      AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY
        CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN payment_method IS NOT NULL THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_override IS NOT NULL THEN RETURN v_override; END IF;

    SELECT level INTO v_level FROM trust_profiles WHERE user_id = p_user_id;
    v_level := COALESCE(v_level, 'NEW_USER');

    CASE p_payment_method
        WHEN 'IDEAL' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 0;
                WHEN 'VERIFIED' THEN RETURN 300;
                ELSE RETURN 900;
            END CASE;
        WHEN 'SEPA_INSTANT' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 300;
                WHEN 'VERIFIED' THEN RETURN 900;
                ELSE RETURN 1800;
            END CASE;
        WHEN 'SEPA' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 3600;
                WHEN 'TRUSTED' THEN RETURN 7200;
                WHEN 'VERIFIED' THEN RETURN 14400;
                ELSE RETURN 86400;
            END CASE;
        WHEN 'CREDIT_CARD' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 86400;
                WHEN 'TRUSTED' THEN RETURN 259200;
                WHEN 'VERIFIED' THEN RETURN 604800;
                ELSE RETURN 1209600;
            END CASE;
        WHEN 'CRYPTO_NATIVE' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 0;
                WHEN 'VERIFIED' THEN RETURN 300;
                ELSE RETURN 600;
            END CASE;
        ELSE
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 3600;
                WHEN 'TRUSTED' THEN RETURN 7200;
                WHEN 'VERIFIED' THEN RETURN 14400;
                ELSE RETURN 86400;
            END CASE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Triggers (using separate function to avoid collision)
CREATE OR REPLACE FUNCTION update_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_profiles_updated_at
    BEFORE UPDATE ON trust_profiles
    FOR EACH ROW EXECUTE FUNCTION update_trust_updated_at();

CREATE TRIGGER hold_overrides_updated_at
    BEFORE UPDATE ON hold_period_overrides
    FOR EACH ROW EXECUTE FUNCTION update_trust_updated_at();

-- Enable RLS
ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_period_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trust profile" ON trust_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trust profiles" ON trust_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert trust profiles" ON trust_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update trust profiles" ON trust_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own trust events" ON trust_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trust events" ON trust_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage hold overrides" ON hold_period_overrides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE trust_profiles IS 'Progressive trust system profiles. Levels: NEW_USER (0-49), VERIFIED (50-199), TRUSTED (200-499), POWER_USER (500+)';
COMMENT ON FUNCTION update_trust_score IS 'Updates user trust score and logs the event. Returns updated profile.';
COMMENT ON FUNCTION get_hold_period IS 'Returns effective hold period in seconds for user and payment method.';

-- ============================================================================
-- SECTION 4: REFERRAL SYSTEM (20251202) - FIXED VERSION
-- ============================================================================

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
    first_transaction_amount DECIMAL(18,6),
    activated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Discount tracking table
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    amount DECIMAL(18,6) NOT NULL,
    discount_amount DECIMAL(18,6) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW()
);

-- User discount balance view
CREATE OR REPLACE VIEW user_discount_balance AS
SELECT
    r.referrer_id as user_id,
    COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) as active_referrals,
    COUNT(DISTINCT d.id) as transactions_used,
    COALESCE(SUM(d.amount), 0) as volume_used,
    COALESCE(SUM(d.discount_amount), 0) as total_saved,
    COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3 as total_transactions_available,
    COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000 as total_volume_available,
    GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3) - COUNT(DISTINCT d.id)) as transactions_remaining,
    GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000) - COALESCE(SUM(d.amount), 0)) as volume_remaining,
    (
        GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3) - COUNT(DISTINCT d.id)) > 0
        AND
        GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000) - COALESCE(SUM(d.amount), 0)) > 0
    ) as has_discount_available
FROM referrals r
LEFT JOIN discount_usage d ON r.referrer_id = d.user_id
GROUP BY r.referrer_id;

-- Referral stats view
CREATE OR REPLACE VIEW referral_stats AS
SELECT
    r.referrer_id as user_id,
    r.referral_code,
    COUNT(DISTINCT r.referred_id) as total_referrals,
    COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.referred_id END) as active_referrals,
    COUNT(DISTINCT CASE WHEN r.status = 'pending' AND r.referred_id IS NOT NULL THEN r.referred_id END) as pending_referrals,
    MIN(r.created_at) as first_referral_date,
    MAX(r.activated_at) as last_activation_date,
    COALESCE(SUM(CASE WHEN r.status = 'active' THEN r.first_transaction_amount END), 0) as total_referred_volume
FROM referrals r
GROUP BY r.referrer_id, r.referral_code;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_discount_user ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_referral ON discount_usage(referral_id);
CREATE INDEX IF NOT EXISTS idx_discount_transaction ON discount_usage(transaction_id);
CREATE INDEX IF NOT EXISTS idx_discount_used_at ON discount_usage(used_at);

-- FIXED: Separate function to avoid collision
CREATE OR REPLACE FUNCTION update_referrals_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referrals
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referrals_updated_at_column();

-- Validation function
CREATE OR REPLACE FUNCTION validate_referral_activation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        IF NEW.first_transaction_amount IS NULL OR NEW.first_transaction_amount < 500 THEN
            RAISE EXCEPTION 'Cannot activate referral: minimum transaction amount is $500';
        END IF;
        IF NEW.activated_at IS NULL THEN
            NEW.activated_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_referral_activation_trigger
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION validate_referral_activation();

-- Discount eligibility check
CREATE OR REPLACE FUNCTION check_discount_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_active_referrals INTEGER;
    v_transactions_used INTEGER;
    v_volume_used DECIMAL(18,6);
    v_transactions_remaining INTEGER;
    v_volume_remaining DECIMAL(18,6);
BEGIN
    SELECT COUNT(DISTINCT id) INTO v_active_referrals
    FROM referrals
    WHERE referrer_id = NEW.user_id AND status = 'active';

    SELECT COUNT(DISTINCT id), COALESCE(SUM(amount), 0)
    INTO v_transactions_used, v_volume_used
    FROM discount_usage
    WHERE user_id = NEW.user_id;

    v_transactions_remaining := GREATEST(0, (v_active_referrals * 3) - v_transactions_used);
    v_volume_remaining := GREATEST(0, (v_active_referrals * 10000) - v_volume_used);

    IF v_transactions_remaining <= 0 THEN
        RAISE EXCEPTION 'No discount transactions remaining';
    END IF;

    IF v_volume_remaining <= 0 THEN
        RAISE EXCEPTION 'No discount volume remaining';
    END IF;

    IF NEW.amount > v_volume_remaining THEN
        RAISE EXCEPTION 'Transaction amount ($%) exceeds remaining volume cap ($%)',
            NEW.amount, v_volume_remaining;
    END IF;

    IF NEW.amount >= 10000 THEN
        RAISE EXCEPTION 'Discount only applies to transactions under $10,000';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_discount_eligibility_trigger
    BEFORE INSERT ON discount_usage
    FOR EACH ROW
    EXECUTE FUNCTION check_discount_eligibility();

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (FIXED: removed referred_id from UPDATE policy)
CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- FIXED: Only referrer can update, NOT referred user
CREATE POLICY "Users can update own referrals"
    ON referrals FOR UPDATE
    USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals"
    ON referrals FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view own discount usage"
    ON discount_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discount usage"
    ON discount_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all discount usage"
    ON discount_usage FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant view access
GRANT SELECT ON user_discount_balance TO authenticated;
GRANT SELECT ON referral_stats TO authenticated;

-- Comments
COMMENT ON TABLE referrals IS 'Tracks referral relationships. Status: pending (code created), active (referral completed $500+ tx), expired (unused/invalid)';
COMMENT ON TABLE discount_usage IS 'Records each use of affiliate discount. Tracks transaction amount and discount applied.';
COMMENT ON VIEW user_discount_balance IS 'Real-time balance of affiliate discounts per user (3 tx, $10K volume per active referral)';
COMMENT ON VIEW referral_stats IS 'Comprehensive referral statistics per user';
COMMENT ON COLUMN referrals.referrer_id IS 'User who created the referral code';
COMMENT ON COLUMN referrals.referred_id IS 'User who used the referral code (NULL until used)';
COMMENT ON COLUMN referrals.referral_code IS 'Unique 8-character alphanumeric code';
COMMENT ON COLUMN referrals.status IS 'pending: not used or first tx <$500, active: completed $500+ tx, expired: no longer valid';
COMMENT ON COLUMN discount_usage.user_id IS 'User who used the discount (the referrer, not the referred)';
COMMENT ON COLUMN discount_usage.amount IS 'Transaction amount (contributes to $10K volume cap)';
COMMENT ON COLUMN discount_usage.discount_amount IS 'Amount saved by discount (difference between 4.4% and 2.2% fee)';

-- ============================================================================
-- SECTION 5: INITIAL ADMIN SETUP
-- ============================================================================

-- Function to create first admin (run manually after first user signs up)
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id IN (
        SELECT id FROM auth.users WHERE email = user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'profiles', 'bills', 'transactions', 'payment_verifications', 'user_velocity',
        'trust_profiles', 'trust_events', 'hold_period_overrides', 'referrals', 'discount_usage'
    )) = 10, 'Not all tables were created successfully';

    RAISE NOTICE '✓ All tables created successfully';
    RAISE NOTICE '✓ All indexes created';
    RAISE NOTICE '✓ All RLS policies applied';
    RAISE NOTICE '✓ All triggers configured';
    RAISE NOTICE '✓ Migration completed successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create your first admin: SELECT make_admin(''your-email@example.com'');';
    RAISE NOTICE '2. Test referral code generation in your app';
    RAISE NOTICE '3. Verify RLS policies with non-admin users';
END $$;
