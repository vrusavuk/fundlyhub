-- Create a public view for subscriptions that respects privacy settings
-- This allows public viewing of followers/following while protecting private profiles

CREATE OR REPLACE VIEW public.public_subscriptions AS
SELECT 
  s.id,
  s.follower_id,
  s.following_id,
  s.following_type,
  s.created_at,
  -- Follower profile info (always a user)
  fp.name as follower_name,
  fp.avatar as follower_avatar,
  fp.role as follower_role,
  fp.follower_count as follower_follower_count,
  fp.campaign_count as follower_campaign_count,
  fp.profile_visibility as follower_visibility,
  -- Following user profile info (if following_type = 'user')
  up.name as following_user_name,
  up.avatar as following_user_avatar,
  up.role as following_user_role,
  up.follower_count as following_user_follower_count,
  up.campaign_count as following_user_campaign_count,
  up.profile_visibility as following_user_visibility,
  -- Following organization info (if following_type = 'organization')
  o.legal_name as following_org_legal_name,
  o.dba_name as following_org_dba_name,
  o.verification_status as following_org_verification_status
FROM subscriptions s
-- Join follower profile (always required)
INNER JOIN profiles fp ON s.follower_id = fp.id
-- Left join following user profile (only when following_type = 'user')
LEFT JOIN profiles up ON s.following_id = up.id AND s.following_type = 'user'
-- Left join following organization (only when following_type = 'organization')
LEFT JOIN organizations o ON s.following_id = o.id AND s.following_type = 'organization'
WHERE 
  -- Filter out deleted/banned accounts
  fp.account_status = 'active'
  AND fp.deleted_at IS NULL
  AND (up.id IS NULL OR (up.account_status = 'active' AND up.deleted_at IS NULL))
  AND (o.id IS NULL OR o.deleted_at IS NULL);

-- Enable RLS on the view
ALTER VIEW public.public_subscriptions SET (security_invoker = on);

-- Create RLS policies for public_subscriptions view
-- Note: Views with security_invoker need policies on the underlying tables
-- But we'll create a security definer function to query this view safely

CREATE OR REPLACE FUNCTION public.get_public_followers(
  target_user_id uuid,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar text,
  role text,
  follower_count integer,
  campaign_count integer,
  type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.follower_id as id,
    ps.follower_name as name,
    ps.follower_avatar as avatar,
    ps.follower_role::text as role,
    ps.follower_follower_count as follower_count,
    ps.follower_campaign_count as campaign_count,
    'user'::text as type
  FROM public_subscriptions ps
  WHERE ps.following_id = target_user_id
    AND ps.following_type = 'user'
    -- Show if follower profile is public OR current user is involved
    AND (
      ps.follower_visibility = 'public'
      OR ps.follower_id = auth.uid()
      OR ps.following_id = auth.uid()
    )
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_following(
  target_user_id uuid,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  avatar text,
  role text,
  follower_count integer,
  campaign_count integer,
  type text,
  legal_name text,
  dba_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Users being followed
  SELECT 
    ps.following_id as id,
    ps.following_user_name as name,
    ps.following_user_avatar as avatar,
    ps.following_user_role::text as role,
    ps.following_user_follower_count as follower_count,
    ps.following_user_campaign_count as campaign_count,
    'user'::text as type,
    NULL::text as legal_name,
    NULL::text as dba_name
  FROM public_subscriptions ps
  WHERE ps.follower_id = target_user_id
    AND ps.following_type = 'user'
    -- Show if following profile is public OR current user is involved
    AND (
      ps.following_user_visibility = 'public'
      OR ps.follower_id = auth.uid()
      OR ps.following_id = auth.uid()
    )
  
  UNION ALL
  
  -- Organizations being followed
  SELECT 
    ps.following_id as id,
    COALESCE(ps.following_org_dba_name, ps.following_org_legal_name) as name,
    NULL::text as avatar,
    ps.following_org_verification_status::text as role,
    0 as follower_count,
    0 as campaign_count,
    'organization'::text as type,
    ps.following_org_legal_name as legal_name,
    ps.following_org_dba_name as dba_name
  FROM public_subscriptions ps
  WHERE ps.follower_id = target_user_id
    AND ps.following_type = 'organization'
  
  LIMIT limit_count;
END;
$$;