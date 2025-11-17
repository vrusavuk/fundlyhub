-- =====================================================
-- PHASE 1: PAYOUT SYSTEM DATABASE SCHEMA
-- =====================================================

-- 1. Create new ENUM types
-- =====================================================

CREATE TYPE kyc_status AS ENUM (
  'not_started',
  'pending',
  'under_review',
  'approved',
  'rejected',
  'requires_info'
);

CREATE TYPE payout_status AS ENUM (
  'pending',
  'under_review',
  'info_required',
  'approved',
  'processing',
  'completed',
  'failed',
  'denied',
  'cancelled'
);

CREATE TYPE payout_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TYPE hold_type AS ENUM (
  'automatic',
  'manual',
  'chargeback_reserve',
  'fraud_investigation',
  'compliance'
);

-- 2. Create payout_bank_accounts table
-- =====================================================

CREATE TABLE payout_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Encrypted bank details (Stripe stores actual data)
  stripe_external_account_id TEXT NOT NULL UNIQUE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT,
  
  -- Masked for display (last 4 digits only)
  account_number_last4 TEXT NOT NULL,
  routing_number_last4 TEXT,
  
  account_type TEXT CHECK (account_type IN ('checking', 'savings')) DEFAULT 'checking',
  currency TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  
  -- Verification status
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed', 'requires_action')) DEFAULT 'pending',
  verification_method TEXT CHECK (verification_method IN ('micro_deposits', 'plaid', 'instant')) DEFAULT 'micro_deposits',
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_attempts INTEGER DEFAULT 0,
  verification_failure_reason TEXT,
  
  -- Security
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create partial unique index for one default per user
CREATE UNIQUE INDEX unique_default_per_user 
  ON payout_bank_accounts(user_id, is_default) 
  WHERE is_default = true AND deleted_at IS NULL;

CREATE INDEX idx_bank_accounts_user_id ON payout_bank_accounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_verification ON payout_bank_accounts(verification_status) WHERE deleted_at IS NULL;

-- 3. Create creator_kyc_verification table
-- =====================================================

CREATE TABLE creator_kyc_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe Identity session
  stripe_verification_session_id TEXT UNIQUE,
  
  -- KYC Status
  status kyc_status NOT NULL DEFAULT 'not_started',
  verification_level TEXT CHECK (verification_level IN ('basic', 'standard', 'enhanced')) DEFAULT 'basic',
  
  -- Personal Information (encrypted at rest)
  legal_first_name TEXT,
  legal_last_name TEXT,
  date_of_birth DATE,
  ssn_last4 TEXT,
  tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein', 'itin')),
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Identity Documents (Stripe handles storage)
  document_type TEXT,
  document_uploaded BOOLEAN DEFAULT false,
  selfie_uploaded BOOLEAN DEFAULT false,
  
  -- Review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  requires_info_details TEXT,
  
  -- Risk Flags
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  risk_factors JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kyc_user_id ON creator_kyc_verification(user_id);
CREATE INDEX idx_kyc_status ON creator_kyc_verification(status);
CREATE INDEX idx_kyc_risk_level ON creator_kyc_verification(risk_level);

-- 4. Create payout_requests table
-- =====================================================

CREATE TABLE payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator information
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES payout_bank_accounts(id),
  
  -- Amount details (stored as strings for precision)
  requested_amount_str TEXT NOT NULL,
  fee_amount_str TEXT NOT NULL DEFAULT '0.00',
  net_amount_str TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status tracking
  status payout_status NOT NULL DEFAULT 'pending',
  priority payout_priority DEFAULT 'normal',
  
  -- Stripe payout tracking
  stripe_payout_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  stripe_failure_code TEXT,
  stripe_failure_message TEXT,
  
  -- Admin workflow
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  denied_by UUID REFERENCES profiles(id),
  denied_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  admin_notes TEXT,
  info_required_message TEXT,
  
  -- Processing
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Risk assessment
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  requires_manual_review BOOLEAN DEFAULT false,
  is_first_payout BOOLEAN DEFAULT false,
  
  -- Campaign breakdown
  campaign_breakdown JSONB,
  
  -- Metadata
  creator_notes TEXT,
  estimated_arrival_date DATE,
  actual_arrival_date DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Event tracking
  correlation_id UUID,
  
  CONSTRAINT valid_amounts CHECK (
    requested_amount_str::numeric > 0 AND
    net_amount_str::numeric > 0
  )
);

CREATE INDEX idx_payout_requests_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
CREATE INDEX idx_payout_requests_fundraiser ON payout_requests(fundraiser_id);
CREATE INDEX idx_payout_requests_created_at ON payout_requests(created_at DESC);
CREATE INDEX idx_payout_requests_risk_score ON payout_requests(risk_score DESC) WHERE requires_manual_review = true;
CREATE INDEX idx_payout_requests_stripe_id ON payout_requests(stripe_payout_id) WHERE stripe_payout_id IS NOT NULL;

