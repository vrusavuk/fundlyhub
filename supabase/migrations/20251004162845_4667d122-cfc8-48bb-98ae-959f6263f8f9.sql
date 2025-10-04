-- Security Fix: Convert views from SECURITY DEFINER to SECURITY INVOKER
-- This ensures views respect RLS policies and use querying user's permissions

-- Fix 1: Recreate public_profiles view with SECURITY INVOKER
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
FROM public.profiles
WHERE profile_visibility = 'public'
  AND account_status = 'active'
  AND deleted_at IS NULL;

-- Fix 2: Recreate public_fundraiser_stats view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_fundraiser_stats;

CREATE VIEW public.public_fundraiser_stats
WITH (security_invoker=on)
AS
SELECT 
  f.id as fundraiser_id,
  f.title,
  f.goal_amount,
  f.currency,
  f.status,
  f.visibility,
  f.created_at,
  f.end_date,
  COALESCE(SUM(d.amount), 0) as total_raised,
  COUNT(DISTINCT d.donor_user_id) as donor_count
FROM public.fundraisers f
LEFT JOIN public.donations d ON f.id = d.fundraiser_id
GROUP BY f.id, f.title, f.goal_amount, f.currency, f.status, f.visibility, f.created_at, f.end_date;

-- Grant appropriate access to both views
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.public_fundraiser_stats TO authenticated, anon;

-- Add helpful comments
COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles with SECURITY INVOKER enabled to respect RLS policies. Only shows public profiles from active accounts.';
COMMENT ON VIEW public.public_fundraiser_stats IS 'Public view of fundraiser statistics with SECURITY INVOKER enabled to respect RLS policies. Aggregates donation data for campaigns.';