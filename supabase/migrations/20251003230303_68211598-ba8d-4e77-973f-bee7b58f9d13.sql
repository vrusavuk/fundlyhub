-- =====================================================
-- DATABASE OPTIMIZATION - PART 2 FIXED
-- =====================================================

-- =====================================================
-- PHASE 6: IMPROVE PROJECTION TABLE CONSISTENCY
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_campaign_analytics_safe(
  p_campaign_id uuid,
  p_amount numeric,
  p_donor_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_unique_donor_count INTEGER;
  v_first_donation_time TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('campaign_analytics_' || p_campaign_id::text));
  
  SELECT COUNT(DISTINCT donor_user_id), MIN(created_at)
  INTO v_unique_donor_count, v_first_donation_time
  FROM donations
  WHERE fundraiser_id = p_campaign_id AND donor_user_id IS NOT NULL;

  INSERT INTO campaign_analytics_projection (
    campaign_id, total_donations, donation_count, unique_donors,
    first_donation_at, last_donation_at, average_donation, updated_at
  ) VALUES (
    p_campaign_id, p_amount, 1, v_unique_donor_count,
    v_first_donation_time, NOW(),
    p_amount, NOW()
  )
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_donations = campaign_analytics_projection.total_donations + EXCLUDED.total_donations,
    donation_count = campaign_analytics_projection.donation_count + 1,
    unique_donors = v_unique_donor_count,
    last_donation_at = NOW(),
    average_donation = CASE 
      WHEN (campaign_analytics_projection.donation_count + 1) > 0 
      THEN (campaign_analytics_projection.total_donations + EXCLUDED.total_donations) / (campaign_analytics_projection.donation_count + 1)
      ELSE 0
    END,
    updated_at = NOW();
    
  RAISE NOTICE 'Campaign analytics updated for campaign %', p_campaign_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update campaign analytics: %', SQLERRM;
    RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_donor_history_safe(
  p_user_id uuid,
  p_amount numeric,
  p_campaign_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_campaigns_supported INTEGER;
  v_first_donation_time TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('donor_history_' || p_user_id::text));
  
  SELECT COUNT(DISTINCT fundraiser_id), MIN(created_at)
  INTO v_campaigns_supported, v_first_donation_time
  FROM donations
  WHERE donor_user_id = p_user_id;

  INSERT INTO donor_history_projection (
    user_id, total_donated, donation_count, campaigns_supported,
    first_donation_at, last_donation_at, average_donation, updated_at
  ) VALUES (
    p_user_id, p_amount, 1, v_campaigns_supported,
    v_first_donation_time, NOW(),
    p_amount, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_donated = donor_history_projection.total_donated + EXCLUDED.total_donated,
    donation_count = donor_history_projection.donation_count + 1,
    campaigns_supported = v_campaigns_supported,
    last_donation_at = NOW(),
    average_donation = CASE 
      WHEN (donor_history_projection.donation_count + 1) > 0 
      THEN (donor_history_projection.total_donated + EXCLUDED.total_donated) / (donor_history_projection.donation_count + 1)
      ELSE 0
    END,
    updated_at = NOW();
    
  RAISE NOTICE 'Donor history updated for user %', p_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update donor history: %', SQLERRM;
    RAISE;
END;
$function$;

-- =====================================================
-- PHASE 7: ADD MISSING CONSTRAINTS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_goal_amount_positive'
  ) THEN
    ALTER TABLE fundraisers
      ADD CONSTRAINT check_goal_amount_positive CHECK (goal_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_amount_positive'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_tip_amount_non_negative'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT check_tip_amount_non_negative CHECK (tip_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_fee_amount_non_negative'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT check_fee_amount_non_negative CHECK (fee_amount >= 0);
  END IF;
END $$;

-- =====================================================
-- PHASE 8: ADD AUDIT TRAIL COLUMNS
-- =====================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

CREATE OR REPLACE FUNCTION update_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_categories_audit ON categories;
CREATE TRIGGER update_categories_audit
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_fields();

-- =====================================================
-- PHASE 9: OPTIMIZE SEARCH WITH MATERIALIZED VIEW
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS searchable_content CASCADE;
CREATE MATERIALIZED VIEW searchable_content AS
SELECT 
  'fundraiser'::text as content_type,
  f.id,
  f.title,
  f.summary as description,
  f.created_at,
  f.status::text as status,
  f.visibility::text as visibility,
  to_tsvector('english', 
    coalesce(f.title, '') || ' ' || 
    coalesce(f.summary, '') || ' ' || 
    coalesce(f.beneficiary_name, '')
  ) as search_vector
FROM fundraisers f
WHERE f.deleted_at IS NULL

UNION ALL

SELECT 
  'organization'::text,
  o.id,
  o.legal_name as title,
  o.dba_name as description,
  o.created_at,
  o.verification_status::text as status,
  'public'::text as visibility,
  to_tsvector('english',
    coalesce(o.legal_name, '') || ' ' ||
    coalesce(o.dba_name, '')
  ) as search_vector
FROM organizations o
WHERE o.deleted_at IS NULL

UNION ALL

SELECT 
  'profile'::text,
  p.id,
  p.name as title,
  p.bio as description,
  p.created_at,
  p.account_status as status,
  p.profile_visibility as visibility,
  to_tsvector('english',
    coalesce(p.name, '') || ' ' ||
    coalesce(p.bio, '')
  ) as search_vector
FROM profiles p
WHERE p.account_status = 'active';

CREATE INDEX idx_searchable_content_vector ON searchable_content USING GIN(search_vector);
CREATE INDEX idx_searchable_content_type ON searchable_content(content_type);
CREATE UNIQUE INDEX idx_searchable_content_id ON searchable_content(content_type, id);

CREATE OR REPLACE FUNCTION refresh_searchable_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY searchable_content;
END;
$$;

-- =====================================================
-- PHASE 10: ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_fundraisers_category' 
    AND table_name = 'fundraisers'
  ) THEN
    ALTER TABLE fundraisers
      ADD CONSTRAINT fk_fundraisers_category 
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_fundraisers_owner' 
    AND table_name = 'fundraisers'
  ) THEN
    ALTER TABLE fundraisers
      ADD CONSTRAINT fk_fundraisers_owner 
      FOREIGN KEY (owner_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_fundraisers_org' 
    AND table_name = 'fundraisers'
  ) THEN
    ALTER TABLE fundraisers
      ADD CONSTRAINT fk_fundraisers_org 
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_donations_fundraiser' 
    AND table_name = 'donations'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT fk_donations_fundraiser 
      FOREIGN KEY (fundraiser_id) REFERENCES fundraisers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_donations_donor' 
    AND table_name = 'donations'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT fk_donations_donor 
      FOREIGN KEY (donor_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_comments_fundraiser' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT fk_comments_fundraiser 
      FOREIGN KEY (fundraiser_id) REFERENCES fundraisers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_comments_author' 
    AND table_name = 'comments'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT fk_comments_author 
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_updates_fundraiser' 
    AND table_name = 'updates'
  ) THEN
    ALTER TABLE updates
      ADD CONSTRAINT fk_updates_fundraiser 
      FOREIGN KEY (fundraiser_id) REFERENCES fundraisers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_updates_author' 
    AND table_name = 'updates'
  ) THEN
    ALTER TABLE updates
      ADD CONSTRAINT fk_updates_author 
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;