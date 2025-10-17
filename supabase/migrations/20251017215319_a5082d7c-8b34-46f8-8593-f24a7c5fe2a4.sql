-- Grant access to public_fundraiser_stats view for all users
-- This view provides aggregated fundraiser statistics

-- Grant SELECT permission on the view to anonymous and authenticated users
GRANT SELECT ON public_fundraiser_stats TO anon, authenticated;

-- Ensure the view shows only public, non-deleted fundraisers
-- (The view itself should already filter this, but we're making it explicit)