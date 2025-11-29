-- Payment Verifications Table
-- Stores oracle-verified payment confirmations for audit trail
-- Created: 2025-11-29

-- Create payment_verifications table
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id INTEGER NOT NULL,
    mollie_payment_id TEXT UNIQUE,
    stripe_payment_id TEXT,
    payer_address TEXT NOT NULL,
    maker_address TEXT NOT NULL,
    fiat_amount INTEGER NOT NULL, -- Amount in cents
    fiat_currency TEXT DEFAULT 'EUR',
    payment_reference TEXT,
    payment_method TEXT,
    timestamp INTEGER NOT NULL, -- Unix timestamp for signature
    signature TEXT NOT NULL, -- Oracle signature
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_to_chain BOOLEAN DEFAULT FALSE,
    chain_tx_hash TEXT,
    chain_id INTEGER,
    status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'submitted', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_verifications_bill_id ON public.payment_verifications(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_payer ON public.payment_verifications(payer_address);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON public.payment_verifications(status);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_mollie ON public.payment_verifications(mollie_payment_id);

-- Add columns to bills table for payment verification tracking
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS escrow_bill_id INTEGER,
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mollie_payment_id TEXT,
ADD COLUMN IF NOT EXISTS oracle_signature TEXT,
ADD COLUMN IF NOT EXISTS hold_period_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create index for escrow_bill_id lookups
CREATE INDEX IF NOT EXISTS idx_bills_escrow_bill_id ON public.bills(escrow_bill_id);

-- RLS Policies for payment_verifications
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- Admin can view all verifications
CREATE POLICY "Admins can view all payment verifications"
ON public.payment_verifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Users can view their own verifications
CREATE POLICY "Users can view own payment verifications"
ON public.payment_verifications
FOR SELECT
TO authenticated
USING (
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

-- Service role can insert (for webhook)
CREATE POLICY "Service role can insert verifications"
ON public.payment_verifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can update (for webhook)
CREATE POLICY "Service role can update verifications"
ON public.payment_verifications
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Add wallet_address to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_verifications_updated_at
BEFORE UPDATE ON public.payment_verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create velocity tracking table for anti-fraud
CREATE TABLE IF NOT EXISTS public.user_velocity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    date DATE NOT NULL,
    daily_volume INTEGER DEFAULT 0, -- In cents
    daily_trades INTEGER DEFAULT 0,
    weekly_volume INTEGER DEFAULT 0,
    weekly_trades INTEGER DEFAULT 0,
    trust_level INTEGER DEFAULT 0, -- 0=NEW_USER, 1=TRUSTED, 2=VERIFIED, 3=ELITE
    successful_trades INTEGER DEFAULT 0,
    disputed_trades INTEGER DEFAULT 0,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, date)
);

-- Index for velocity lookups
CREATE INDEX IF NOT EXISTS idx_user_velocity_wallet ON public.user_velocity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_velocity_date ON public.user_velocity(date);

-- RLS for velocity
ALTER TABLE public.user_velocity ENABLE ROW LEVEL SECURITY;

-- Admin can view all velocity data
CREATE POLICY "Admins can view all velocity data"
ON public.user_velocity
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Users can view own velocity
CREATE POLICY "Users can view own velocity"
ON public.user_velocity
FOR SELECT
TO authenticated
USING (
    wallet_address IN (
        SELECT wallet_address FROM public.profiles
        WHERE profiles.id = auth.uid()
    )
);

-- Comments for documentation
COMMENT ON TABLE public.payment_verifications IS 'Stores oracle-verified payment confirmations from Mollie/Stripe webhooks';
COMMENT ON TABLE public.user_velocity IS 'Tracks user trading velocity for fraud prevention';
COMMENT ON COLUMN public.payment_verifications.signature IS 'ECDSA signature from trusted oracle for on-chain verification';
COMMENT ON COLUMN public.payment_verifications.timestamp IS 'Unix timestamp used in signature generation';
COMMENT ON COLUMN public.user_velocity.trust_level IS '0=NEW_USER (0-5 trades), 1=TRUSTED (6-20), 2=VERIFIED (21-50), 3=ELITE (50+)';
