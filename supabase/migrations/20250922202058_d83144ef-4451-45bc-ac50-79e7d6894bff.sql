-- Create functions to automatically maintain profile counts
-- This will ensure profile counts are always accurate and updated in real-time

-- Function to update campaign count for a user
CREATE OR REPLACE FUNCTION update_user_campaign_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_total int;
  funds_total numeric;
BEGIN
  -- Count active campaigns for this user
  SELECT COUNT(*) INTO campaign_total
  FROM fundraisers
  WHERE owner_user_id = user_id AND status = 'active';
  
  -- Calculate total funds raised across all user's campaigns
  SELECT COALESCE(SUM(pfs.total_raised), 0) INTO funds_total
  FROM fundraisers f
  JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
  WHERE f.owner_user_id = user_id;
  
  -- Update the profile
  UPDATE profiles
  SET 
    campaign_count = campaign_total,
    total_funds_raised = funds_total
  WHERE id = user_id;
END;
$$;

-- Function to update following/follower counts
CREATE OR REPLACE FUNCTION update_follow_counts(affected_user_id uuid, affected_org_id uuid DEFAULT NULL, operation text DEFAULT 'INSERT')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  following_total int;
  follower_total int;
BEGIN
  -- Update follower's following count (includes both users and organizations)
  IF affected_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO following_total
    FROM subscriptions
    WHERE follower_id = affected_user_id;
    
    UPDATE profiles
    SET following_count = following_total
    WHERE id = affected_user_id;
  END IF;
  
  -- Update followed user's follower count (only for user follows, not organization follows)
  IF affected_org_id IS NULL AND operation IN ('INSERT', 'DELETE') THEN
    -- This is a user-to-user follow, update the followed user's follower count
    SELECT COUNT(*) INTO follower_total
    FROM subscriptions s
    WHERE s.following_id IN (
      SELECT following_id FROM subscriptions 
      WHERE follower_id = affected_user_id 
      AND following_type = 'user'
      LIMIT 1
    ) AND s.following_type = 'user';
    
    -- Update follower count for any affected users
    UPDATE profiles
    SET follower_count = (
      SELECT COUNT(*)
      FROM subscriptions
      WHERE following_id = profiles.id AND following_type = 'user'
    )
    WHERE id IN (
      SELECT DISTINCT following_id
      FROM subscriptions
      WHERE following_type = 'user'
      AND (follower_id = affected_user_id OR following_id = affected_user_id)
    );
  END IF;
END;
$$;

-- Trigger function for subscription changes
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update counts after insert
    PERFORM update_follow_counts(NEW.follower_id, 
      CASE WHEN NEW.following_type = 'organization' THEN NEW.following_id ELSE NULL END,
      'INSERT');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update counts after delete
    PERFORM update_follow_counts(OLD.follower_id,
      CASE WHEN OLD.following_type = 'organization' THEN OLD.following_id ELSE NULL END,
      'DELETE');
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger function for fundraiser changes
CREATE OR REPLACE FUNCTION handle_fundraiser_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update campaign count for the owner
    PERFORM update_user_campaign_count(NEW.owner_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update campaign count for the owner (in case status changed)
    PERFORM update_user_campaign_count(NEW.owner_user_id);
    -- Also update for old owner if it changed
    IF OLD.owner_user_id != NEW.owner_user_id THEN
      PERFORM update_user_campaign_count(OLD.owner_user_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update campaign count for the old owner
    PERFORM update_user_campaign_count(OLD.owner_user_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS subscription_count_trigger ON subscriptions;
CREATE TRIGGER subscription_count_trigger
  AFTER INSERT OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_change();

DROP TRIGGER IF EXISTS fundraiser_count_trigger ON fundraisers;
CREATE TRIGGER fundraiser_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON fundraisers
  FOR EACH ROW
  EXECUTE FUNCTION handle_fundraiser_change();

-- Update all existing profile counts to ensure they're accurate
-- Update campaign counts and total funds raised
UPDATE profiles 
SET 
  campaign_count = (
    SELECT COUNT(*)
    FROM fundraisers
    WHERE owner_user_id = profiles.id AND status = 'active'
  ),
  total_funds_raised = (
    SELECT COALESCE(SUM(pfs.total_raised), 0)
    FROM fundraisers f
    JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
    WHERE f.owner_user_id = profiles.id
  );

-- Update following counts (includes both users and organizations)
UPDATE profiles
SET following_count = (
  SELECT COUNT(*)
  FROM subscriptions
  WHERE follower_id = profiles.id
);

-- Update follower counts (only users can have followers)
UPDATE profiles
SET follower_count = (
  SELECT COUNT(*)
  FROM subscriptions
  WHERE following_id = profiles.id AND following_type = 'user'
);