
-- =====================================================
-- DATABASE CLEANUP - Remove Duplicate Constraints
-- =====================================================

-- Remove duplicate foreign key constraints on fundraisers table
ALTER TABLE public.fundraisers DROP CONSTRAINT IF EXISTS fk_fundraisers_org;
ALTER TABLE public.fundraisers DROP CONSTRAINT IF EXISTS fk_fundraisers_owner;
ALTER TABLE public.fundraisers DROP CONSTRAINT IF EXISTS fk_fundraisers_category;

-- Remove duplicate foreign key constraints on donations table  
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS fk_donations_fundraiser;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS fk_donations_donor;

-- Remove duplicate foreign key constraints on comments table
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_fundraiser;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_author;

-- Keep only the automatically generated constraints with proper naming
-- fundraisers_org_id_fkey, fundraisers_owner_user_id_fkey, fundraisers_category_id_fkey
-- donations_fundraiser_id_fkey, donations_donor_user_id_fkey
-- comments_fundraiser_id_fkey, comments_author_id_fkey

-- Clean up unused indexes if any
DROP INDEX IF EXISTS idx_fundraisers_category;
DROP INDEX IF EXISTS idx_fundraisers_org;
DROP INDEX IF EXISTS idx_fundraisers_owner;

-- Create optimized indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_fundraisers_status_visibility 
  ON public.fundraisers(status, visibility) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fundraisers_category_status 
  ON public.fundraisers(category_id, status) 
  WHERE deleted_at IS NULL AND visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_donations_fundraiser_status 
  ON public.donations(fundraiser_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_comments_fundraiser 
  ON public.comments(fundraiser_id);
