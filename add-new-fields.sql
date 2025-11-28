-- BillHaven V2 Database Updates
-- Kopieer ALLES hieronder en plak in Supabase SQL Editor

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS payment_instructions TEXT,
ADD COLUMN IF NOT EXISTS fiat_payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS crypto_tx_to_payer TEXT;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS disputed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispute_resolution TEXT;

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS escrow_bill_id INTEGER,
ADD COLUMN IF NOT EXISTS escrow_tx_hash TEXT;

ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_status_check;

ALTER TABLE bills ADD CONSTRAINT bills_status_check
CHECK (status IN ('draft', 'pending_approval', 'approved', 'claimed', 'fiat_paid', 'completed', 'rejected', 'paid'));
