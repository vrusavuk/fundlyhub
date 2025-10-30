-- Add donor information fields to donations table for Stripe integration
-- These fields store donor details from Stripe metadata for anonymous donations

ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT;

-- Add index for email lookups (useful for receipt sending)
CREATE INDEX IF NOT EXISTS idx_donations_donor_email 
  ON public.donations(donor_email) 
  WHERE donor_email IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.donations.donor_name IS 
  'Donor name from Stripe metadata (for anonymous donations without user accounts)';
COMMENT ON COLUMN public.donations.donor_email IS 
  'Donor email from Stripe metadata (for receipts and anonymous donations)';
COMMENT ON COLUMN public.donations.message IS 
  'Optional donation message from donor';