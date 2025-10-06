-- Phase 1: Private Fundraisers - Add visibility, access control, and type fields

-- 1.1 Extend visibility enum to include 'private'
ALTER TYPE visibility_type ADD VALUE IF NOT EXISTS 'private';

-- 1.2 Add new columns to fundraisers table
ALTER TABLE public.fundraisers
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'personal' 
    CHECK (type IN ('personal','charity')),
  ADD COLUMN IF NOT EXISTS link_token TEXT,
  ADD COLUMN IF NOT EXISTS passcode_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT TRUE;

-- Create index for fast link token lookups
CREATE INDEX IF NOT EXISTS idx_fundraisers_link_token 
  ON public.fundraisers(link_token) WHERE link_token IS NOT NULL;

-- Update is_discoverable based on current visibility
UPDATE public.fundraisers 
SET is_discoverable = (visibility = 'public');

-- 1.3 Create campaign_access_rules table
CREATE TABLE IF NOT EXISTS public.campaign_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allowlist','domain')),
  rule_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_car_campaign ON public.campaign_access_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_car_lookup ON public.campaign_access_rules(campaign_id, rule_type, rule_value);

-- Enable RLS on campaign_access_rules
ALTER TABLE public.campaign_access_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_access_rules
CREATE POLICY "Owners view access rules" ON public.campaign_access_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners manage access rules" ON public.campaign_access_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  );

-- 1.4 Create campaign_invites table
CREATE TABLE IF NOT EXISTS public.campaign_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'invited' 
    CHECK (status IN ('invited','accepted','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_ci_campaign ON public.campaign_invites(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ci_contact ON public.campaign_invites(contact, campaign_id);

-- Enable RLS on campaign_invites
ALTER TABLE public.campaign_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_invites
CREATE POLICY "Owners view invites" ON public.campaign_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owners manage invites" ON public.campaign_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fundraisers f 
      WHERE f.id = campaign_id AND f.owner_user_id = auth.uid()
    )
  );

-- 1.5 Update donations table for tax receipts
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS receipt_type TEXT DEFAULT 'informal' 
    CHECK (receipt_type IN ('informal','charitable_deduction'));

-- 1.6 Helper function for token generation
CREATE OR REPLACE FUNCTION public.gen_base62_token(len int DEFAULT 22)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  out text := '';
  i int := 1;
BEGIN
  WHILE i <= len LOOP
    out := out || substr(chars, 1 + floor(random()*62)::int, 1);
    i := i + 1;
  END LOOP;
  RETURN out;
END; $$;

-- 1.7 Update RLS policy for fundraisers to handle private visibility
-- Drop existing public visibility policy and recreate with private handling
DROP POLICY IF EXISTS "Public fundraisers are viewable by everyone" ON public.fundraisers;

CREATE POLICY "Public/unlisted fundraisers viewable" ON public.fundraisers
  FOR SELECT USING (
    (visibility IN ('public', 'unlisted') AND status = 'active' AND deleted_at IS NULL)
    OR owner_user_id = auth.uid()
  );