-- Fix levenshtein_distance and simplify enhanced_fuzzy_search_users

-- Drop the buggy custom levenshtein function and replace with fuzzystrmatch extension
DROP FUNCTION IF EXISTS public.levenshtein_distance(text, text);

-- Use the built-in levenshtein from fuzzystrmatch extension
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Simplified enhanced_fuzzy_search_users with only reliable strategies
CREATE OR REPLACE FUNCTION public.enhanced_fuzzy_search_users(
  search_query text,
  max_results integer DEFAULT 50,
  include_suggestions boolean DEFAULT true
)
RETURNS TABLE(
  user_id uuid,
  match_name text,
  match_type text,
  relevance_score double precision,
  is_suggestion boolean,
  avatar text,
  bio text,
  role user_role,
  follower_count integer,
  campaign_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'extensions', 'public'
AS $function$
DECLARE
  query_length INTEGER;
  normalized_query TEXT;
BEGIN
  query_length := LENGTH(TRIM(search_query));
  normalized_query := LOWER(TRIM(search_query));
  
  -- Early exit for empty queries
  IF query_length = 0 THEN
    RETURN;
  END IF;
  
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
        
        -- Strategy 3: Substring match
        WHEN usp.name_lowercase LIKE '%' || normalized_query || '%' THEN 'substring'
        
        -- Strategy 4: Trigram similarity (using pg_trgm)
        WHEN similarity(usp.name_lowercase, normalized_query) >= 0.3 THEN 'similar'
        
        -- Strategy 5: Full-text search
        WHEN query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query) THEN 'fts'
        
        ELSE 'fuzzy'
      END as match_type,
      CASE
        -- Exact match gets highest score
        WHEN usp.name_lowercase = normalized_query THEN 1.0
        
        -- Prefix match gets very high score
        WHEN usp.name_lowercase LIKE normalized_query || '%' THEN 0.95
        
        -- Substring match
        WHEN usp.name_lowercase LIKE '%' || normalized_query || '%' THEN 0.9
        
        -- Trigram similarity (scaled)
        WHEN similarity(usp.name_lowercase, normalized_query) >= 0.3 THEN 
          similarity(usp.name_lowercase, normalized_query) * 0.85
        
        -- FTS match
        WHEN query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query) THEN 0.6
        
        ELSE 0.5
      END * usp.relevance_boost as relevance_score,
      false as is_suggestion,
      usp.avatar,
      usp.bio,
      usp.role,
      usp.follower_count,
      usp.campaign_count
    FROM user_search_projection usp
    WHERE
      -- Multi-strategy filtering (simplified)
      usp.name_lowercase = normalized_query
      OR usp.name_lowercase LIKE normalized_query || '%'
      OR usp.name_lowercase LIKE '%' || normalized_query || '%'
      OR similarity(usp.name_lowercase, normalized_query) >= 0.3
      OR (query_length >= 3 AND usp.search_vector @@ plainto_tsquery('english', search_query))
      OR COALESCE(usp.bio, '') LIKE '%' || normalized_query || '%'
      OR COALESCE(usp.location, '') LIKE '%' || normalized_query || '%'
  )
  SELECT * FROM ranked_results
  ORDER BY relevance_score DESC, match_name ASC
  LIMIT max_results;
END;
$function$;

-- Drop unused/buggy helper functions
DROP FUNCTION IF EXISTS public.char_sequence_match(text, text);
DROP FUNCTION IF EXISTS public.token_match_score(text, text);
DROP FUNCTION IF EXISTS public.ngram_similarity_enhanced(text, text, integer);

-- Keep phonetic_match but simplify it
CREATE OR REPLACE FUNCTION public.phonetic_match(text1 text, text2 text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'extensions', 'public'
AS $function$
BEGIN
  RETURN soundex(text1) = soundex(text2);
END;
$function$;