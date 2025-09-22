-- Fix campaign organizers by distributing them across different users (fixed enum casting)

-- First, let's see what users we have and update campaigns accordingly
WITH user_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.profiles
  LIMIT 10
),
campaign_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.fundraisers
)
UPDATE public.fundraisers 
SET owner_user_id = (
  SELECT u.id 
  FROM user_list u 
  WHERE u.rn = ((campaign_list.rn - 1) % (SELECT COUNT(*) FROM user_list)) + 1
)
FROM campaign_list
WHERE fundraisers.id = campaign_list.id;

-- Update organization memberships to match the new campaign owners
-- First, clear existing org_members that might not match
DELETE FROM public.org_members;

-- Add organization members based on campaign ownership (with proper enum casting)
INSERT INTO public.org_members (org_id, user_id, role)
SELECT DISTINCT 
  f.org_id,
  f.owner_user_id,
  'owner'::org_member_role
FROM public.fundraisers f
WHERE f.org_id IS NOT NULL
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Update donations to be from different users as well
WITH user_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.profiles
),
donation_list AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.donations
)
UPDATE public.donations 
SET donor_user_id = (
  SELECT u.id 
  FROM user_list u 
  WHERE u.rn = ((donation_list.rn - 1) % (SELECT COUNT(*) FROM user_list)) + 1
)
FROM donation_list
WHERE donations.id = donation_list.id
  AND donations.donor_user_id IS NOT NULL;

-- Add some variety to user profiles for better testing
UPDATE public.profiles 
SET 
  name = CASE 
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 0) THEN 'Sarah Johnson'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 1) THEN 'Michael Chen'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 2) THEN 'Emma Rodriguez'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 3) THEN 'David Kim'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 4) THEN 'Lisa Thompson'
    ELSE name
  END,
  bio = CASE 
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 0) THEN 'Healthcare advocate dedicated to helping families in medical crisis. Every donation makes a difference.'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 1) THEN 'Community organizer focused on sustainable living and environmental protection. Building a better future together.'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 2) THEN 'Education enthusiast working to improve learning opportunities for all children in our community.'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 3) THEN 'Marine biologist passionate about ocean conservation and protecting our planet for future generations.'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 4) THEN 'Non-profit leader with 10+ years experience in community development and social impact initiatives.'
    ELSE bio
  END,
  location = CASE 
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 0) THEN 'New York, NY'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 1) THEN 'Portland, OR'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 2) THEN 'Austin, TX'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 3) THEN 'San Francisco, CA'
    WHEN id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1 OFFSET 4) THEN 'Seattle, WA'
    ELSE location
  END;

-- Clear existing subscriptions and create new diverse ones
DELETE FROM public.subscriptions;

-- Create diverse follow relationships between the new users
INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p1.id as follower_id,
  p2.id as following_id,
  'user'
FROM public.profiles p1
CROSS JOIN public.profiles p2
WHERE p1.id != p2.id
  AND p1.name IN ('Sarah Johnson', 'Michael Chen', 'Emma Rodriguez')
  AND p2.name IN ('David Kim', 'Lisa Thompson')
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

-- Add some organization follows
INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p.id as follower_id,
  '11111111-1111-1111-1111-111111111111' as following_id,
  'organization'
FROM public.profiles p
WHERE p.name IN ('Sarah Johnson', 'Michael Chen')
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p.id as follower_id,
  '22222222-2222-2222-2222-222222222222' as following_id,
  'organization'
FROM public.profiles p
WHERE p.name IN ('David Kim', 'Emma Rodriguez')
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

-- Update profile stats to reflect the new campaign ownership
UPDATE public.profiles 
SET 
  campaign_count = (
    SELECT COUNT(*) 
    FROM public.fundraisers f 
    WHERE f.owner_user_id = profiles.id
  ),
  total_funds_raised = (
    SELECT COALESCE(SUM(d.amount), 0)
    FROM public.fundraisers f
    JOIN public.donations d ON d.fundraiser_id = f.id
    WHERE f.owner_user_id = profiles.id AND d.payment_status = 'paid'
  );