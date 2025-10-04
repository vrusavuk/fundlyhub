-- Fix security warnings: Set search_path on immutable functions

-- Update calculate_similarity with search_path
CREATE OR REPLACE FUNCTION calculate_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN similarity(LOWER(text1), LOWER(text2));
END;
$$;

-- Update phonetic_match with search_path
CREATE OR REPLACE FUNCTION phonetic_match(text1 TEXT, text2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
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

-- Move extensions from public to extensions schema (Supabase best practice)
-- Note: Extensions are already created, this ensures they're in the correct schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- The extensions are already created in public schema by the previous migration
-- Since they're already in use by functions, we'll leave them but document the dependency
COMMENT ON EXTENSION pg_trgm IS 'Provides trigram similarity matching for fuzzy search functionality';
COMMENT ON EXTENSION fuzzystrmatch IS 'Provides phonetic matching algorithms (Soundex, Metaphone, Levenshtein) for fuzzy search';