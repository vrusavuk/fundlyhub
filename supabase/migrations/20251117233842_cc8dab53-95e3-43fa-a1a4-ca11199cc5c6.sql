-- Add compliance fields to payout_bank_accounts table for progressive KYC
ALTER TABLE public.payout_bank_accounts
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS ssn_last4 TEXT;

-- Add index for compliance data queries
CREATE INDEX IF NOT EXISTS idx_payout_bank_accounts_compliance 
  ON public.payout_bank_accounts(user_id, verification_status) 
  WHERE date_of_birth IS NOT NULL;

COMMENT ON COLUMN public.payout_bank_accounts.date_of_birth IS 'Date of birth for identity verification';
COMMENT ON COLUMN public.payout_bank_accounts.address_line1 IS 'Primary address line for compliance';
COMMENT ON COLUMN public.payout_bank_accounts.city IS 'City for address verification';
COMMENT ON COLUMN public.payout_bank_accounts.state IS 'State/Province for compliance';
COMMENT ON COLUMN public.payout_bank_accounts.postal_code IS 'Postal/ZIP code for address verification';
COMMENT ON COLUMN public.payout_bank_accounts.ssn_last4 IS 'Last 4 digits of SSN for tax compliance (optional)';