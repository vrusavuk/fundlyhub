-- =====================================================
-- DATABASE OPTIMIZATION - PART 1 (Indexes & Basic Changes)
-- =====================================================

DROP VIEW IF EXISTS public_fundraiser_stats CASCADE;

-- =====================================================
-- PHASE 1: ADD MISSING INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_donations_fundraiser_id ON donations(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_user_id ON donations(donor_user_id) WHERE donor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_fundraiser_id ON comments(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_updates_fundraiser_id ON updates(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_updates_author_id ON updates(author_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_owner_user_id ON fundraisers(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_category_id ON fundraisers(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fundraisers_org_id ON fundraisers(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_id ON subscriptions(follower_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_following_id ON subscriptions(following_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_actor_id ON user_activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id) WHERE resource_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fundraisers_status_visibility ON fundraisers(status, visibility) 
  WHERE status = 'active' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_fundraisers_category_status ON fundraisers(category_id, status) 
  WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_status_created ON donations(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type_following ON subscriptions(following_type, following_id);

CREATE INDEX IF NOT EXISTS idx_fundraisers_created_at ON fundraisers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_at ON event_store(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_event_store_event_data_gin ON event_store USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_system_settings_value_gin ON system_settings USING GIN(setting_value);
CREATE INDEX IF NOT EXISTS idx_profiles_social_links_gin ON profiles USING GIN(social_links);

CREATE INDEX IF NOT EXISTS idx_fundraisers_search ON fundraisers 
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(beneficiary_name, '')));
CREATE INDEX IF NOT EXISTS idx_organizations_search ON organizations 
  USING GIN(to_tsvector('english', coalesce(legal_name, '') || ' ' || coalesce(dba_name, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles 
  USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(bio, '')));

-- =====================================================
-- PHASE 3: REMOVE LEGACY COLUMNS
-- =====================================================

ALTER TABLE fundraisers DROP COLUMN IF EXISTS category;

-- =====================================================
-- PHASE 5: ADD SOFT DELETE SUPPORT
-- =====================================================

ALTER TABLE fundraisers 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS idx_fundraisers_deleted_at ON fundraisers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- RECREATE VIEW
-- =====================================================

CREATE OR REPLACE VIEW public_fundraiser_stats AS
SELECT 
  f.id AS fundraiser_id,
  f.title,
  f.status,
  f.visibility,
  f.goal_amount,
  f.currency,
  f.created_at,
  f.end_date,
  COALESCE(SUM(d.amount), 0) AS total_raised,
  COUNT(DISTINCT d.donor_user_id) AS donor_count
FROM fundraisers f
LEFT JOIN donations d ON f.id = d.fundraiser_id 
  AND d.payment_status = 'paid'
GROUP BY f.id;

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Public fundraisers are viewable by everyone" ON fundraisers;
CREATE POLICY "Public fundraisers are viewable by everyone"
ON fundraisers FOR SELECT
USING (
  visibility = 'public' 
  AND status = 'active' 
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Owners can view their own fundraisers" ON fundraisers;
CREATE POLICY "Owners can view their own fundraisers"
ON fundraisers FOR SELECT
USING (
  (owner_user_id = auth.uid() OR 
   EXISTS (
     SELECT 1 FROM org_members 
     WHERE org_members.org_id = fundraisers.org_id 
     AND org_members.user_id = auth.uid()
   ))
  AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Admins can view all campaigns" ON fundraisers;
CREATE POLICY "Admins can view all campaigns"
ON fundraisers FOR SELECT
USING (
  user_has_permission(auth.uid(), 'manage_campaigns') 
  OR is_super_admin(auth.uid())
);