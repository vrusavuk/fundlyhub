-- ============================================
-- Populate Search Projections with Correct Schema
-- ============================================

-- STEP 1: Populate user_search_projection
INSERT INTO user_search_projection (
  user_id, name, email, bio, location, avatar, role,
  name_lowercase, name_tokens, name_soundex, name_metaphone, name_dmetaphone,
  name_bigrams, name_trigrams, search_vector, relevance_boost,
  campaign_count, follower_count, is_verified,
  profile_visibility, account_status, created_at
)
SELECT 
  p.id, p.name, p.email, p.bio, p.location, p.avatar, p.role,
  LOWER(COALESCE(p.name, '')),
  string_to_array(LOWER(COALESCE(p.name, '')), ' '),
  soundex(COALESCE(p.name, '')),
  metaphone(COALESCE(p.name, ''), 8),
  dmetaphone(COALESCE(p.name, '')),
  ARRAY(SELECT DISTINCT substr(LOWER(COALESCE(p.name, '')), i, 2) 
        FROM generate_series(1, GREATEST(1, length(LOWER(COALESCE(p.name, ''))) - 1)) AS i),
  ARRAY(SELECT DISTINCT substr(LOWER(COALESCE(p.name, '')), i, 3) 
        FROM generate_series(1, GREATEST(1, length(LOWER(COALESCE(p.name, ''))) - 2)) AS i),
  setweight(to_tsvector('english', COALESCE(p.name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(p.bio, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(p.location, '')), 'C'),
  CASE 
    WHEN p.is_verified THEN 1.5
    WHEN p.follower_count > 100 THEN 1.3
    WHEN p.campaign_count > 5 THEN 1.2
    ELSE 1.0
  END,
  p.campaign_count, p.follower_count, p.is_verified,
  p.profile_visibility, p.account_status, p.created_at
FROM profiles p
WHERE p.deleted_at IS NULL
  AND p.account_status = 'active'
  AND p.profile_visibility = 'public'
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  name_lowercase = EXCLUDED.name_lowercase,
  name_tokens = EXCLUDED.name_tokens,
  name_soundex = EXCLUDED.name_soundex,
  name_metaphone = EXCLUDED.name_metaphone,
  name_dmetaphone = EXCLUDED.name_dmetaphone,
  name_bigrams = EXCLUDED.name_bigrams,
  name_trigrams = EXCLUDED.name_trigrams,
  search_vector = EXCLUDED.search_vector,
  relevance_boost = EXCLUDED.relevance_boost,
  updated_at = NOW();

-- STEP 2: Fix campaign search vectors
UPDATE campaign_search_projection
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(story_text, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(owner_name, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(beneficiary_name, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(category_name, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'D')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_search_vector 
  ON campaign_search_projection USING gin(search_vector);

-- STEP 3: Create organization_search_projection
CREATE TABLE IF NOT EXISTS organization_search_projection (
  org_id UUID PRIMARY KEY,
  legal_name TEXT NOT NULL,
  dba_name TEXT,
  website TEXT,
  country TEXT,
  categories TEXT[],
  verification_status verification_status,
  name_lowercase TEXT NOT NULL,
  name_tokens TEXT[],
  search_vector tsvector,
  relevance_boost NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_search_vector 
  ON organization_search_projection USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_org_name_lowercase 
  ON organization_search_projection(name_lowercase);

ALTER TABLE organization_search_projection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization search is publicly readable"
  ON organization_search_projection FOR SELECT
  USING (true);

CREATE POLICY "System can manage organization search"
  ON organization_search_projection FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Populate organization search projection
INSERT INTO organization_search_projection (
  org_id, legal_name, dba_name, website, country, categories,
  verification_status, name_lowercase, name_tokens, search_vector,
  relevance_boost, created_at
)
SELECT 
  o.id, o.legal_name, o.dba_name, o.website, o.country, o.categories,
  o.verification_status,
  LOWER(COALESCE(o.dba_name, o.legal_name, '')),
  string_to_array(LOWER(COALESCE(o.dba_name, o.legal_name, '')), ' '),
  setweight(to_tsvector('english', COALESCE(o.legal_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(o.dba_name, '')), 'A') ||
  setweight(to_tsvector('english', array_to_string(COALESCE(o.categories, ARRAY[]::text[]), ' ')), 'B') ||
  setweight(to_tsvector('english', COALESCE(o.country, '')), 'C'),
  CASE 
    WHEN o.verification_status = 'approved' THEN 1.5
    ELSE 1.0
  END,
  o.created_at
FROM organizations o
WHERE o.deleted_at IS NULL
ON CONFLICT (org_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  dba_name = EXCLUDED.dba_name,
  search_vector = EXCLUDED.search_vector,
  relevance_boost = EXCLUDED.relevance_boost,
  updated_at = NOW();

-- STEP 4: Resync function for organizations
CREATE OR REPLACE FUNCTION resync_organization_search_projections()
RETURNS TABLE(synced_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM organization_search_projection;
  
  INSERT INTO organization_search_projection (
    org_id, legal_name, dba_name, website, country, categories,
    verification_status, name_lowercase, name_tokens, search_vector,
    relevance_boost, created_at
  )
  SELECT 
    o.id, o.legal_name, o.dba_name, o.website, o.country, o.categories,
    o.verification_status,
    LOWER(COALESCE(o.dba_name, o.legal_name, '')),
    string_to_array(LOWER(COALESCE(o.dba_name, o.legal_name, '')), ' '),
    setweight(to_tsvector('english', COALESCE(o.legal_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(o.dba_name, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(o.categories, ARRAY[]::text[]), ' ')), 'B'),
    CASE WHEN o.verification_status = 'approved' THEN 1.5 ELSE 1.0 END,
    o.created_at
  FROM organizations o
  WHERE o.deleted_at IS NULL;
  
  RETURN QUERY SELECT COUNT(*)::INTEGER FROM organization_search_projection;
END;
$$;