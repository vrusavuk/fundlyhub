-- Phase 1: Backfill projection tables and regenerate FTS vectors (Fixed)

-- First, regenerate all FTS vectors to ensure they're current
UPDATE profiles SET fts = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C')
WHERE fts IS NULL OR name IS NOT NULL;

UPDATE fundraisers SET fts = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(beneficiary_name, '')), 'C') ||
  setweight(to_tsvector('english', regexp_replace(coalesce(story_html, ''), '<[^>]*>', '', 'g')), 'D')
WHERE fts IS NULL OR title IS NOT NULL;

UPDATE organizations SET fts = 
  setweight(to_tsvector('english', coalesce(legal_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(dba_name, '')), 'A') ||
  setweight(to_tsvector('english', array_to_string(coalesce(categories, ARRAY[]::text[]), ' ')), 'B')
WHERE fts IS NULL OR legal_name IS NOT NULL;

-- Backfill campaign_summary_projection (excluding generated columns)
INSERT INTO campaign_summary_projection (
  campaign_id, title, slug, summary, cover_image,
  goal_amount, total_raised, donor_count, status, visibility,
  category_id, owner_user_id, org_id, owner_name, owner_avatar,
  org_name, created_at, end_date, last_donation_at
)
SELECT 
  f.id as campaign_id,
  f.title,
  f.slug,
  f.summary,
  f.cover_image,
  f.goal_amount,
  COALESCE(pfs.total_raised, 0) as total_raised,
  COALESCE(pfs.donor_count, 0) as donor_count,
  f.status,
  f.visibility,
  f.category_id,
  f.owner_user_id,
  f.org_id,
  p.name as owner_name,
  p.avatar as owner_avatar,
  COALESCE(o.dba_name, o.legal_name) as org_name,
  f.created_at,
  f.end_date,
  (SELECT MAX(created_at) FROM donations WHERE fundraiser_id = f.id) as last_donation_at
FROM fundraisers f
LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
LEFT JOIN profiles p ON f.owner_user_id = p.id
LEFT JOIN organizations o ON f.org_id = o.id
WHERE f.deleted_at IS NULL
ON CONFLICT (campaign_id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  summary = EXCLUDED.summary,
  cover_image = EXCLUDED.cover_image,
  goal_amount = EXCLUDED.goal_amount,
  total_raised = EXCLUDED.total_raised,
  donor_count = EXCLUDED.donor_count,
  status = EXCLUDED.status,
  visibility = EXCLUDED.visibility,
  owner_name = EXCLUDED.owner_name,
  owner_avatar = EXCLUDED.owner_avatar,
  org_name = EXCLUDED.org_name,
  last_donation_at = EXCLUDED.last_donation_at,
  updated_at = now();

-- Backfill campaign_search_projection
INSERT INTO campaign_search_projection (
  campaign_id, title, summary, story_text, beneficiary_name,
  location, tags, status, visibility, category_name, owner_name,
  org_name, created_at, search_vector
)
SELECT 
  f.id as campaign_id,
  f.title,
  f.summary,
  regexp_replace(COALESCE(f.story_html, ''), '<[^>]*>', '', 'g') as story_text,
  f.beneficiary_name,
  f.location,
  f.tags,
  f.status,
  f.visibility,
  c.name as category_name,
  p.name as owner_name,
  COALESCE(o.dba_name, o.legal_name) as org_name,
  f.created_at,
  setweight(to_tsvector('english', COALESCE(f.title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(f.summary, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(regexp_replace(f.story_html, '<[^>]*>', '', 'g'), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(f.beneficiary_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(f.location, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(c.name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(p.name, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(f.tags, ' '), '')), 'D') as search_vector
FROM fundraisers f
LEFT JOIN categories c ON f.category_id = c.id
LEFT JOIN profiles p ON f.owner_user_id = p.id
LEFT JOIN organizations o ON f.org_id = o.id
WHERE f.deleted_at IS NULL
ON CONFLICT (campaign_id) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  story_text = EXCLUDED.story_text,
  beneficiary_name = EXCLUDED.beneficiary_name,
  location = EXCLUDED.location,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  visibility = EXCLUDED.visibility,
  category_name = EXCLUDED.category_name,
  owner_name = EXCLUDED.owner_name,
  org_name = EXCLUDED.org_name,
  search_vector = EXCLUDED.search_vector,
  updated_at = now();

-- Backfill campaign_stats_projection
INSERT INTO campaign_stats_projection (
  campaign_id, total_donations, donation_count, unique_donors,
  average_donation, first_donation_at, last_donation_at,
  peak_donation_amount, view_count, share_count, 
  comment_count, update_count
)
SELECT 
  f.id as campaign_id,
  COALESCE(pfs.total_raised, 0) as total_donations,
  COALESCE(pfs.donor_count, 0) as donation_count,
  COALESCE((SELECT COUNT(DISTINCT donor_user_id) FROM donations WHERE fundraiser_id = f.id), 0) as unique_donors,
  CASE 
    WHEN COALESCE(pfs.donor_count, 0) > 0 
    THEN COALESCE(pfs.total_raised, 0) / pfs.donor_count 
    ELSE 0 
  END as average_donation,
  (SELECT MIN(created_at) FROM donations WHERE fundraiser_id = f.id) as first_donation_at,
  (SELECT MAX(created_at) FROM donations WHERE fundraiser_id = f.id) as last_donation_at,
  (SELECT MAX(amount) FROM donations WHERE fundraiser_id = f.id) as peak_donation_amount,
  0 as view_count,
  0 as share_count,
  (SELECT COUNT(*) FROM comments WHERE fundraiser_id = f.id) as comment_count,
  (SELECT COUNT(*) FROM updates WHERE fundraiser_id = f.id) as update_count
FROM fundraisers f
LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
WHERE f.deleted_at IS NULL
ON CONFLICT (campaign_id) DO UPDATE SET
  total_donations = EXCLUDED.total_donations,
  donation_count = EXCLUDED.donation_count,
  unique_donors = EXCLUDED.unique_donors,
  average_donation = EXCLUDED.average_donation,
  first_donation_at = EXCLUDED.first_donation_at,
  last_donation_at = EXCLUDED.last_donation_at,
  peak_donation_amount = EXCLUDED.peak_donation_amount,
  comment_count = EXCLUDED.comment_count,
  update_count = EXCLUDED.update_count,
  updated_at = now();