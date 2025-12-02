-- Trust System Migration
-- BillHaven Progressive Trust System
-- Created: 2025-11-30

-- =============================================================================
-- TRUST PROFILES TABLE
-- Stores user trust scores and level progression
-- =============================================================================

CREATE TABLE IF NOT EXISTS trust_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Trust metrics
    score INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'NEW_USER' CHECK (level IN ('NEW_USER', 'VERIFIED', 'TRUSTED', 'POWER_USER')),

    -- Trade statistics
    completed_trades INTEGER NOT NULL DEFAULT 0,
    total_volume_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,

    -- Verification status
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_verified_at TIMESTAMPTZ,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Dispute history
    disputes_won INTEGER NOT NULL DEFAULT 0,
    disputes_lost INTEGER NOT NULL DEFAULT 0,

    -- Account age (for scoring)
    account_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint
    CONSTRAINT unique_user_trust_profile UNIQUE (user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trust_profiles_user_id ON trust_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_profiles_level ON trust_profiles(level);
CREATE INDEX IF NOT EXISTS idx_trust_profiles_score ON trust_profiles(score);

-- =============================================================================
-- TRUST EVENTS TABLE
-- Audit log of all trust score changes
-- =============================================================================

CREATE TABLE IF NOT EXISTS trust_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'TRADE_COMPLETED',
        'KYC_VERIFIED',
        'EMAIL_VERIFIED',
        'PHONE_VERIFIED',
        '2FA_ENABLED',
        'DISPUTE_WON',
        'DISPUTE_LOST',
        'ACCOUNT_AGE_BONUS',
        'REFERRAL_BONUS',
        'MANUAL_ADJUSTMENT',
        'LEVEL_UP',
        'LEVEL_DOWN',
        'VOLUME_BONUS'
    )),

    -- Score change
    points_change INTEGER NOT NULL,
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    old_level TEXT,
    new_level TEXT,

    -- Additional context
    metadata JSONB DEFAULT '{}',
    reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user event history
CREATE INDEX IF NOT EXISTS idx_trust_events_user_id ON trust_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_events_type ON trust_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trust_events_created ON trust_events(created_at);

-- =============================================================================
-- HOLD PERIOD OVERRIDES TABLE
-- Custom hold periods for specific users or payment methods
-- =============================================================================

