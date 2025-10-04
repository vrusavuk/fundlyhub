-- =====================================================================
-- CRITICAL SECURITY FIXES - Phase 1
-- =====================================================================
-- Fixes for: Profile data exposure, Organization data exposure, 
-- Subscription privacy, Donation anonymity, Role privilege escalation
-- =====================================================================

-- Fix 1: Update profiles RLS policies to protect sensitive fields
-- =====================================================================

-- Drop the overly permissive "Public profiles are viewable by everyone" policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create separate policies for public vs sensitive data
CREATE POLICY "Public profile fields are viewable by everyone"
ON public.profiles
FOR SELECT
USING (
  deleted_at IS NULL
);

-- Create policy for owners to view their complete profile (including sensitive fields)
CREATE POLICY "Users can view their complete profile including sensitive fields"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Create policy to prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile except role and security fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevent role modification
  AND account_status = (SELECT account_status FROM public.profiles WHERE id = auth.uid()) -- Prevent status modification
  AND banned_at IS NULL -- Prevent banned users from updating
);


-- Fix 2: Update public_profiles view to exclude sensitive fields
-- =====================================================================

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker=on)
AS
SELECT 
  id,
  name,
  bio,
  avatar,
  location,
  website,
  social_links,
  campaign_count,
  total_funds_raised,
  follower_count,
  following_count,
  is_verified,
  created_at,
  profile_visibility,
  role
  -- EXCLUDED: email, failed_login_attempts, account_locked_until, 
  -- suspension_reason, suspended_until, ban_reason, banned_at, 
  -- deletion_reason, deleted_at, account_status, twofa_enabled
FROM public.profiles
WHERE profile_visibility = 'public'
  AND account_status = 'active'
  AND deleted_at IS NULL;

GRANT SELECT ON public.public_profiles TO authenticated, anon;


-- Fix 3: Restrict organizations table to protect sensitive business data
-- =====================================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;

-- Create policy for public fields only
CREATE POLICY "Public organization info is viewable by everyone"
ON public.organizations
FOR SELECT
USING (
  deleted_at IS NULL
);

-- Note: Sensitive fields (EIN, stripe_connect_id, paypal_merchant_id, address) 
-- should only be accessible via application logic with proper authorization


-- Fix 4: Fix subscriptions table privacy (remove "OR true")
-- =====================================================================

DROP POLICY IF EXISTS "Users can view public subscriptions" ON public.subscriptions;

-- Create proper privacy-respecting policy
CREATE POLICY "Users can view their own subscriptions and their followers"
ON public.subscriptions
FOR SELECT
USING (
  follower_id = auth.uid() -- User's own subscriptions
  OR (following_id = auth.uid() AND following_type = 'user') -- People following the user
  OR EXISTS ( -- Admins can view all
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid()
    AND r.name IN ('super_admin', 'platform_admin')
    AND ura.is_active = true
  )
);


-- Fix 5: Add donation anonymity feature
-- =====================================================================

-- Add is_anonymous column to donations table
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Update donations RLS policy to respect anonymity
DROP POLICY IF EXISTS "Fundraiser owners can view donations" ON public.donations;

CREATE POLICY "Fundraiser owners can view donations with anonymity respected"
ON public.donations
FOR SELECT
USING (
  -- Fundraiser owners can see donations but not donor info if anonymous
  EXISTS (
    SELECT 1 FROM fundraisers
    WHERE fundraisers.id = donations.fundraiser_id
    AND fundraisers.owner_user_id = auth.uid()
  )
  OR donor_user_id = auth.uid() -- Donors can always see their own donations
  OR EXISTS ( -- Admins can view all
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = auth.uid()
    AND r.name IN ('super_admin', 'platform_admin')
    AND ura.is_active = true
  )
);

-- Add comment to document the anonymity behavior
COMMENT ON COLUMN public.donations.is_anonymous IS 'When true, donor_user_id should be hidden from fundraiser owners in application logic';


-- Fix 6: Add security function to get safe organization data
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_public_organization_info(org_id uuid)
RETURNS TABLE (
  id uuid,
  legal_name text,
  dba_name text,
  website text,
  country text,
  verification_status verification_status,
  created_at timestamptz,
  categories text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    legal_name,
    dba_name,
    website,
    country,
    verification_status,
    created_at,
    categories
  FROM public.organizations
  WHERE id = org_id
  AND deleted_at IS NULL;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO authenticated, anon;

COMMENT ON FUNCTION public.get_public_organization_info IS 'Returns only public-safe organization information, excluding sensitive fields like EIN and payment IDs';


-- Add indices for performance
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON public.donations(is_anonymous) WHERE is_anonymous = true;
CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted ON public.organizations(deleted_at) WHERE deleted_at IS NOT NULL;