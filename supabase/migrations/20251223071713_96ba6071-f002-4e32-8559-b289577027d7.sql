-- Fix existing donations by linking email to user profile
-- This will update donations that have a donor_email matching a profile but no donor_user_id set
UPDATE donations d
SET donor_user_id = p.id
FROM profiles p
WHERE d.donor_email = p.email
AND d.donor_user_id IS NULL
AND d.donor_email IS NOT NULL;