CREATE TABLE IF NOT EXISTS hold_period_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Override scope (NULL = global default)
    payment_method TEXT,

    -- Override values
    hold_seconds INTEGER NOT NULL,
    reason TEXT NOT NULL,

    -- Admin who created override
    created_by UUID REFERENCES auth.users(id),

    -- Validity period
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active overrides lookup
CREATE INDEX IF NOT EXISTS idx_hold_overrides_user ON hold_period_overrides(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hold_overrides_method ON hold_period_overrides(payment_method) WHERE is_active = TRUE;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to calculate trust level from score
CREATE OR REPLACE FUNCTION calculate_trust_level(score INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF score >= 500 THEN
        RETURN 'POWER_USER';
    ELSIF score >= 200 THEN
        RETURN 'TRUSTED';
    ELSIF score >= 50 THEN
        RETURN 'VERIFIED';
    ELSE
        RETURN 'NEW_USER';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update trust profile and log event
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
    -- Get or create profile
    INSERT INTO trust_profiles (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock and get current profile
    SELECT * INTO v_profile
    FROM trust_profiles
    WHERE user_id = p_user_id
    FOR UPDATE;

    v_old_score := v_profile.score;
    v_old_level := v_profile.level;

    -- Calculate new score (minimum 0)
    v_new_score := GREATEST(0, v_old_score + p_points_change);
    v_new_level := calculate_trust_level(v_new_score);

    -- Update profile
    UPDATE trust_profiles
    SET
        score = v_new_score,
        level = v_new_level,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_profile;

    -- Log the event
    INSERT INTO trust_events (
        user_id,
        event_type,
        points_change,
        old_score,
        new_score,
        old_level,
        new_level,
        metadata,
        reason
    ) VALUES (
        p_user_id,
        p_event_type,
        p_points_change,
        v_old_score,
        v_new_score,
        v_old_level,
        v_new_level,
        p_metadata,
        p_reason
    );

    -- Log level change event if level changed
    IF v_old_level != v_new_level THEN
        INSERT INTO trust_events (
            user_id,
            event_type,
            points_change,
            old_score,
            new_score,
            old_level,
            new_level,
            reason
        ) VALUES (
            p_user_id,
            CASE WHEN v_new_score > v_old_score THEN 'LEVEL_UP' ELSE 'LEVEL_DOWN' END,
            0,
            v_new_score,
            v_new_score,
            v_old_level,
            v_new_level,
            'Automatic level change based on score'
        );
    END IF;

    RETURN v_profile;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective hold period for a user and payment method
CREATE OR REPLACE FUNCTION get_hold_period(
    p_user_id UUID,
    p_payment_method TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_override INTEGER;
    v_level TEXT;
    v_base_hold INTEGER;
BEGIN
    -- Check for active override
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

    IF v_override IS NOT NULL THEN
        RETURN v_override;
    END IF;

    -- Get user's trust level
    SELECT level INTO v_level
    FROM trust_profiles
    WHERE user_id = p_user_id;

    -- Default to NEW_USER if no profile
    v_level := COALESCE(v_level, 'NEW_USER');

    -- Return default hold periods based on payment method and level
    -- These should match the values in trustScoreService.js
    CASE p_payment_method
        WHEN 'IDEAL' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 0;
                WHEN 'VERIFIED' THEN RETURN 300; -- 5 minutes
                ELSE RETURN 900; -- 15 minutes
            END CASE;
        WHEN 'SEPA_INSTANT' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 300;
                WHEN 'VERIFIED' THEN RETURN 900;
                ELSE RETURN 1800; -- 30 minutes
            END CASE;
        WHEN 'SEPA' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 3600; -- 1 hour
                WHEN 'TRUSTED' THEN RETURN 7200;
                WHEN 'VERIFIED' THEN RETURN 14400;
                ELSE RETURN 86400; -- 24 hours
            END CASE;
        WHEN 'CREDIT_CARD' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 86400; -- 1 day
                WHEN 'TRUSTED' THEN RETURN 259200; -- 3 days
                WHEN 'VERIFIED' THEN RETURN 604800; -- 7 days
                ELSE RETURN 1209600; -- 14 days
            END CASE;
        WHEN 'CRYPTO_NATIVE' THEN
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 0;
                WHEN 'TRUSTED' THEN RETURN 0;
                WHEN 'VERIFIED' THEN RETURN 300;
                ELSE RETURN 600; -- 10 minutes
            END CASE;
        ELSE
            -- Default for unknown payment methods
            CASE v_level
                WHEN 'POWER_USER' THEN RETURN 3600;
                WHEN 'TRUSTED' THEN RETURN 7200;
                WHEN 'VERIFIED' THEN RETURN 14400;
                ELSE RETURN 86400;
            END CASE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_profiles_updated_at
    BEFORE UPDATE ON trust_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hold_overrides_updated_at
    BEFORE UPDATE ON hold_period_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_period_overrides ENABLE ROW LEVEL SECURITY;

-- Trust profiles: users can read their own, admins can read all
CREATE POLICY trust_profiles_select_own ON trust_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY trust_profiles_select_admin ON trust_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Trust profiles: only system can insert/update (via functions)
CREATE POLICY trust_profiles_insert_system ON trust_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY trust_profiles_update_admin ON trust_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Trust events: users can read their own history
CREATE POLICY trust_events_select_own ON trust_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY trust_events_select_admin ON trust_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Hold overrides: only admins can manage
CREATE POLICY hold_overrides_admin ON hold_period_overrides
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Add comment explaining the trust level thresholds
COMMENT ON TABLE trust_profiles IS 'Progressive trust system profiles. Levels: NEW_USER (0-49), VERIFIED (50-199), TRUSTED (200-499), POWER_USER (500+)';

COMMENT ON FUNCTION update_trust_score IS 'Updates a user''s trust score and logs the event. Returns the updated profile.';

COMMENT ON FUNCTION get_hold_period IS 'Returns the effective hold period in seconds for a user and payment method, considering overrides and trust level.';
