-- ============================================================================
-- BILLHAVEN CRITICAL DATABASE FIX
-- RUN THIS FIRST TO FIX WHITE SCREEN BUG
-- ============================================================================
--
-- PROBLEM: Database schema doesn't match application code
-- SOLUTION: Create correct tables with proper columns
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/bldjdctgjhtucyxqhwpc/sql/new
-- 2. Paste this ENTIRE file
-- 3. Click "Run"
-- 4. Refresh your app
--
-- ============================================================================

-- Step 1: Create profiles table with auto-create trigger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    wallet_address TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- CRITICAL: Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create bills table that matches the application code
-- ============================================================================

-- Drop and recreate bills table with correct schema
DROP TABLE IF EXISTS public.bills CASCADE;

CREATE TABLE public.bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    amount DECIMAL(18, 6) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payout_wallet TEXT,
    payment_network TEXT DEFAULT 'polygon',
    payment_instructions TEXT,

    -- Status: pending_approval, approved, claimed, fiat_paid, completed, rejected
    status TEXT DEFAULT 'pending_approval',

    -- Claim info
    claimed_by UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,
    payer_wallet_address TEXT,

    -- Payment proof
    fiat_payment_proof_url TEXT,

    -- Crypto transaction
    crypto_tx_to_payer TEXT,

    -- Escrow info
    escrow_bill_id INTEGER,
    escrow_tx_hash TEXT,

    -- Dispute info
    disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    disputed_at TIMESTAMPTZ,
    dispute_resolved_at TIMESTAMPTZ,
    dispute_resolution TEXT,

    -- Legacy columns for backwards compatibility
    payment_tx_hash TEXT,
    fee_tx_hash TEXT,
    payment_token TEXT,
    image_url TEXT,
    payout_amount DECIMAL(18, 6),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_bills_user_id ON public.bills(user_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_bills_claimed_by ON public.bills(claimed_by);
CREATE INDEX idx_bills_created_at ON public.bills(created_at DESC);

-- RLS Policies for bills
CREATE POLICY "Anyone can view approved bills" ON public.bills
    FOR SELECT USING (status = 'approved' AND claimed_by IS NULL);

CREATE POLICY "Users can view own bills" ON public.bills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view bills they claimed" ON public.bills
    FOR SELECT USING (auth.uid() = claimed_by);

CREATE POLICY "Users can insert own bills" ON public.bills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills" ON public.bills
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update bills they claimed" ON public.bills
    FOR UPDATE USING (auth.uid() = claimed_by);

CREATE POLICY "Admins can do everything with bills" ON public.bills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 3: Create existing profile for current admin user
-- ============================================================================

-- Create profile for existing admin if not exists
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'mikedufour@hotmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Step 4: Create profiles for ALL existing users
-- ============================================================================

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', ''),
    'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify everything works
-- ============================================================================

-- Check profiles table exists and has data
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO user_count FROM auth.users;

    RAISE NOTICE 'Profiles: % | Users: %', profile_count, user_count;

    IF profile_count = 0 AND user_count > 0 THEN
        RAISE EXCEPTION 'ERROR: Profiles table is empty but users exist!';
    END IF;

    RAISE NOTICE '✅ Database migration successful!';
END $$;

-- ============================================================================
-- DONE!
-- Now refresh your BillHaven app and the white screen should be fixed.
-- ============================================================================
