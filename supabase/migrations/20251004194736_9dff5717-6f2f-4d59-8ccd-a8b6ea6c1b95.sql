-- Enable fuzzy search extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Function: Calculate trigram similarity score (0-1 scale)
CREATE OR REPLACE FUNCTION calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN similarity(LOWER(text1), LOWER(text2));
END;
$$;

-- Function: Phonetic matching using Soundex and Metaphone
CREATE OR REPLACE FUNCTION phonetic_match(text1 TEXT, text2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN 
    soundex(text1) = soundex(text2) OR
    metaphone(text1, 8) = metaphone(text2, 8) OR
    dmetaphone(text1) = dmetaphone(text2) OR
    dmetaphone_alt(text1) = dmetaphone_alt(text2);
END;
$$;

-- Function: Composite fuzzy search for users
CREATE OR REPLACE FUNCTION fuzzy_search_users(search_query TEXT, similarity_threshold FLOAT DEFAULT 0.3)
RETURNS TABLE(
  user_id UUID,
  match_name TEXT,
  match_type TEXT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as user_id,
    p.name as match_name,
    CASE
      WHEN p.name ILIKE '%' || search_query || '%' THEN 'exact'
      WHEN similarity(LOWER(p.name), LOWER(search_query)) >= similarity_threshold THEN 'similar'
      WHEN phonetic_match(p.name, search_query) THEN 'phonetic'
      ELSE 'fuzzy'
    END as match_type,
    CASE
      WHEN p.name ILIKE '%' || search_query || '%' THEN 1.0
      WHEN similarity(LOWER(p.name), LOWER(search_query)) >= similarity_threshold 
        THEN similarity(LOWER(p.name), LOWER(search_query)) * 0.9
      WHEN phonetic_match(p.name, search_query) THEN 0.5
      ELSE 0.3
    END as relevance_score
  FROM profiles p
  WHERE 
    p.profile_visibility = 'public'
    AND p.account_status = 'active'
    AND p.deleted_at IS NULL
    AND (
      -- FTS match
      p.fts @@ plainto_tsquery('english', search_query)
      -- Trigram similarity
      OR similarity(LOWER(p.name), LOWER(search_query)) >= similarity_threshold
      -- ILIKE fallback
      OR p.name ILIKE '%' || search_query || '%'
      OR COALESCE(p.bio, '') ILIKE '%' || search_query || '%'
      OR COALESCE(p.location, '') ILIKE '%' || search_query || '%'
      -- Phonetic match
      OR phonetic_match(p.name, search_query)
    )
  ORDER BY relevance_score DESC
  LIMIT 50;
END;
$$;

-- Create GIN indexes for trigram operations on profiles.name
CREATE INDEX IF NOT EXISTS profiles_name_trgm_idx ON profiles USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_name_lower_trgm_idx ON profiles USING GIN (LOWER(name) gin_trgm_ops);

-- Create GIN index for bio and location trigram search
CREATE INDEX IF NOT EXISTS profiles_bio_trgm_idx ON profiles USING GIN (bio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_location_trgm_idx ON profiles USING GIN (location gin_trgm_ops);

-- Comment documentation
COMMENT ON FUNCTION calculate_similarity IS 'Returns trigram similarity score between two text strings (0-1 scale)';
COMMENT ON FUNCTION phonetic_match IS 'Returns true if two text strings match phonetically using Soundex, Metaphone, or Double Metaphone';
COMMENT ON FUNCTION fuzzy_search_users IS 'Performs fuzzy search on user profiles using FTS, trigram similarity, and phonetic matching';