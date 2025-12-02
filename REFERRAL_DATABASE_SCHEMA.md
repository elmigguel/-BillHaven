# Referral Program Database Schema

## Overview
This document outlines the database schema needed to support the BillHaven referral program.

## Required Tables

### 1. Update `profiles` table
Add a `referral_code` column to the existing profiles table:

```sql
-- Add referral_code column to profiles table
ALTER TABLE profiles
ADD COLUMN referral_code VARCHAR(8) UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
```

### 2. Create `referrals` table
Track all referral relationships:

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  first_transaction_amount DECIMAL(15, 2) DEFAULT 0,
  UNIQUE(referrer_id, referred_user_id)
);

-- Create indexes
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

### 3. Create `referral_discounts` table
Track discount usage for each user:

```sql
CREATE TABLE referral_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  transactions_remaining INT DEFAULT 3,
  volume_remaining DECIMAL(15, 2) DEFAULT 10000.00,
  total_saved DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, referral_id)
);

-- Create indexes
CREATE INDEX idx_referral_discounts_user ON referral_discounts(user_id);
CREATE INDEX idx_referral_discounts_referral ON referral_discounts(referral_id);
```

### 4. Create `referral_discount_usage` table
Track individual discount applications:

```sql
CREATE TABLE referral_discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID NOT NULL REFERENCES referral_discounts(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  transaction_amount DECIMAL(15, 2) NOT NULL,
  original_fee DECIMAL(15, 2) NOT NULL,
  discounted_fee DECIMAL(15, 2) NOT NULL,
  savings DECIMAL(15, 2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_discount_usage_discount ON referral_discount_usage(discount_id);
CREATE INDEX idx_discount_usage_bill ON referral_discount_usage(bill_id);
```

## Row Level Security (RLS) Policies

### Profiles
```sql
-- Users can view their own referral code
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own referral code"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Referrals
```sql
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals where they are the referrer
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);
```

### Referral Discounts
```sql
ALTER TABLE referral_discounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own discounts
CREATE POLICY "Users can view own discounts"
  ON referral_discounts FOR SELECT
  USING (auth.uid() = user_id);

-- System can create/update discounts
CREATE POLICY "System can manage discounts"
  ON referral_discounts FOR ALL
  USING (true);
```

### Referral Discount Usage
```sql
ALTER TABLE referral_discount_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON referral_discount_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM referral_discounts
      WHERE id = discount_id AND user_id = auth.uid()
    )
  );
```

## Functions and Triggers

### 1. Function to activate referral when first transaction completes
```sql
CREATE OR REPLACE FUNCTION activate_referral()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_id UUID;
  v_referrer_id UUID;
  v_referred_user_id UUID;
BEGIN
  -- Check if this is the user's first transaction >= $500
  IF NEW.amount >= 500 AND NEW.status = 'completed' THEN
    -- Find pending referral for this user
    SELECT id, referrer_id, referred_user_id
    INTO v_referral_id, v_referrer_id, v_referred_user_id
    FROM referrals
    WHERE referred_user_id = NEW.user_id
      AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      -- Activate the referral
      UPDATE referrals
      SET status = 'active',
          activated_at = NOW(),
          first_transaction_amount = NEW.amount
      WHERE id = v_referral_id;

      -- Create discount records for both users
      INSERT INTO referral_discounts (user_id, referral_id)
      VALUES
        (v_referrer_id, v_referral_id),
        (v_referred_user_id, v_referral_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_referral
AFTER UPDATE ON bills
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION activate_referral();
```

### 2. Function to apply referral discount
```sql
CREATE OR REPLACE FUNCTION apply_referral_discount(
  p_user_id UUID,
  p_bill_id UUID,
  p_transaction_amount DECIMAL,
  p_original_fee DECIMAL
)
RETURNS TABLE (
  discount_applied BOOLEAN,
  discounted_fee DECIMAL,
  savings DECIMAL
) AS $$
DECLARE
  v_discount_id UUID;
  v_transactions_remaining INT;
  v_volume_remaining DECIMAL;
  v_new_fee DECIMAL;
  v_savings DECIMAL;
BEGIN
  -- Find active discount for user
  SELECT id, transactions_remaining, volume_remaining
  INTO v_discount_id, v_transactions_remaining, v_volume_remaining
  FROM referral_discounts
  WHERE user_id = p_user_id
    AND transactions_remaining > 0
    AND volume_remaining >= p_transaction_amount
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no discount available or transaction > $10K, return original fee
  IF NOT FOUND OR p_transaction_amount >= 10000 THEN
    RETURN QUERY SELECT FALSE, p_original_fee, 0::DECIMAL;
    RETURN;
  END IF;

  -- Calculate 50% discount
  v_new_fee := p_original_fee * 0.5;
  v_savings := p_original_fee - v_new_fee;

  -- Record the discount usage
  INSERT INTO referral_discount_usage (
    discount_id, bill_id, transaction_amount,
    original_fee, discounted_fee, savings
  ) VALUES (
    v_discount_id, p_bill_id, p_transaction_amount,
    p_original_fee, v_new_fee, v_savings
  );

  -- Update discount record
  UPDATE referral_discounts
  SET transactions_remaining = transactions_remaining - 1,
      volume_remaining = volume_remaining - p_transaction_amount,
      total_saved = total_saved + v_savings
  WHERE id = v_discount_id;

  RETURN QUERY SELECT TRUE, v_new_fee, v_savings;
END;
$$ LANGUAGE plpgsql;
```

## Installation Steps

1. **Run migrations in order:**
   ```bash
   # 1. Add referral_code to profiles
   psql -f migrations/001_add_referral_code.sql

   # 2. Create referrals table
   psql -f migrations/002_create_referrals.sql

   # 3. Create referral_discounts table
   psql -f migrations/003_create_referral_discounts.sql

   # 4. Create referral_discount_usage table
   psql -f migrations/004_create_referral_discount_usage.sql

   # 5. Create RLS policies
   psql -f migrations/005_create_rls_policies.sql

   # 6. Create functions and triggers
   psql -f migrations/006_create_functions.sql
   ```

2. **Generate initial referral codes for existing users:**
   ```sql
   UPDATE profiles
   SET referral_code = UPPER(
     substring(md5(random()::text) from 1 for 8)
   )
   WHERE referral_code IS NULL;
   ```

## API Integration

### Frontend queries needed:

```javascript
// Get user's referral code
const { data: profile } = await supabase
  .from('profiles')
  .select('referral_code')
  .eq('id', userId)
  .single();

// Get referral stats
const { data: stats } = await supabase
  .rpc('get_referral_stats', { p_user_id: userId });

// Get referral history
const { data: referrals } = await supabase
  .from('referrals')
  .select(`
    *,
    referred_user:referred_user_id (username, email)
  `)
  .eq('referrer_id', userId)
  .order('created_at', { ascending: false });

// Get active discounts
const { data: discounts } = await supabase
  .from('referral_discounts')
  .select('*')
  .eq('user_id', userId)
  .gt('transactions_remaining', 0)
  .gt('volume_remaining', 0);
```

## Notes

- Referral codes are 8 characters, uppercase alphanumeric (excluding confusing chars like O, 0, I, 1)
- Discounts are automatically applied when eligible
- Discounts expire after 3 transactions OR $10K volume (whichever comes first)
- Only transactions under $10K are eligible for the 50% discount
- Referral must be activated with a $500+ transaction
