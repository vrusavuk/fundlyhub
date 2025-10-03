-- =====================================================
-- SECURITY FIXES - Restrict API access to views
-- =====================================================

-- Revoke public access from materialized views
REVOKE ALL ON searchable_content FROM anon, authenticated;
REVOKE ALL ON event_statistics FROM anon, authenticated;

-- Grant access only through specific functions
GRANT SELECT ON searchable_content TO service_role;
GRANT SELECT ON event_statistics TO service_role;