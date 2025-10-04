-- Add slug column to campaign_search_projection for proper URL generation
ALTER TABLE campaign_search_projection 
ADD COLUMN IF NOT EXISTS slug text;

-- Update existing projection data to include slugs
-- This will be populated automatically by triggers going forward
UPDATE campaign_search_projection csp
SET slug = f.slug
FROM fundraisers f
WHERE csp.campaign_id = f.id;