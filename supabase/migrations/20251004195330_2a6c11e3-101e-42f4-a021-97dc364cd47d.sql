-- Fix fuzzy search functions to work with extensions in the extensions schema
-- Update the search_path to include extensions schema

-- Update calculate_similarity function to use explicit schema
CREATE OR REPLACE FUNCTION calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
BEGIN
  RETURN similarity(LOWER(text1), LOWER(text2));
END;
$$;

-- Update phonetic_match function to use explicit schema
CREATE OR REPLACE FUNCTION phonetic_match(text1 TEXT, text2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
BEGIN
  RETURN 
    soundex(text1) = soundex(text2) OR
    metaphone(text1, 8) = metaphone(text2, 8) OR
    dmetaphone(text1) = dmetaphone(text2) OR
    dmetaphone_alt(text1) = dmetaphone_alt(text2);
END;
$$;

-- Update fuzzy_search_users function to use explicit schema for extensions
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
SET search_path = extensions, public
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