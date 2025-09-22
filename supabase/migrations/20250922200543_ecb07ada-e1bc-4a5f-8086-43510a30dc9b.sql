-- Reset Vitaliy's profile stats to accurate values based on active campaigns only
UPDATE profiles 
SET 
  campaign_count = 0,
  total_funds_raised = 0
WHERE id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa';

-- Clean up the excessive pending campaigns that were incorrectly assigned during sample user creation
-- Keep only a few recent ones and delete the rest
DELETE FROM fundraisers 
WHERE owner_user_id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa' 
AND status = 'pending' 
AND id NOT IN (
  SELECT id FROM fundraisers 
  WHERE owner_user_id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa' 
  AND status = 'pending' 
  ORDER BY created_at DESC 
  LIMIT 3
);