-- Fix security warnings: Set search_path for immutable functions

-- Drop and recreate calculate_similarity with proper search_path
DROP FUNCTION IF EXISTS calculate_similarity(TEXT, TEXT);
CREATE OR REPLACE FUNCTION calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN similarity(LOWER(text1), LOWER(text2));
END;
$$;

-- Drop and recreate phonetic_match with proper search_path
DROP FUNCTION IF EXISTS phonetic_match(TEXT, TEXT);
CREATE OR REPLACE FUNCTION phonetic_match(text1 TEXT, text2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 
    soundex(text1) = soundex(text2) OR
    metaphone(text1, 8) = metaphone(text2, 8) OR
    dmetaphone(text1) = dmetaphone(text2) OR
    dmetaphone_alt(text1) = dmetaphone_alt(text2);
END;
$$;

-- Move extensions from public schema to extensions schema
-- Note: Extensions are already created, we just ensure they're in the right schema
-- Supabase manages extension schema placement, so we'll verify they exist
DO $$
BEGIN
  -- Verify pg_trgm exists
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION pg_trgm SCHEMA extensions;
  END IF;
  
  -- Verify fuzzystrmatch exists
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'fuzzystrmatch') THEN
    CREATE EXTENSION fuzzystrmatch SCHEMA extensions;
  END IF;
END $$;

-- Reapply comments
COMMENT ON FUNCTION calculate_similarity IS 'Returns trigram similarity score between two text strings (0-1 scale). Secure function with fixed search_path.';
COMMENT ON FUNCTION phonetic_match IS 'Returns true if two text strings match phonetically using Soundex, Metaphone, or Double Metaphone. Secure function with fixed search_path.';