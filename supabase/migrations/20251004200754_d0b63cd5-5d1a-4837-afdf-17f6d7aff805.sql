-- Phase 1: Create Search Projections and Enhanced Fuzzy Functions

-- =====================================================
-- 1. HELPER FUNCTIONS FOR FUZZY MATCHING
-- =====================================================

-- Levenshtein distance for edit distance calculation
CREATE OR REPLACE FUNCTION levenshtein_distance(s1 TEXT, s2 TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s1_len INTEGER := LENGTH(s1);
  s2_len INTEGER := LENGTH(s2);
  distance INTEGER[];
  i INTEGER;
  j INTEGER;
  cost INTEGER;
BEGIN
  -- Handle edge cases
  IF s1_len = 0 THEN RETURN s2_len; END IF;
  IF s2_len = 0 THEN RETURN s1_len; END IF;
  
  -- Initialize distance matrix
  FOR i IN 0..s1_len LOOP
    distance[i][0] := i;
  END LOOP;
  
  FOR j IN 0..s2_len LOOP
    distance[0][j] := j;
  END LOOP;
  
  -- Calculate distances
  FOR i IN 1..s1_len LOOP
    FOR j IN 1..s2_len LOOP
      cost := CASE WHEN SUBSTRING(s1, i, 1) = SUBSTRING(s2, j, 1) THEN 0 ELSE 1 END;
      distance[i][j] := LEAST(
        distance[i-1][j] + 1,      -- deletion
        distance[i][j-1] + 1,      -- insertion
        distance[i-1][j-1] + cost  -- substitution
      );
    END LOOP;
  END LOOP;
  
  RETURN distance[s1_len][s2_len];
END;
$$;

-- Enhanced N-gram similarity with configurable n
CREATE OR REPLACE FUNCTION ngram_similarity_enhanced(text1 TEXT, text2 TEXT, n INTEGER DEFAULT 2)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
DECLARE
  ngrams1 TEXT[];
  ngrams2 TEXT[];
  intersection_count INTEGER := 0;
  union_count INTEGER;
  i INTEGER;
BEGIN
  -- Generate n-grams for both texts
  FOR i IN 1..(LENGTH(text1) - n + 1) LOOP
    ngrams1 := array_append(ngrams1, SUBSTRING(LOWER(text1), i, n));
  END LOOP;
  
  FOR i IN 1..(LENGTH(text2) - n + 1) LOOP
    ngrams2 := array_append(ngrams2, SUBSTRING(LOWER(text2), i, n));
  END LOOP;
  
  -- Count intersections
  FOR i IN 1..array_length(ngrams1, 1) LOOP
    IF ngrams1[i] = ANY(ngrams2) THEN
      intersection_count := intersection_count + 1;
    END IF;
  END LOOP;
  
  -- Calculate Jaccard similarity
  union_count := array_length(ngrams1, 1) + array_length(ngrams2, 1) - intersection_count;
  
  IF union_count = 0 THEN RETURN 0.0; END IF;
  
  RETURN intersection_count::FLOAT / union_count::FLOAT;
END;
$$;

-- Token-based matching for multi-word names
CREATE OR REPLACE FUNCTION token_match_score(name_text TEXT, query_text TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  name_tokens TEXT[];
  query_tokens TEXT[];
  matches INTEGER := 0;
  token TEXT;
  max_score FLOAT := 0.0;
  current_score FLOAT;
BEGIN
  -- Tokenize both texts
  name_tokens := string_to_array(LOWER(name_text), ' ');
  query_tokens := string_to_array(LOWER(query_text), ' ');
  
  -- Check each query token against name tokens
  FOREACH token IN ARRAY query_tokens LOOP
    current_score := 0.0;
    
    -- Check for exact token match
    IF token = ANY(name_tokens) THEN
      current_score := 1.0;
    ELSE
      -- Check for prefix match
      FOR i IN 1..array_length(name_tokens, 1) LOOP
        IF name_tokens[i] LIKE token || '%' THEN
          current_score := GREATEST(current_score, 0.8);
        END IF;
      END LOOP;
    END IF;
    
    max_score := max_score + current_score;
  END LOOP;
  
  RETURN max_score / array_length(query_tokens, 1);
END;
$$;

-- =====================================================
-- 2. USER SEARCH PROJECTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_search_projection (
  user_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  
  -- Pre-computed search fields
  search_vector tsvector,
  name_lowercase TEXT NOT NULL,
  name_tokens TEXT[],
  name_soundex TEXT,
  name_metaphone TEXT,
  name_dmetaphone TEXT,
  
  -- Bigram and trigram for fuzzy matching
  name_bigrams TEXT[],
  name_trigrams TEXT[],
  
  -- Profile metadata
  role user_role NOT NULL,
  profile_visibility TEXT NOT NULL,
  account_status TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  
  -- Stats for ranking
  follower_count INTEGER DEFAULT 0,
  campaign_count INTEGER DEFAULT 0,
  relevance_boost FLOAT DEFAULT 1.0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure we only store searchable profiles
  CONSTRAINT valid_visibility CHECK (profile_visibility = 'public'),
  CONSTRAINT valid_status CHECK (account_status = 'active')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_search_fts ON user_search_projection USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_user_search_name_lower ON user_search_projection(name_lowercase);
CREATE INDEX IF NOT EXISTS idx_user_search_name_trgm ON user_search_projection USING GIN(name_lowercase gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_search_soundex ON user_search_projection(name_soundex);
CREATE INDEX IF NOT EXISTS idx_user_search_updated ON user_search_projection(updated_at DESC);

-- =====================================================
-- 3. SEARCH SUGGESTIONS PROJECTION
-- =====================================================

CREATE TABLE IF NOT EXISTS search_suggestions_projection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  match_type TEXT NOT NULL, -- 'typo', 'phonetic', 'transposition', 'abbreviation'
  relevance_score FLOAT NOT NULL DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0.0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_query_suggestion UNIQUE(query, suggestion)
);

CREATE INDEX IF NOT EXISTS idx_suggestions_query ON search_suggestions_projection(query);
CREATE INDEX IF NOT EXISTS idx_suggestions_score ON search_suggestions_projection(relevance_score DESC);

-- =====================================================
-- 4. SEARCH RESULTS CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS search_results_cache (
  cache_key TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  suggestions JSONB,
  result_count INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_search_cache_query ON search_results_cache(query);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_results_cache(expires_at);

-- =====================================================
-- 5. ENHANCED FUZZY SEARCH FUNCTION (Multi-Strategy)
-- =====================================================

CREATE OR REPLACE FUNCTION enhanced_fuzzy_search_users(
  search_query TEXT,
  max_results INTEGER DEFAULT 50,
  include_suggestions BOOLEAN DEFAULT true
)
RETURNS TABLE(
  user_id UUID,
  match_name TEXT,
  match_type TEXT,
  relevance_score FLOAT,
  is_suggestion BOOLEAN,
  avatar TEXT,
  bio TEXT,
  role user_role,
  follower_count INTEGER,
  campaign_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  query_length INTEGER;
  normalized_query TEXT;
  edit_distance_threshold INTEGER;
BEGIN
  query_length := LENGTH(TRIM(search_query));
  normalized_query := LOWER(TRIM(search_query));
  
  -- Set edit distance threshold based on query length
  edit_distance_threshold := CASE
    WHEN query_length <= 3 THEN 0
    WHEN query_length <= 5 THEN 1
    WHEN query_length <= 8 THEN 2
    ELSE 3
  END;
  
  RETURN QUERY
  WITH ranked_results AS (
    SELECT DISTINCT
      usp.user_id,
      usp.name as match_name,
      CASE
        -- Strategy 1: Exact match (highest priority)
        WHEN usp.name_lowercase = normalized_query THEN 'exact'
        
        -- Strategy 2: Exact prefix match
        WHEN usp.name_lowercase LIKE normalized_query || '%' THEN 'prefix'
        
        -- Strategy 3: Exact substring match
        WHEN usp.name_lowercase LIKE '%' || normalized_query || '%' THEN 'substring'
        
        -- Strategy 4: Character set match (for very short queries)
        WHEN query_length <= 3 AND char_sequence_match(usp.name, search_query) THEN 'char_sequence'
        
        -- Strategy 5: Token-based match
        WHEN token_match_score(usp.name, search_query) >= 0.7 THEN 'token'
        
        -- Strategy 6: Edit distance match
        WHEN levenshtein_distance(usp.name_lowercase, normalized_query) <= edit_distance_threshold THEN 'edit_distance'
        
        -- Strategy 7: N-gram similarity (bigram for short, trigram for long)
        WHEN query_length <= 5 AND ngram_similarity_enhanced(usp.name, search_query, 2) >= 0.3 THEN 'bigram'
        WHEN query_length > 5 AND similarity(usp.name_lowercase, normalized_query) >= 0.25 THEN 'trigram'
        
        -- Strategy 8: Phonetic match
        WHEN phonetic_match(usp.name, search_query) THEN 'phonetic'
        
        -- Strategy 9: FTS match
        WHEN query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query) THEN 'fts'
        
        ELSE 'fuzzy'
      END as match_type,
      CASE
        -- Scoring based on match type and quality
        WHEN usp.name_lowercase = normalized_query THEN 1.0
        WHEN usp.name_lowercase LIKE normalized_query || '%' THEN 0.95
        WHEN usp.name_lowercase LIKE '%' || normalized_query || '%' THEN 0.9
        WHEN query_length <= 3 AND char_sequence_match(usp.name, search_query) THEN 0.85
        WHEN token_match_score(usp.name, search_query) >= 0.7 THEN token_match_score(usp.name, search_query) * 0.9
        WHEN levenshtein_distance(usp.name_lowercase, normalized_query) <= edit_distance_threshold THEN 
          0.8 - (levenshtein_distance(usp.name_lowercase, normalized_query)::FLOAT * 0.1)
        WHEN query_length <= 5 AND ngram_similarity_enhanced(usp.name, search_query, 2) >= 0.3 THEN 
          ngram_similarity_enhanced(usp.name, search_query, 2) * 0.75
        WHEN query_length > 5 AND similarity(usp.name_lowercase, normalized_query) >= 0.25 THEN 
          similarity(usp.name_lowercase, normalized_query) * 0.7
        WHEN phonetic_match(usp.name, search_query) THEN 0.5
        WHEN query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query) THEN 0.4
        ELSE 0.3
      END * usp.relevance_boost as relevance_score,
      false as is_suggestion,
      usp.avatar,
      usp.bio,
      usp.role,
      usp.follower_count,
      usp.campaign_count
    FROM user_search_projection usp
    WHERE
      -- Multi-strategy filtering
      usp.name_lowercase = normalized_query
      OR usp.name_lowercase LIKE normalized_query || '%'
      OR usp.name_lowercase LIKE '%' || normalized_query || '%'
      OR (query_length <= 3 AND char_sequence_match(usp.name, search_query))
      OR token_match_score(usp.name, search_query) >= 0.7
      OR levenshtein_distance(usp.name_lowercase, normalized_query) <= edit_distance_threshold
      OR (query_length <= 5 AND ngram_similarity_enhanced(usp.name, search_query, 2) >= 0.3)
      OR (query_length > 5 AND similarity(usp.name_lowercase, normalized_query) >= 0.25)
      OR phonetic_match(usp.name, search_query)
      OR (query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query))
      OR COALESCE(usp.bio, '') LIKE '%' || normalized_query || '%'
      OR COALESCE(usp.location, '') LIKE '%' || normalized_query || '%'
  )
  SELECT * FROM ranked_results
  ORDER BY relevance_score DESC, match_name ASC
  LIMIT max_results;
END;
$$;

COMMENT ON FUNCTION enhanced_fuzzy_search_users IS 
'Multi-strategy fuzzy search using projections:
- Exact, prefix, substring matching
- Character sequence for short queries
- Token-based matching for multi-word names
- Edit distance (Levenshtein) with dynamic thresholds
- N-gram similarity (bigram/trigram)
- Phonetic matching (Soundex, Metaphone)
- Full-text search
- Never queries profiles table directly';

-- =====================================================
-- 6. RLS POLICIES FOR PROJECTIONS
-- =====================================================

ALTER TABLE user_search_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read search projections (they only contain public profiles)
CREATE POLICY "Search projections are publicly readable"
  ON user_search_projection FOR SELECT
  USING (true);

CREATE POLICY "Search suggestions are publicly readable"
  ON search_suggestions_projection FOR SELECT
  USING (true);

CREATE POLICY "Search cache is publicly readable"
  ON search_results_cache FOR SELECT
  USING (true);

-- Only system can write to projections
CREATE POLICY "System can manage search projections"
  ON user_search_projection FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can manage search suggestions"
  ON search_suggestions_projection FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can manage search cache"
  ON search_results_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');