-- Fix current user profile and create sample users for testing follow functionality

-- First, let's fix the current user's profile name
UPDATE profiles 
SET name = 'Vitaliy Kruk'
WHERE id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa';

-- Create sample user profiles for testing
INSERT INTO profiles (id, name, email, bio, avatar, role, location, website, campaign_count, total_funds_raised, follower_count, following_count) VALUES
('11111111-1111-1111-1111-111111111111', 'Sarah Johnson', 'sarah.johnson@example.com', 'Passionate about animal welfare and environmental conservation. Working to make the world a better place for all living beings.', null, 'organizer', 'San Francisco, CA', 'https://sarahjohnson.org', 0, 0, 0, 0),
('22222222-2222-2222-2222-222222222222', 'Michael Chen', 'michael.chen@example.com', 'Healthcare advocate focused on improving medical access in underserved communities. Former nurse turned full-time organizer.', null, 'organizer', 'Seattle, WA', null, 0, 0, 0, 0),
('33333333-3333-3333-3333-333333333333', 'Emma Rodriguez', 'emma.rodriguez@example.com', 'Education enthusiast working to provide learning opportunities for children in low-income areas.', null, 'organizer', 'Austin, TX', 'https://eduforall.org', 0, 0, 0, 0),
('44444444-4444-4444-4444-444444444444', 'David Kim', 'david.kim@example.com', 'Emergency response coordinator helping communities recover from natural disasters.', null, 'organizer', 'Los Angeles, CA', null, 0, 0, 0, 0);

-- Update existing fundraisers to be owned by different organizers
-- First, let's get the fundraiser IDs and randomly assign them
UPDATE fundraisers SET owner_user_id = '11111111-1111-1111-1111-111111111111' WHERE id IN (
  SELECT id FROM fundraisers ORDER BY created_at LIMIT 2
);

UPDATE fundraisers SET owner_user_id = '22222222-2222-2222-2222-222222222222' WHERE id IN (
  SELECT id FROM fundraisers WHERE owner_user_id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa' ORDER BY created_at LIMIT 1
);

UPDATE fundraisers SET owner_user_id = '33333333-3333-3333-3333-333333333333' WHERE id IN (
  SELECT id FROM fundraisers WHERE owner_user_id = 'ebd04736-b785-4569-83d4-5fee5a49e3fa' ORDER BY created_at DESC LIMIT 1
);

-- Update profile statistics based on actual fundraiser ownership
UPDATE profiles SET 
  campaign_count = (SELECT COUNT(*) FROM fundraisers WHERE owner_user_id = profiles.id),
  total_funds_raised = COALESCE((SELECT SUM(pfs.total_raised) FROM public_fundraiser_stats pfs JOIN fundraisers f ON f.id = pfs.fundraiser_id WHERE f.owner_user_id = profiles.id), 0)
WHERE id IN ('ebd04736-b785-4569-83d4-5fee5a49e3fa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');

-- Create follow relationships for testing
INSERT INTO subscriptions (follower_id, following_id, following_type) VALUES
-- Vitaliy follows Sarah and Michael
('ebd04736-b785-4569-83d4-5fee5a49e3fa', '11111111-1111-1111-1111-111111111111', 'user'),
('ebd04736-b785-4569-83d4-5fee5a49e3fa', '22222222-2222-2222-2222-222222222222', 'user'),
-- Sarah follows Vitaliy
('11111111-1111-1111-1111-111111111111', 'ebd04736-b785-4569-83d4-5fee5a49e3fa', 'user'),
-- Michael follows Emma
('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'user'),
-- Emma follows David and Sarah
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'user'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'user');

-- Update follower and following counts
UPDATE profiles SET 
  following_count = (SELECT COUNT(*) FROM subscriptions WHERE follower_id = profiles.id AND following_type = 'user'),
  follower_count = (SELECT COUNT(*) FROM subscriptions WHERE following_id = profiles.id AND following_type = 'user')
WHERE id IN ('ebd04736-b785-4569-83d4-5fee5a49e3fa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');