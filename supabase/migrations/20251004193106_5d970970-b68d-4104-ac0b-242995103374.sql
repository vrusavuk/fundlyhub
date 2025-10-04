-- Fix security warnings by setting search_path on FTS trigger functions

-- Recreate fundraiser fts function with search_path
CREATE OR REPLACE FUNCTION public.update_fundraiser_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.beneficiary_name, '')), 'C') ||
    setweight(to_tsvector('english', regexp_replace(coalesce(NEW.story_html, ''), '<[^>]*>', '', 'g')), 'D');
  RETURN NEW;
END;
$$;

-- Recreate profile fts function with search_path
CREATE OR REPLACE FUNCTION public.update_profile_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$;

-- Recreate organization fts function with search_path
CREATE OR REPLACE FUNCTION public.update_organization_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', coalesce(NEW.legal_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.dba_name, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.categories, ARRAY[]::text[]), ' ')), 'B');
  RETURN NEW;
END;
$$;