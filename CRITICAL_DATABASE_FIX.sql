-- ============================================
-- BILLHAVEN CRITICAL DATABASE FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- Date: 2025-12-06
-- ============================================

-- ============================================
-- PART 1: MISSING TABLES (11 tables)
-- ============================================

-- 1. User Reputation System
CREATE TABLE IF NOT EXISTS user_reputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  trust_score INTEGER DEFAULT 50,
  total_trades INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  failed_trades INTEGER DEFAULT 0,
  total_volume DECIMAL(20,2) DEFAULT 0,
  positive_reviews INTEGER DEFAULT 0,
  negative_reviews INTEGER DEFAULT 0,
  neutral_reviews INTEGER DEFAULT 0,
  disputes_initiated INTEGER DEFAULT 0,
  disputes_won INTEGER DEFAULT 0,
  disputes_lost INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  verification_badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Reviews
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID,
  rating TEXT CHECK (rating IN ('positive', 'neutral', 'negative')),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Quests
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  quest_type TEXT CHECK (quest_type IN ('daily', 'weekly', 'achievement')),
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges JSONB DEFAULT '[]'::jsonb,
  milestones_claimed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Chat Rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL,
  submitter_id UUID REFERENCES auth.users(id),
  payer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'image', 'payment_proof', 'dispute')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Message Reports
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 8. Invoice Factoring Listings
CREATE TABLE IF NOT EXISTS invoice_factoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  original_amount DECIMAL(20,2) NOT NULL,
  asking_amount DECIMAL(20,2) NOT NULL,
  discount_percent DECIMAL(5,2),
  currency TEXT DEFAULT 'USD',
  crypto_type TEXT NOT NULL,
  due_date DATE,
  bill_details JSONB,
  document_url TEXT,
  platform_fee_percent DECIMAL(5,2) DEFAULT 2.5,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending_payment', 'completed', 'cancelled', 'expired')),
  transaction_hash TEXT,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Factoring Documents
