-- Move extensions from public schema to extensions schema (Supabase best practice)
-- This resolves the "extension in public" security warnings

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION fuzzystrmatch SET SCHEMA extensions;