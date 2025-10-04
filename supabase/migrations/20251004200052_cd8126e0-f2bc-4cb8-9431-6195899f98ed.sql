-- Fix char_sequence_match to handle characters in any order for very short queries
-- This allows "liu" to match "Luibov" (which has L, u, i near the start)

CREATE OR REPLACE FUNCTION char_sequence_match(name_text TEXT, query_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = extensions, public
AS $$
DECLARE
  name_lower TEXT;
  query_lower TEXT;
  query_len INT;
  name_prefix TEXT;
  i INT;
  query_char TEXT;
BEGIN
  name_lower := LOWER(name_text);
  query_lower := LOWER(query_text);
  query_len := LENGTH(query_lower);
  
  -- For very short queries (≤3 chars), check if all query chars appear 
  -- in the first few characters of the name (allowing for flexible order)
  IF query_len <= 3 THEN
    -- Look at first (query_len * 3) characters of name to find all query chars
    name_prefix := SUBSTRING(name_lower, 1, LEAST(query_len * 3, LENGTH(name_lower)));
    
    -- Check if ALL characters from query appear in the prefix
    FOR i IN 1..query_len LOOP
      query_char := SUBSTRING(query_lower, i, 1);
      IF POSITION(query_char IN name_prefix) = 0 THEN
        RETURN FALSE;  -- Query char not found in name prefix
      END IF;
    END LOOP;
    
    -- All query characters found in the prefix
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Also add a comment to the fuzzy_search_users function
COMMENT ON FUNCTION fuzzy_search_users IS 
'Fuzzy search for users with multiple matching strategies:
- For queries ≤3 chars: uses flexible character matching (chars can appear in any order)
- For queries >3 chars: uses trigram similarity, FTS, and phonetic matching
- Returns up to 50 results ordered by relevance';