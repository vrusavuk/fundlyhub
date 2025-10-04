-- Improve fuzzy_search_users to handle short queries and partial name matches
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
DECLARE
  query_length INT;
  adjusted_threshold FLOAT;
BEGIN
  -- Adjust similarity threshold based on query length
  query_length := LENGTH(TRIM(search_query));
  
  -- Shorter queries need lower thresholds for trigram matching
  IF query_length <= 3 THEN
    adjusted_threshold := 0.15;  -- Very permissive for short queries
  ELSIF query_length <= 5 THEN
    adjusted_threshold := 0.25;
  ELSE
    adjusted_threshold := similarity_threshold;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    p.id as user_id,
    p.name as match_name,
    CASE
      -- Exact substring match (case insensitive)
      WHEN LOWER(p.name) LIKE '%' || LOWER(search_query) || '%' THEN 'exact'
      -- High similarity match
      WHEN similarity(LOWER(p.name), LOWER(search_query)) >= adjusted_threshold THEN 'similar'
      -- Phonetic match
      WHEN phonetic_match(p.name, search_query) THEN 'phonetic'
      -- Word start match (name starts with query)
      WHEN LOWER(p.name) LIKE LOWER(search_query) || '%' THEN 'prefix'
      ELSE 'fuzzy'
    END as match_type,
    CASE
      -- Exact substring match gets highest score
      WHEN LOWER(p.name) LIKE '%' || LOWER(search_query) || '%' THEN 1.0
      -- Word start match gets very high score
      WHEN LOWER(p.name) LIKE LOWER(search_query) || '%' THEN 0.95
      -- Trigram similarity scaled by match quality
      WHEN similarity(LOWER(p.name), LOWER(search_query)) >= adjusted_threshold 
        THEN similarity(LOWER(p.name), LOWER(search_query)) * 0.9
      -- Phonetic match
      WHEN phonetic_match(p.name, search_query) THEN 0.5
      ELSE 0.3
    END as relevance_score
  FROM profiles p
  WHERE 
    p.profile_visibility = 'public'
    AND p.account_status = 'active'
    AND p.deleted_at IS NULL
    AND (
      -- FTS match (only for longer queries)
      (query_length >= 3 AND p.fts @@ plainto_tsquery('english', search_query))
      -- Trigram similarity with adjusted threshold
      OR similarity(LOWER(p.name), LOWER(search_query)) >= adjusted_threshold
      -- Substring match (case insensitive) - critical for short queries
      OR LOWER(p.name) LIKE '%' || LOWER(search_query) || '%'
      -- Also check bio and location with ILIKE
      OR COALESCE(LOWER(p.bio), '') LIKE '%' || LOWER(search_query) || '%'
      OR COALESCE(LOWER(p.location), '') LIKE '%' || LOWER(search_query) || '%'
      -- Phonetic match
      OR phonetic_match(p.name, search_query)
    )
  ORDER BY relevance_score DESC, p.name ASC
  LIMIT 50;
END;
$$;