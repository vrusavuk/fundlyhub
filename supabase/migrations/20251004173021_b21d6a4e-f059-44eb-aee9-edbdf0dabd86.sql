-- Create secure function to get public user profiles
-- This bypasses RLS while only exposing non-sensitive public fields
CREATE OR REPLACE FUNCTION public.get_public_user_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  avatar text,
  bio text,
  location text,
  website text,
  social_links jsonb,
  profile_visibility text,
  role user_role,
  campaign_count integer,
  total_funds_raised numeric,
  follower_count integer,
  following_count integer,
  is_verified boolean,
  verified_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    avatar,
    bio,
    location,
    website,
    social_links,
    profile_visibility,
    role,
    campaign_count,
    total_funds_raised,
    follower_count,
    following_count,
    is_verified,
    verified_at,
    created_at
  FROM public.profiles
  WHERE id = profile_id
    AND profile_visibility = 'public'
    AND account_status = 'active'
    AND deleted_at IS NULL;
$$;

COMMENT ON FUNCTION public.get_public_user_profile IS 
'Returns public profile information for any user. Uses SECURITY DEFINER to bypass RLS while only exposing non-sensitive public fields. Never returns email, account_status, or other PII.';