CREATE TABLE IF NOT EXISTS factoring_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES invoice_factoring(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  documents JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Premium Subscriptions
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'silver', 'gold', 'platinum')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  payment_method TEXT,
  transaction_hash TEXT,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Extend referrals table with additional columns
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 40,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_used DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_transaction_amount DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add referral_code column to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 12. Discount Usage (referral discounts used)
CREATE TABLE IF NOT EXISTS discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID,
  bill_id UUID,
  discount_amount DECIMAL(20,2) NOT NULL,
  original_fee DECIMAL(20,2),
  final_fee DECIMAL(20,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Referral Earnings (commission tracking)
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id),
  bill_id UUID,
  tier INTEGER DEFAULT 1,
  commission_rate DECIMAL(5,2),
  platform_fee DECIMAL(20,2),
  commission_amount DECIMAL(20,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Dispute Evidence (for chat disputes)
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID,
  room_id UUID REFERENCES chat_rooms(id),
  submitter_id UUID REFERENCES auth.users(id),
  evidence_type TEXT CHECK (evidence_type IN ('screenshot', 'document', 'message_archive', 'other')),
  file_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. User Trust Profiles (advanced trust scoring)
CREATE TABLE IF NOT EXISTS user_trust_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  trust_level TEXT DEFAULT 'new' CHECK (trust_level IN ('new', 'basic', 'verified', 'trusted', 'elite')),
  verification_status JSONB DEFAULT '{}'::jsonb,
  risk_score INTEGER DEFAULT 50,
  trade_limits JSONB DEFAULT '{"daily": 1000, "weekly": 5000, "monthly": 20000}'::jsonb,
  kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Admin Audit Log (for admin actions)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: RPC FUNCTIONS (6 functions)
-- ============================================

-- 1. Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add XP to user
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_streaks (user_id, total_xp, current_streak, last_activity_date)
  VALUES (p_user_id, p_xp, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_streaks.total_xp + p_xp,
    last_activity_date = CURRENT_DATE,
    current_streak = CASE
      WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(user_streaks.longest_streak,
      CASE
        WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
        ELSE user_streaks.current_streak
      END
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 3. Add badge to user
CREATE OR REPLACE FUNCTION add_user_badge(p_user_id UUID, p_badge TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_streaks (user_id, badges, current_streak, last_activity_date)
  VALUES (p_user_id, jsonb_build_array(p_badge), 0, NULL)
  ON CONFLICT (user_id)
  DO UPDATE SET
    badges = CASE
      WHEN NOT user_streaks.badges ? p_badge
      THEN user_streaks.badges || jsonb_build_array(p_badge)
      ELSE user_streaks.badges
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Increment reputation field
CREATE OR REPLACE FUNCTION increment_reputation_field(p_user_id UUID, p_field TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_reputations (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format(
    'UPDATE user_reputations SET %I = %I + 1, updated_at = NOW() WHERE user_id = $1',
    p_field, p_field
  ) USING p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Increment referral balance
CREATE OR REPLACE FUNCTION increment_referral_balance(p_referrer_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE referrals
  SET discount_amount = discount_amount + p_amount,
      updated_at = NOW()
  WHERE referrer_id = p_referrer_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Get user XP rank
CREATE OR REPLACE FUNCTION get_user_xp_rank(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO user_rank
  FROM user_streaks
  WHERE total_xp > (
    SELECT COALESCE(total_xp, 0)
    FROM user_streaks
    WHERE user_id = target_user_id
  );
  RETURN COALESCE(user_rank, 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_reputations_user_id ON user_reputations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputations_trust_score ON user_reputations(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed_id ON user_reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_total_xp ON user_streaks(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_bill_id ON chat_rooms(bill_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_invoice_factoring_seller_id ON invoice_factoring(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoice_factoring_status ON invoice_factoring(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_bill_id ON dispute_evidence(bill_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_profiles_user_id ON user_trust_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);

-- ============================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_reputations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_factoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE factoring_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "user_reputations_select" ON user_reputations;
CREATE POLICY "user_reputations_select" ON user_reputations FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_reputations_insert" ON user_reputations;
CREATE POLICY "user_reputations_insert" ON user_reputations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_reputations_update" ON user_reputations;
CREATE POLICY "user_reputations_update" ON user_reputations FOR UPDATE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "user_reviews_select" ON user_reviews;
CREATE POLICY "user_reviews_select" ON user_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_reviews_insert" ON user_reviews;
CREATE POLICY "user_reviews_insert" ON user_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "user_quests_all" ON user_quests;
CREATE POLICY "user_quests_all" ON user_quests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_streaks_select" ON user_streaks;
CREATE POLICY "user_streaks_select" ON user_streaks FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_streaks_insert" ON user_streaks;
CREATE POLICY "user_streaks_insert" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_streaks_update" ON user_streaks;
CREATE POLICY "user_streaks_update" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (auth.uid() = submitter_id OR auth.uid() = payer_id OR is_admin());
DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = submitter_id OR auth.uid() = payer_id);

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_rooms WHERE id = chat_messages.room_id AND (submitter_id = auth.uid() OR payer_id = auth.uid())) OR is_admin()
);
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "message_reports_insert" ON message_reports;
CREATE POLICY "message_reports_insert" ON message_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "message_reports_admin" ON message_reports;
CREATE POLICY "message_reports_admin" ON message_reports FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "invoice_factoring_select" ON invoice_factoring;
CREATE POLICY "invoice_factoring_select" ON invoice_factoring FOR SELECT USING (status = 'available' OR auth.uid() = seller_id OR auth.uid() = buyer_id OR is_admin());
DROP POLICY IF EXISTS "invoice_factoring_insert" ON invoice_factoring;
CREATE POLICY "invoice_factoring_insert" ON invoice_factoring FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "invoice_factoring_update" ON invoice_factoring;
CREATE POLICY "invoice_factoring_update" ON invoice_factoring FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR is_admin());

DROP POLICY IF EXISTS "factoring_documents_select" ON factoring_documents;
CREATE POLICY "factoring_documents_select" ON factoring_documents FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR is_admin());

DROP POLICY IF EXISTS "premium_subscriptions_all" ON premium_subscriptions;
CREATE POLICY "premium_subscriptions_all" ON premium_subscriptions FOR ALL USING (auth.uid() = user_id OR is_admin());

-- RLS for new tables
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_usage_all" ON discount_usage;
CREATE POLICY "discount_usage_all" ON discount_usage FOR ALL USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "referral_earnings_select" ON referral_earnings;
CREATE POLICY "referral_earnings_select" ON referral_earnings FOR SELECT USING (auth.uid() = referrer_id OR is_admin());

DROP POLICY IF EXISTS "dispute_evidence_select" ON dispute_evidence;
CREATE POLICY "dispute_evidence_select" ON dispute_evidence FOR SELECT USING (auth.uid() = submitter_id OR is_admin());
DROP POLICY IF EXISTS "dispute_evidence_insert" ON dispute_evidence;
CREATE POLICY "dispute_evidence_insert" ON dispute_evidence FOR INSERT WITH CHECK (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "user_trust_profiles_select" ON user_trust_profiles;
CREATE POLICY "user_trust_profiles_select" ON user_trust_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_trust_profiles_update" ON user_trust_profiles;
CREATE POLICY "user_trust_profiles_update" ON user_trust_profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "admin_audit_log_admin" ON admin_audit_log;
CREATE POLICY "admin_audit_log_admin" ON admin_audit_log FOR ALL USING (is_admin());

-- ============================================
-- DONE! Verify with:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
-- ============================================
