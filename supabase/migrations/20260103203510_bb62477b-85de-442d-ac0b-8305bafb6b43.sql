-- Temporarily disable triggers that require auth context
ALTER TABLE profiles DISABLE TRIGGER trigger_log_sensitive_profile_changes;
ALTER TABLE fundraisers DISABLE TRIGGER update_user_role_on_fundraiser_change;
ALTER TABLE fundraisers DISABLE TRIGGER fundraiser_count_trigger;

-- Phase 3: Delete Related Data (Order Matters for Foreign Keys)

-- Step 1: Delete subscriptions/follows involving test users
DELETE FROM subscriptions 
WHERE follower_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com')
   OR (following_type = 'user' AND following_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com'));

-- Step 2: Delete comments on test user campaigns
DELETE FROM comments 
WHERE fundraiser_id IN (
  SELECT f.id FROM fundraisers f
  JOIN profiles p ON f.owner_user_id = p.id
  WHERE p.email LIKE '%@example.com'
);

-- Step 3: Delete fake donations on test user campaigns
DELETE FROM donations 
WHERE fundraiser_id IN (
  SELECT f.id FROM fundraisers f
  JOIN profiles p ON f.owner_user_id = p.id
  WHERE p.email LIKE '%@example.com'
);

-- Step 4: Delete projection table entries for test campaigns
DELETE FROM campaign_summary_projection 
WHERE owner_user_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com');

DELETE FROM campaign_stats_projection 
WHERE campaign_id IN (
  SELECT f.id FROM fundraisers f
  JOIN profiles p ON f.owner_user_id = p.id
  WHERE p.email LIKE '%@example.com'
);

DELETE FROM campaign_search_projection 
WHERE campaign_id IN (
  SELECT f.id FROM fundraisers f
  JOIN profiles p ON f.owner_user_id = p.id
  WHERE p.email LIKE '%@example.com'
);

DELETE FROM campaign_analytics_projection 
WHERE campaign_id IN (
  SELECT f.id FROM fundraisers f
  JOIN profiles p ON f.owner_user_id = p.id
  WHERE p.email LIKE '%@example.com'
);

-- Step 5: Delete test user campaigns (hard delete)
DELETE FROM fundraisers 
WHERE owner_user_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com');

-- Step 6: Delete RBAC role assignments for test users
DELETE FROM user_role_assignments 
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com');

-- Step 7: Delete notification preferences for test users
DELETE FROM notification_preferences 
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com');

-- Step 8: Delete donor history for test users
DELETE FROM donor_history_projection 
WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@example.com');

-- Step 9: Delete test user profiles
DELETE FROM profiles 
WHERE email LIKE '%@example.com';

-- Phase 4: Update Real User Stats (without triggering audit logs)
UPDATE profiles p
SET 
  campaign_count = (
    SELECT COUNT(*) FROM fundraisers f 
    WHERE f.owner_user_id = p.id 
    AND f.status = 'active' 
    AND f.deleted_at IS NULL
  ),
  total_funds_raised = (
    SELECT COALESCE(SUM(d.amount), 0) 
    FROM donations d 
    JOIN fundraisers f ON d.fundraiser_id = f.id 
    WHERE f.owner_user_id = p.id 
    AND d.payment_status = 'paid'
  ),
  follower_count = (SELECT COUNT(*) FROM subscriptions WHERE following_id = p.id AND following_type = 'user'),
  following_count = (SELECT COUNT(*) FROM subscriptions WHERE follower_id = p.id)
WHERE p.deleted_at IS NULL;

-- Re-enable triggers
ALTER TABLE profiles ENABLE TRIGGER trigger_log_sensitive_profile_changes;
ALTER TABLE fundraisers ENABLE TRIGGER update_user_role_on_fundraiser_change;
ALTER TABLE fundraisers ENABLE TRIGGER fundraiser_count_trigger;