-- ============================================
-- CRITICAL SECURITY FIXES
-- ============================================

-- 1. Drop and recreate donations_with_privacy view with correct column order
DROP VIEW IF EXISTS public.donations_with_privacy CASCADE;

CREATE VIEW public.donations_with_privacy 
WITH (security_invoker=true) AS
SELECT 
  d.id,
  d.fundraiser_id,
  d.donor_user_id,
  d.amount,
  d.currency,
  d.tip_amount,
  d.fee_amount,
  d.net_amount,
  d.payment_status,
  d.payment_provider,
  d.receipt_id,
  d.is_anonymous,
  d.created_at,
  -- Show donor info based on anonymity and permissions
  CASE 
    WHEN d.is_anonymous = false OR 
         d.donor_user_id = auth.uid() OR
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.name
    ELSE 'Anonymous'
  END as donor_name,
  CASE 
    WHEN d.is_anonymous = false OR 
         d.donor_user_id = auth.uid() OR
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.avatar
    ELSE NULL
  END as donor_avatar
FROM public.donations d
LEFT JOIN public.public_profiles p ON d.donor_user_id = p.id;

COMMENT ON VIEW public.donations_with_privacy IS 'Donation view with privacy - respects is_anonymous flag and RLS';
GRANT SELECT ON public.donations_with_privacy TO authenticated, anon;

-- 2. Recreate public_profiles view without sensitive fields
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  avatar,
  bio,
  location,
  website,
  social_links,
  is_verified,
  verified_at,
  role,
  profile_visibility,
  created_at,
  follower_count,
  following_count,
  campaign_count,
  total_funds_raised
FROM public.profiles
WHERE account_status = 'active'
  AND banned_at IS NULL
  AND deleted_at IS NULL
  AND profile_visibility = 'public';

COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles - NEVER exposes email, security fields, or PII';
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 3. Create public organization view without sensitive financial data
DROP VIEW IF EXISTS public.public_organizations CASCADE;

CREATE VIEW public.public_organizations
WITH (security_invoker=true) AS
SELECT 
  id,
  legal_name,
  dba_name,
  website,
  country,
  categories,
  verification_status,
  created_at,
  updated_at
FROM public.organizations
WHERE deleted_at IS NULL;

COMMENT ON VIEW public.public_organizations IS 'Public organization info - excludes EIN, payment IDs, and addresses';
GRANT SELECT ON public.public_organizations TO authenticated, anon;

-- 4. Add security comment for beneficiary_contact
COMMENT ON COLUMN public.fundraisers.beneficiary_contact IS 'SENSITIVE: Contains phone/email. Must NEVER be exposed in public queries';

-- 5. Fix donations RLS - require authentication
DROP POLICY IF EXISTS "Anyone can create donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can create donations" ON public.donations;

CREATE POLICY "Authenticated users can create donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (donor_user_id IS NULL OR donor_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM fundraisers
    WHERE id = fundraiser_id
    AND status = 'active'
    AND visibility = 'public'
  )
);

-- 6. Fix audit_logs RLS - only system can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 7. Create secure function for public fundraiser (no beneficiary_contact)
CREATE OR REPLACE FUNCTION public.get_public_fundraiser(fundraiser_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  summary text,
  story_html text,
  cover_image text,
  goal_amount numeric,
  currency text,
  status fundraiser_status,
  visibility visibility_type,
  category_id uuid,
  owner_user_id uuid,
  org_id uuid,
  beneficiary_name text,
  location text,
  created_at timestamptz,
  updated_at timestamptz,
  end_date date,
  tags text[],
  images text[],
  video_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, title, slug, summary, story_html, cover_image,
    goal_amount, currency, status, visibility, category_id,
    owner_user_id, org_id, beneficiary_name, location,
    created_at, updated_at, end_date, tags, images, video_url
  FROM fundraisers
  WHERE slug = fundraiser_slug
    AND visibility = 'public'
    AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.get_public_fundraiser IS 'Returns public fundraiser WITHOUT beneficiary_contact';
GRANT EXECUTE ON FUNCTION public.get_public_fundraiser TO authenticated, anon;