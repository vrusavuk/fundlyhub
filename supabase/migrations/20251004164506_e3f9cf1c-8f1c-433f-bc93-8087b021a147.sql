-- ============================================
-- COMPREHENSIVE SECURITY FIXES V2
-- Properly handling existing policies
-- ============================================

-- ============================================
-- FIX 1: SECURE PROFILES TABLE
-- ============================================

-- Add security comment to role column
COMMENT ON COLUMN profiles.role IS 'Display role only - DO NOT use for authorization. Use user_role_assignments table and RBAC functions (user_has_permission, has_role) for all permission checks.';

-- Create function for users to view their own complete profile securely
CREATE OR REPLACE FUNCTION public.get_my_complete_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_complete_profile() TO authenticated;

-- Drop ALL existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "Public profile fields are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their complete profile including sensitive field" ON profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON profiles;

-- Create single restrictive policy for viewing profiles
CREATE POLICY "Users can only view their own profile via function"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- ============================================
-- FIX 2: SECURE ORGANIZATIONS TABLE
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public organization info is viewable by everyone" ON organizations;
DROP POLICY IF EXISTS "Only members can view full organization details" ON organizations;

-- Create policy: Only members can view full organization details
CREATE POLICY "Members and admins can view full org details"
ON organizations FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members WHERE org_id = organizations.id
  )
  OR 
  is_super_admin(auth.uid())
);

-- Grant execute permission on the public organization info function
GRANT EXECUTE ON FUNCTION public.get_public_organization_info(uuid) TO authenticated, anon;

-- ============================================
-- FIX 3: IMPLEMENT DONATION PRIVACY
-- ============================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.donations_with_privacy CASCADE;

-- Create privacy-respecting view for donations
CREATE VIEW public.donations_with_privacy AS
SELECT 
  d.id,
  d.fundraiser_id,
  d.amount,
  d.currency,
  d.tip_amount,
  d.fee_amount,
  d.net_amount,
  d.created_at,
  d.payment_status,
  d.receipt_id,
  d.payment_provider,
  d.is_anonymous,
  -- Only show donor info if NOT anonymous OR viewing own donation OR fundraiser owner OR admin
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN d.donor_user_id 
    ELSE NULL 
  END as donor_user_id,
  -- Only show donor name when allowed
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.name
    ELSE 'Anonymous'
  END as donor_name,
  -- Only show donor avatar when allowed
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.avatar
    ELSE NULL
  END as donor_avatar
FROM public.donations d
LEFT JOIN public.public_profiles p ON d.donor_user_id = p.id;

-- Grant access to the privacy-respecting donations view
GRANT SELECT ON public.donations_with_privacy TO authenticated, anon;

-- ============================================
-- FIX 4: SECURE VIEWS WITH EXPLICIT PERMISSIONS
-- ============================================

-- Explicitly grant SELECT on public_profiles view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Explicitly grant SELECT on public_fundraiser_stats view
GRANT SELECT ON public.public_fundraiser_stats TO authenticated, anon;

-- ============================================
-- FIX 5: ADD SECURITY INDICES FOR PERFORMANCE
-- ============================================

-- Add index for faster donor privacy checks
CREATE INDEX IF NOT EXISTS idx_donations_anonymous ON donations(is_anonymous) WHERE is_anonymous = true;

-- Add index for organization member lookups
CREATE INDEX IF NOT EXISTS idx_org_members_lookup ON org_members(org_id, user_id);

-- ============================================
-- FIX 6: AUDIT LOGGING FOR SENSITIVE OPERATIONS
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_log_sensitive_profile_changes ON profiles;

-- Create function to log sensitive profile field changes
CREATE OR REPLACE FUNCTION log_sensitive_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role OR NEW.account_status != OLD.account_status THEN
    PERFORM log_audit_event(
      auth.uid(),
      'profile_security_field_modified',
      'profile',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'old_status', OLD.account_status,
        'new_status', NEW.account_status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for logging sensitive changes
CREATE TRIGGER trigger_log_sensitive_profile_changes
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.account_status IS DISTINCT FROM NEW.account_status)
EXECUTE FUNCTION log_sensitive_profile_access();