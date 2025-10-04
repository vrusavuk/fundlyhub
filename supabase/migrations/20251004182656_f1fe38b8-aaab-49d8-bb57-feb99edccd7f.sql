-- Create optimized RPC function for user profile stats
CREATE OR REPLACE FUNCTION public.get_user_profile_stats(target_user_id UUID)
RETURNS TABLE(
  follower_count INTEGER,
  following_count INTEGER,
  campaign_count INTEGER,
  total_funds_raised NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Count followers (people/orgs following this user)
    (SELECT COUNT(*)::INTEGER 
     FROM subscriptions 
     WHERE following_id = target_user_id 
     AND following_type = 'user') as follower_count,
    
    -- Count following (users/orgs this user follows)
    (SELECT COUNT(*)::INTEGER 
     FROM subscriptions 
     WHERE follower_id = target_user_id) as following_count,
    
    -- Count active campaigns
    (SELECT COUNT(*)::INTEGER 
     FROM fundraisers 
     WHERE owner_user_id = target_user_id 
     AND status = 'active' 
     AND deleted_at IS NULL) as campaign_count,
    
    -- Sum total funds raised across all campaigns
    (SELECT COALESCE(SUM(pfs.total_raised), 0)::NUMERIC
     FROM fundraisers f
     JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
     WHERE f.owner_user_id = target_user_id
     AND f.deleted_at IS NULL) as total_funds_raised;
END;
$$;

-- Create optimized RPC function for organization profile stats
CREATE OR REPLACE FUNCTION public.get_organization_profile_stats(target_org_id UUID)
RETURNS TABLE(
  follower_count INTEGER,
  campaign_count INTEGER,
  total_funds_raised NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Count followers (people following this organization)
    (SELECT COUNT(*)::INTEGER 
     FROM subscriptions 
     WHERE following_id = target_org_id 
     AND following_type = 'organization') as follower_count,
    
    -- Count active campaigns for this organization
    (SELECT COUNT(*)::INTEGER 
     FROM fundraisers 
     WHERE org_id = target_org_id 
     AND status = 'active' 
     AND deleted_at IS NULL) as campaign_count,
    
    -- Sum total funds raised across all organization campaigns
    (SELECT COALESCE(SUM(pfs.total_raised), 0)::NUMERIC
     FROM fundraisers f
     JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
     WHERE f.org_id = target_org_id
     AND f.deleted_at IS NULL) as total_funds_raised;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_profile_stats(UUID) TO authenticated, anon;