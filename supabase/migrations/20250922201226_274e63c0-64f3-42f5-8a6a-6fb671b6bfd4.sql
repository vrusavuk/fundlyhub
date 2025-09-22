-- Fix following count and user role for user ebd04736-b785-4569-83d4-5fee5a49e3fa
UPDATE profiles 
SET 
  following_count = 5,
  role = 'creator'
WHERE id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa';

-- Create a function to properly calculate following count including organizations
CREATE OR REPLACE FUNCTION update_following_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  following_total int;
BEGIN
  -- Count both user and organization follows
  SELECT COUNT(*) INTO following_total
  FROM subscriptions
  WHERE follower_id = user_id;
  
  -- Update the profile
  UPDATE profiles
  SET following_count = following_total
  WHERE id = user_id;
END;
$$;

-- Create trigger to automatically update following count when subscriptions change
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower's following count
    PERFORM update_following_count(NEW.follower_id);
    
    -- Update followed user's follower count (only for users, not organizations)
    IF NEW.following_type = 'user' THEN
      UPDATE profiles
      SET follower_count = follower_count + 1
      WHERE id = NEW.following_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower's following count
    PERFORM update_following_count(OLD.follower_id);
    
    -- Update followed user's follower count (only for users, not organizations)
    IF OLD.following_type = 'user' THEN
      UPDATE profiles
      SET follower_count = follower_count - 1
      WHERE id = OLD.following_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS subscription_count_trigger ON subscriptions;
CREATE TRIGGER subscription_count_trigger
  AFTER INSERT OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_change();