-- Insert sample data for testing social features

-- First, let's create some sample organizations
INSERT INTO public.organizations (id, legal_name, dba_name, website, country, categories, verification_status) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Red Cross International', 'Red Cross', 'https://redcross.org', 'United States', ARRAY['Medical', 'Emergency'], 'verified'),
  ('22222222-2222-2222-2222-222222222222', 'Save the Ocean Foundation', 'Ocean Savers', 'https://saveocean.org', 'Canada', ARRAY['Environment', 'Animal'], 'verified'),
  ('33333333-3333-3333-3333-333333333333', 'Local Community Center', 'Community Hub', 'https://communityhub.org', 'United States', ARRAY['Community', 'Education'], 'pending')
ON CONFLICT (id) DO NOTHING;

-- Add organization members (we'll use existing user IDs that might exist)
-- Note: These will only work if users with these IDs exist
INSERT INTO public.org_members (org_id, user_id, role)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  p.id,
  'owner'
FROM public.profiles p 
LIMIT 1
ON CONFLICT (org_id, user_id) DO NOTHING;

INSERT INTO public.org_members (org_id, user_id, role)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'owner'
FROM public.profiles p 
OFFSET 1 LIMIT 1
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Create sample campaigns for different users and organizations
INSERT INTO public.fundraisers (
  id, title, slug, summary, story_html, goal_amount, currency, 
  category, status, visibility, cover_image, location, 
  owner_user_id, org_id, beneficiary_name
)
SELECT 
  gen_random_uuid(),
  'Emergency Medical Fund for Sarah',
  'emergency-medical-fund-sarah-' || EXTRACT(epoch FROM now())::text,
  'Help Sarah cover her unexpected medical expenses after a serious accident.',
  '<p>Sarah was involved in a serious car accident and needs help covering her medical bills. Every donation helps.</p>',
  15000,
  'USD',
  'Medical',
  'active',
  'public',
  '/assets/sample-campaign-1.jpg',
  'New York, NY',
  p.id,
  NULL,
  'Sarah Johnson'
FROM public.profiles p 
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.fundraisers (
  id, title, slug, summary, story_html, goal_amount, currency, 
  category, status, visibility, cover_image, location, 
  owner_user_id, org_id, beneficiary_name
)
SELECT 
  gen_random_uuid(),
  'Community Garden Project',
  'community-garden-project-' || EXTRACT(epoch FROM now())::text,
  'Building a sustainable community garden for local families.',
  '<p>We want to create a space where families can grow their own food and learn about sustainable farming.</p>',
  8500,
  'USD',
  'Community',
  'active',
  'public',
  '/assets/sample-campaign-2.jpg',
  'Portland, OR',
  p.id,
  '33333333-3333-3333-3333-333333333333',
  'Community Garden Initiative'
FROM public.profiles p 
OFFSET 1 LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.fundraisers (
  id, title, slug, summary, story_html, goal_amount, currency, 
  category, status, visibility, cover_image, location, 
  owner_user_id, org_id, beneficiary_name
)
SELECT 
  gen_random_uuid(),
  'Ocean Cleanup Campaign',
  'ocean-cleanup-campaign-' || EXTRACT(epoch FROM now())::text,
  'Join us in cleaning up our oceans and protecting marine life.',
  '<p>Our mission is to remove plastic waste from the ocean and educate communities about environmental protection.</p>',
  25000,
  'USD',
  'Environment',
  'active',
  'public',
  '/assets/sample-campaign-3.jpg',
  'San Francisco, CA',
  p.id,
  '22222222-2222-2222-2222-222222222222',
  'Ocean Protection Initiative'
FROM public.profiles p 
OFFSET 2 LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Create a closed/completed campaign for testing
INSERT INTO public.fundraisers (
  id, title, slug, summary, story_html, goal_amount, currency, 
  category, status, visibility, cover_image, location, 
  owner_user_id, beneficiary_name
)
SELECT 
  gen_random_uuid(),
  'School Library Books Drive',
  'school-library-books-' || EXTRACT(epoch FROM now())::text,
  'Successfully funded new books for our local elementary school library.',
  '<p>Thanks to everyone who helped us reach our goal! The children now have access to hundreds of new books.</p>',
  3000,
  'USD',
  'Education',
  'closed',
  'public',
  '/placeholder.svg',
  'Austin, TX',
  p.id,
  'Lincoln Elementary School'
FROM public.profiles p 
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Add some sample donations to make the campaigns look active
INSERT INTO public.donations (fundraiser_id, amount, currency, payment_status, donor_user_id)
SELECT 
  f.id,
  (ARRAY[25, 50, 100, 250, 500])[floor(random() * 5 + 1)],
  'USD',
  'paid',
  p.id
FROM public.fundraisers f
CROSS JOIN public.profiles p
WHERE f.status = 'active'
LIMIT 15;

-- Create sample subscriptions between users (if multiple users exist)
INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p1.id as follower_id,
  p2.id as following_id,
  'user'
FROM public.profiles p1
CROSS JOIN public.profiles p2
WHERE p1.id != p2.id
LIMIT 5
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

-- Create sample subscriptions to organizations
INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p.id as follower_id,
  '11111111-1111-1111-1111-111111111111' as following_id,
  'organization'
FROM public.profiles p
LIMIT 3
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

INSERT INTO public.subscriptions (follower_id, following_id, following_type)
SELECT 
  p.id as follower_id,
  '22222222-2222-2222-2222-222222222222' as following_id,
  'organization'
FROM public.profiles p
LIMIT 2
ON CONFLICT (follower_id, following_id, following_type) DO NOTHING;

-- Update profile stats based on actual data
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

-- Add some sample bio data to make profiles more interesting
UPDATE public.profiles 
SET 
  bio = CASE 
    WHEN profile_visibility = 'public' THEN 'Passionate about making a difference in my community. Always looking for ways to help others and create positive change.'
    ELSE bio
  END,
  location = CASE 
    WHEN id = (SELECT id FROM public.profiles LIMIT 1) THEN 'New York, NY'
    WHEN id = (SELECT id FROM public.profiles OFFSET 1 LIMIT 1) THEN 'Portland, OR'
    WHEN id = (SELECT id FROM public.profiles OFFSET 2 LIMIT 1) THEN 'San Francisco, CA'
    ELSE 'United States'
  END,
  website = 'https://example-portfolio.com'
WHERE profile_visibility = 'public';

-- Add some sample activities for the activity feed
INSERT INTO public.user_activities (actor_id, activity_type, target_id, target_type, metadata)
SELECT 
  f.owner_user_id,
  'campaign_created',
  f.id,
  'fundraiser',
  jsonb_build_object('campaign_title', f.title, 'goal_amount', f.goal_amount)
FROM public.fundraisers f
WHERE f.created_at > now() - interval '30 days'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_activities (actor_id, activity_type, target_id, target_type, metadata)
SELECT 
  d.donor_user_id,
  'donation_made',
  d.fundraiser_id,
  'fundraiser',
  jsonb_build_object('amount', d.amount, 'currency', d.currency)
FROM public.donations d
WHERE d.donor_user_id IS NOT NULL
  AND d.created_at > now() - interval '7 days'
ON CONFLICT DO NOTHING;