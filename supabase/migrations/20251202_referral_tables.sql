-- BillHaven Referral System Tables
-- Created: 2025-12-02
--
-- AFFILIATE DISCOUNT RULES:
-- - Per successful referral: 3 discounted transactions
-- - Volume cap: $10,000 MAX TOTAL across those 3 transactions
-- - Discount: 50% off ONLY on <$10K tier (4.4% → 2.2%)
-- - Minimum referral: Friend must complete >$500 transaction to activate

-- Referrals table
-- Tracks referral relationships between users
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
-- Records each use of an affiliate discount
CREATE TABLE IF NOT EXISTS discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  transaction_id UUID,
  amount DECIMAL(18,6) NOT NULL,
  discount_amount DECIMAL(18,6) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

-- User discount balance view
-- Provides real-time balance of available discounts per user
CREATE OR REPLACE VIEW user_discount_balance AS
SELECT
  r.referrer_id as user_id,
  COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) as active_referrals,
  COUNT(DISTINCT d.id) as transactions_used,
  COALESCE(SUM(d.amount), 0) as volume_used,
  COALESCE(SUM(d.discount_amount), 0) as total_saved,
  -- Calculate totals available (3 transactions and $10K per active referral)
  COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3 as total_transactions_available,
  COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000 as total_volume_available,
  -- Calculate remaining balances
  GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3) - COUNT(DISTINCT d.id)) as transactions_remaining,
  GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000) - COALESCE(SUM(d.amount), 0)) as volume_remaining,
  -- Check if user has any discount available
  (
    GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 3) - COUNT(DISTINCT d.id)) > 0
    AND
    GREATEST(0, (COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) * 10000) - COALESCE(SUM(d.amount), 0)) > 0
  ) as has_discount_available
FROM referrals r
LEFT JOIN discount_usage d ON r.referrer_id = d.user_id
GROUP BY r.referrer_id;

-- Referral stats view
-- Provides comprehensive referral statistics per user
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

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_discount_user ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_referral ON discount_usage(referral_id);
CREATE INDEX IF NOT EXISTS idx_discount_transaction ON discount_usage(transaction_id);
CREATE INDEX IF NOT EXISTS idx_discount_used_at ON discount_usage(used_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on referrals table
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate referral activation
CREATE OR REPLACE FUNCTION validate_referral_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate when status changes to 'active'
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Check if first_transaction_amount is set and >= $500
    IF NEW.first_transaction_amount IS NULL OR NEW.first_transaction_amount < 500 THEN
      RAISE EXCEPTION 'Cannot activate referral: minimum transaction amount is $500';
    END IF;

    -- Set activated_at if not already set
    IF NEW.activated_at IS NULL THEN
      NEW.activated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate referral activation
CREATE TRIGGER validate_referral_activation_trigger
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION validate_referral_activation();

-- Function to check discount eligibility before recording usage
CREATE OR REPLACE FUNCTION check_discount_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_active_referrals INTEGER;
  v_transactions_used INTEGER;
  v_volume_used DECIMAL(18,6);
  v_transactions_remaining INTEGER;
  v_volume_remaining DECIMAL(18,6);
BEGIN
  -- Get active referrals count
  SELECT COUNT(DISTINCT id) INTO v_active_referrals
  FROM referrals
  WHERE referrer_id = NEW.user_id AND status = 'active';

  -- Get current usage
  SELECT
    COUNT(DISTINCT id),
    COALESCE(SUM(amount), 0)
  INTO v_transactions_used, v_volume_used
  FROM discount_usage
  WHERE user_id = NEW.user_id;

  -- Calculate remaining balances
  v_transactions_remaining := GREATEST(0, (v_active_referrals * 3) - v_transactions_used);
  v_volume_remaining := GREATEST(0, (v_active_referrals * 10000) - v_volume_used);

  -- Check if user has discounts available
  IF v_transactions_remaining <= 0 THEN
    RAISE EXCEPTION 'No discount transactions remaining';
  END IF;

  IF v_volume_remaining <= 0 THEN
    RAISE EXCEPTION 'No discount volume remaining';
  END IF;

  -- Check if transaction amount exceeds remaining volume
  IF NEW.amount > v_volume_remaining THEN
    RAISE EXCEPTION 'Transaction amount ($%) exceeds remaining volume cap ($%)',
      NEW.amount, v_volume_remaining;
  END IF;

  -- Check if transaction is in eligible tier (<$10K)
  IF NEW.amount >= 10000 THEN
    RAISE EXCEPTION 'Discount only applies to transactions under $10,000';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check discount eligibility before insert
CREATE TRIGGER check_discount_eligibility_trigger
  BEFORE INSERT ON discount_usage
  FOR EACH ROW
  EXECUTE FUNCTION check_discount_eligibility();

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

-- Referrals policies
-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can create referrals as referrer
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Users can update their own referrals
CREATE POLICY "Users can update own referrals"
  ON referrals FOR UPDATE
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Discount usage policies
-- Users can view their own discount usage
CREATE POLICY "Users can view own discount usage"
  ON discount_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own discount usage
CREATE POLICY "Users can insert own discount usage"
  ON discount_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant access to views for authenticated users
GRANT SELECT ON user_discount_balance TO authenticated;
GRANT SELECT ON referral_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE referrals IS 'Tracks referral relationships between users. Status: pending (code created), active (referral completed $500+ transaction), expired (unused/invalid)';
COMMENT ON TABLE discount_usage IS 'Records each use of an affiliate discount. Tracks transaction amount and discount applied.';
COMMENT ON VIEW user_discount_balance IS 'Real-time balance of available affiliate discounts per user (3 transactions, $10K volume per active referral)';
COMMENT ON VIEW referral_stats IS 'Comprehensive referral statistics per user including total/active/pending referrals and volume';

COMMENT ON COLUMN referrals.referrer_id IS 'User who created the referral code';
COMMENT ON COLUMN referrals.referred_id IS 'User who used the referral code (NULL until code is used)';
COMMENT ON COLUMN referrals.referral_code IS 'Unique 8-character alphanumeric code';
COMMENT ON COLUMN referrals.status IS 'pending: code not yet used or first transaction <$500, active: referral completed $500+ transaction, expired: code no longer valid';
COMMENT ON COLUMN referrals.first_transaction_amount IS 'Amount of referred user first transaction (must be >$500 to activate)';
COMMENT ON COLUMN referrals.activated_at IS 'Timestamp when referral became active (first $500+ transaction)';

COMMENT ON COLUMN discount_usage.user_id IS 'User who used the discount (the referrer, not the referred)';
COMMENT ON COLUMN discount_usage.referral_id IS 'Reference to the referral that granted this discount';
COMMENT ON COLUMN discount_usage.transaction_id IS 'ID of the transaction where discount was applied';
COMMENT ON COLUMN discount_usage.amount IS 'Transaction amount (contributes to $10K volume cap)';
COMMENT ON COLUMN discount_usage.discount_amount IS 'Amount saved by the discount (difference between 4.4% and 2.2% fee)';
