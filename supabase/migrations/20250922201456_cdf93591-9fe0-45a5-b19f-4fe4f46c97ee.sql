-- Remove the hardcoded values and fix user roles based on activity
-- Update user roles to 'creator' if they have created any fundraisers
UPDATE profiles 
SET role = 'creator'
WHERE id IN (
  SELECT DISTINCT owner_user_id 
  FROM fundraisers 
  WHERE owner_user_id IS NOT NULL
) AND role = 'visitor';

-- Remove the hardcoded functions and triggers we created earlier since we're now using real-time queries
DROP TRIGGER IF EXISTS subscription_count_trigger ON subscriptions;
DROP FUNCTION IF EXISTS handle_subscription_change();
DROP FUNCTION IF EXISTS update_following_count(uuid);