-- 5. Create payout_holds table
-- =====================================================

CREATE TABLE payout_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  hold_type hold_type NOT NULL,
  amount_held_str TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  reason TEXT NOT NULL,
  details JSONB,
  
  -- Hold period
  hold_until TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  released_by UUID REFERENCES profiles(id),
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_payout_holds_fundraiser ON payout_holds(fundraiser_id) WHERE is_active = true;
CREATE INDEX idx_payout_holds_user ON payout_holds(user_id) WHERE is_active = true;
CREATE INDEX idx_payout_holds_until ON payout_holds(hold_until) WHERE is_active = true;

-- 6. Create payout_tax_records table
-- =====================================================

CREATE TABLE payout_tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  
  -- Total amounts for the year
  total_payouts_str TEXT NOT NULL DEFAULT '0.00',
  total_fees_str TEXT NOT NULL DEFAULT '0.00',
  payout_count INTEGER DEFAULT 0,
  
  -- 1099-K generation
  requires_1099k BOOLEAN DEFAULT false,
  form_1099k_generated BOOLEAN DEFAULT false,
  form_1099k_sent BOOLEAN DEFAULT false,
  form_1099k_sent_at TIMESTAMP WITH TIME ZONE,
  form_1099k_url TEXT,
  
  -- Tax form data (encrypted)
  tax_name TEXT,
  tax_address JSONB,
  tax_id_last4 TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tax_year)
);

CREATE INDEX idx_tax_records_user ON payout_tax_records(user_id);
CREATE INDEX idx_tax_records_year ON payout_tax_records(tax_year);
CREATE INDEX idx_tax_records_1099k ON payout_tax_records(requires_1099k) WHERE form_1099k_generated = false;

-- 7. Row-Level Security Policies
-- =====================================================

-- payout_bank_accounts RLS
ALTER TABLE payout_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank accounts"
  ON payout_bank_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bank accounts"
  ON payout_bank_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bank accounts"
  ON payout_bank_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all bank accounts"
  ON payout_bank_accounts FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

-- payout_requests RLS
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payout requests"
  ON payout_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    status = 'pending'
  );

CREATE POLICY "Users can cancel own pending requests"
  ON payout_requests FOR UPDATE
  USING (
    user_id = auth.uid() AND
    status IN ('pending', 'info_required')
  )
  WITH CHECK (
    status = 'cancelled' AND
    cancelled_at IS NOT NULL
  );

CREATE POLICY "Admins can view all payout requests"
  ON payout_requests FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

CREATE POLICY "Admins can update payout requests"
  ON payout_requests FOR UPDATE
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

-- creator_kyc_verification RLS
ALTER TABLE creator_kyc_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON creator_kyc_verification FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own KYC"
  ON creator_kyc_verification FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all KYC"
  ON creator_kyc_verification FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

CREATE POLICY "Admins can update KYC status"
  ON creator_kyc_verification FOR UPDATE
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

-- payout_holds RLS
ALTER TABLE payout_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own holds"
  ON payout_holds FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage holds"
  ON payout_holds FOR ALL
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

-- payout_tax_records RLS
ALTER TABLE payout_tax_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax records"
  ON payout_tax_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tax records"
  ON payout_tax_records FOR SELECT
  USING (is_super_admin(auth.uid()) OR user_has_permission(auth.uid(), 'manage_payouts'));

CREATE POLICY "System can manage tax records"
  ON payout_tax_records FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Database Functions
-- =====================================================

