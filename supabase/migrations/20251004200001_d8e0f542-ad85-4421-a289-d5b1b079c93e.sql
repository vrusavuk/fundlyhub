-- Enhance fuzzy_search_users with flexible character sequence matching for very short queries
-- This helps match "liu" to "Luibov" by checking if query characters appear in order

-- Helper function for flexible character sequence matching
CREATE OR REPLACE FUNCTION char_sequence_match(name_text TEXT, query_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
DECLARE
  name_lower TEXT;
  query_lower TEXT;
  name_pos INT := 1;
  query_pos INT := 1;
  query_len INT;
  name_len INT;
  max_gap INT := 2; -- Allow up to 2 characters between matched characters
  current_gap INT := 0;
BEGIN
  name_lower := LOWER(name_text);
  query_lower := LOWER(query_text);
  query_len := LENGTH(query_lower);
  name_len := LENGTH(name_lower);
  
  -- For queries <= 3 chars, check if chars appear in sequence at the start of name
  IF query_len <= 3 THEN
    WHILE query_pos <= query_len AND name_pos <= name_len LOOP
      IF SUBSTRING(query_lower, query_pos, 1) = SUBSTRING(name_lower, name_pos, 1) THEN
        query_pos := query_pos + 1;
        current_gap := 0; -- Reset gap counter on match
      ELSE
        current_gap := current_gap + 1;
        IF current_gap > max_gap THEN
          RETURN FALSE; -- Too many non-matching chars
        END IF;
      END IF;
      name_pos := name_pos + 1;
    END LOOP;
    
    RETURN query_pos > query_len; -- All query chars were found
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update fuzzy_search_users to use character sequence matching
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
    adjusted_threshold := 0.1;  -- Very permissive for short queries
  ELSIF query_length <= 5 THEN
    adjusted_threshold := 0.2;
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
      -- Flexible character sequence match for short queries
      WHEN query_length <= 3 AND char_sequence_match(p.name, search_query) THEN 'sequence'
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
      -- Character sequence match for short queries
      WHEN query_length <= 3 AND char_sequence_match(p.name, search_query) THEN 0.9
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
      -- Character sequence match for very short queries
      OR (query_length <= 3 AND char_sequence_match(p.name, search_query))
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