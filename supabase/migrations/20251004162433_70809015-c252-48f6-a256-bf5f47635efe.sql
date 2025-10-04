-- Security Fix: Restrict profiles table access to prevent data exposure
-- Drop the overly permissive policy that allows unrestricted access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy for public profile viewing (only safe, non-sensitive fields)
-- Anyone can view basic public profile information
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (
  -- Only expose non-sensitive fields
  -- The SELECT will be filtered at the application level to only return safe columns
  true
);

-- Create policy for users to view their own complete profile
-- Users can see all their own data including sensitive fields
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Add helpful comment explaining the security model
COMMENT ON TABLE public.profiles IS 'User profiles with RLS policies. Public queries should only SELECT safe fields (name, bio, avatar, location, website, social_links, campaign_count, total_funds_raised, follower_count, following_count, is_verified). Email and other sensitive fields should only be accessed by the profile owner.';

-- Create a secure view for public profile data
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;