-- =====================================================
-- Fix: Allow anonymous users to see fundraiser stats
-- =====================================================

-- Drop existing view (it's not working for anon users anyway)
DROP VIEW IF EXISTS public.public_fundraiser_stats CASCADE;

-- Create security definer function to aggregate stats
-- This bypasses RLS but only returns public fundraiser data
CREATE OR REPLACE FUNCTION public.get_public_fundraiser_stats()
RETURNS TABLE (
  fundraiser_id uuid,
  title text,
  goal_amount numeric,
  currency text,
  status fundraiser_status,
  visibility visibility_type,
  created_at timestamptz,
  end_date date,
  total_raised numeric,
  donor_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    f.id AS fundraiser_id,
    f.title,
    f.goal_amount,
    f.currency,
    f.status,
    f.visibility,
    f.created_at,
    f.end_date,
    -- Aggregate donations (bypasses RLS via SECURITY DEFINER)
    COALESCE(SUM(d.amount), 0) AS total_raised,
    COUNT(DISTINCT d.donor_user_id) AS donor_count
  FROM fundraisers f
  LEFT JOIN donations d ON f.id = d.fundraiser_id 
    AND d.payment_status = 'paid'
  WHERE f.visibility = 'public'
    AND f.deleted_at IS NULL
    AND f.status IN ('active', 'ended', 'closed')
  GROUP BY f.id, f.title, f.goal_amount, f.currency, f.status, f.visibility, f.created_at, f.end_date;
$$;

-- Recreate view backed by security definer function
CREATE VIEW public.public_fundraiser_stats AS
SELECT * FROM public.get_public_fundraiser_stats();

-- Grant SELECT to anonymous and authenticated users
GRANT SELECT ON public.public_fundraiser_stats TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_public_fundraiser_stats() IS 
'Security definer function that returns aggregated stats for public fundraisers. Safe to expose to anonymous users as it only returns public data.';

COMMENT ON VIEW public.public_fundraiser_stats IS 
'Public view of fundraiser statistics. Accessible by anonymous users for displaying campaign cards.';