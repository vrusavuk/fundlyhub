-- Add full-text search support with triggers
-- This migration adds tsvector columns and automatic update triggers

-- =====================================================
-- PHASE 1: Add tsvector columns (not generated)
-- =====================================================

-- Add fts column to fundraisers for full-text search
ALTER TABLE public.fundraisers 
ADD COLUMN IF NOT EXISTS fts tsvector;

-- Add fts column to profiles for full-text search
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fts tsvector;

-- Add fts column to organizations for full-text search  
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS fts tsvector;

-- =====================================================
-- PHASE 2: Create trigger functions to maintain fts columns
-- =====================================================

-- Function to update fundraiser fts column
CREATE OR REPLACE FUNCTION public.update_fundraiser_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.beneficiary_name, '')), 'C') ||
    setweight(to_tsvector('english', regexp_replace(coalesce(NEW.story_html, ''), '<[^>]*>', '', 'g')), 'D');
  RETURN NEW;
END;
$$;

-- Function to update profile fts column
CREATE OR REPLACE FUNCTION public.update_profile_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$;

-- Function to update organization fts column
CREATE OR REPLACE FUNCTION public.update_organization_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.legal_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.dba_name, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.categories, ARRAY[]::text[]), ' ')), 'B');
  RETURN NEW;
END;
$$;

-- =====================================================
-- PHASE 3: Create triggers
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS fundraiser_fts_update ON public.fundraisers;
DROP TRIGGER IF EXISTS profile_fts_update ON public.profiles;
DROP TRIGGER IF EXISTS organization_fts_update ON public.organizations;

-- Create triggers for automatic fts updates
CREATE TRIGGER fundraiser_fts_update
  BEFORE INSERT OR UPDATE OF title, summary, beneficiary_name, story_html
  ON public.fundraisers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fundraiser_fts();

CREATE TRIGGER profile_fts_update
  BEFORE INSERT OR UPDATE OF name, bio, location
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_fts();

CREATE TRIGGER organization_fts_update
  BEFORE INSERT OR UPDATE OF legal_name, dba_name, categories
  ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_fts();

-- =====================================================
-- PHASE 4: Initialize existing records
-- =====================================================

-- Update existing fundraisers
UPDATE public.fundraisers
SET fts = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(beneficiary_name, '')), 'C') ||
  setweight(to_tsvector('english', regexp_replace(coalesce(story_html, ''), '<[^>]*>', '', 'g')), 'D')
WHERE fts IS NULL;

-- Update existing profiles
UPDATE public.profiles
SET fts = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C')
WHERE fts IS NULL;

-- Update existing organizations
UPDATE public.organizations
SET fts = 
  setweight(to_tsvector('english', coalesce(legal_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(dba_name, '')), 'A') ||
  setweight(to_tsvector('english', array_to_string(coalesce(categories, ARRAY[]::text[]), ' ')), 'B')
WHERE fts IS NULL;

-- =====================================================
-- PHASE 5: Create GIN indexes for fast search
-- =====================================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS public.idx_fundraisers_search;
DROP INDEX IF EXISTS public.idx_profiles_search;
DROP INDEX IF EXISTS public.idx_organizations_search;
DROP INDEX IF EXISTS public.idx_fundraisers_fts;
DROP INDEX IF EXISTS public.idx_profiles_fts;
DROP INDEX IF EXISTS public.idx_organizations_fts;

-- Create new indexes on fts columns
CREATE INDEX idx_fundraisers_fts ON public.fundraisers USING GIN(fts);
CREATE INDEX idx_profiles_fts ON public.profiles USING GIN(fts);
CREATE INDEX idx_organizations_fts ON public.organizations USING GIN(fts);

-- =====================================================
-- PHASE 6: Update public_profiles view to include fts
-- =====================================================

-- Recreate public_profiles view to include fts column for search
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  avatar,
  bio,
  location,
  website,
  social_links,
  campaign_count,
  total_funds_raised,
  follower_count,
  following_count,
  is_verified,
  verified_at,
  role,
  created_at,
  profile_visibility,
  fts
FROM public.profiles
WHERE deleted_at IS NULL 
  AND banned_at IS NULL
  AND account_status = 'active'
  AND profile_visibility = 'public';

COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles excluding sensitive information like email, with full-text search support';

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;