-- Calculate available balance for a fundraiser
CREATE OR REPLACE FUNCTION calculate_available_balance(
  _fundraiser_id UUID,
  _user_id UUID
)
RETURNS TABLE (
  total_raised NUMERIC,
  total_fees NUMERIC,
  total_refunds NUMERIC,
  total_holds NUMERIC,
  total_previous_payouts NUMERIC,
  available_balance NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH fundraiser_totals AS (
    SELECT
      COALESCE(SUM(d.amount), 0) as raised,
      COALESCE(SUM(d.fee_amount), 0) as fees,
      COALESCE(SUM(CASE WHEN d.payment_status = 'refunded' THEN d.amount ELSE 0 END), 0) as refunds
    FROM donations d
    WHERE d.fundraiser_id = _fundraiser_id
      AND d.payment_status IN ('paid', 'refunded')
  ),
  hold_totals AS (
    SELECT COALESCE(SUM(amount_held_str::numeric), 0) as holds
    FROM payout_holds
    WHERE fundraiser_id = _fundraiser_id
      AND is_active = true
      AND hold_until > NOW()
  ),
  payout_totals AS (
    SELECT COALESCE(SUM(net_amount_str::numeric), 0) as payouts
    FROM payout_requests
    WHERE fundraiser_id = _fundraiser_id
      AND user_id = _user_id
      AND status IN ('approved', 'processing', 'completed')
  )
  SELECT
    ft.raised,
    ft.fees,
    ft.refunds,
    ht.holds,
    pt.payouts,
    GREATEST(ft.raised - ft.fees - ft.refunds - ht.holds - pt.payouts, 0) as available
  FROM fundraiser_totals ft
  CROSS JOIN hold_totals ht
  CROSS JOIN payout_totals pt;
END;
$$;

-- Calculate risk score for payout request
CREATE OR REPLACE FUNCTION calculate_payout_risk_score(
  _user_id UUID,
  _fundraiser_id UUID,
  _amount NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  risk_score INTEGER := 0;
  account_age_days INTEGER;
  campaign_age_days INTEGER;
  previous_payouts INTEGER;
  total_raised NUMERIC;
  recent_donations INTEGER;
BEGIN
  -- Account age (newer = higher risk)
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  INTO account_age_days
  FROM profiles
  WHERE id = _user_id;
  
  IF account_age_days < 7 THEN risk_score := risk_score + 30;
  ELSIF account_age_days < 30 THEN risk_score := risk_score + 15;
  ELSIF account_age_days < 90 THEN risk_score := risk_score + 5;
  END IF;
  
  -- Campaign age
  IF _fundraiser_id IS NOT NULL THEN
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
    INTO campaign_age_days
    FROM fundraisers
    WHERE id = _fundraiser_id;
    
    IF campaign_age_days < 7 THEN risk_score := risk_score + 20;
    ELSIF campaign_age_days < 30 THEN risk_score := risk_score + 10;
    END IF;
  END IF;
  
  -- First payout ever (high risk)
  SELECT COUNT(*)
  INTO previous_payouts
  FROM payout_requests
  WHERE user_id = _user_id
    AND status = 'completed';
  
  IF previous_payouts = 0 THEN risk_score := risk_score + 25;
  END IF;
  
  -- Large amount relative to total raised
  IF _fundraiser_id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_raised
    FROM donations
    WHERE fundraiser_id = _fundraiser_id
      AND payment_status = 'paid';
    
    IF _amount > (total_raised * 0.8) THEN risk_score := risk_score + 15;
    END IF;
    
    -- Recent donation velocity
    SELECT COUNT(*)
    INTO recent_donations
    FROM donations
    WHERE fundraiser_id = _fundraiser_id
      AND created_at > NOW() - INTERVAL '7 days';
    
    IF recent_donations > 50 THEN risk_score := risk_score + 10;
    END IF;
  END IF;
  
  RETURN LEAST(risk_score, 100);
END;
$$;

-- Update tax records helper function
CREATE OR REPLACE FUNCTION update_tax_records(
  _user_id UUID,
  _payout_amount TEXT,
  _tax_year INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_total NUMERIC;
  new_total NUMERIC;
  current_count INTEGER;
BEGIN
  -- Get current totals
  SELECT 
    total_payouts_str::numeric,
    payout_count
  INTO current_total, current_count
  FROM payout_tax_records
  WHERE user_id = _user_id AND tax_year = _tax_year;
  
  IF current_total IS NULL THEN
    -- Create new record
    INSERT INTO payout_tax_records (
      user_id,
      tax_year,
      total_payouts_str,
      payout_count,
      requires_1099k
    ) VALUES (
      _user_id,
      _tax_year,
      _payout_amount,
      1,
      _payout_amount::numeric > 600
    );
  ELSE
    -- Update existing record
    new_total := current_total + _payout_amount::numeric;
    UPDATE payout_tax_records
    SET 
      total_payouts_str = new_total::text,
      payout_count = current_count + 1,
      requires_1099k = new_total > 600,
      updated_at = NOW()
    WHERE user_id = _user_id AND tax_year = _tax_year;
  END IF;
END;
$$;

-- 9. Add new permission
-- =====================================================

INSERT INTO permissions (name, display_name, description, category)
VALUES ('manage_payouts', 'Manage Payouts', 'Review and process creator payout requests', 'financial')
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.name = 'manage_payouts'
ON CONFLICT DO NOTHING;

-- 10. Update triggers for timestamp management
-- =====================================================

CREATE TRIGGER update_payout_bank_accounts_updated_at
  BEFORE UPDATE ON payout_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_verification_updated_at
  BEFORE UPDATE ON creator_kyc_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_records_updated_at
  BEFORE UPDATE ON payout_tax_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();