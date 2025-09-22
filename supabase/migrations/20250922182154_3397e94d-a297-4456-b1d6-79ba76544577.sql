-- Update functions to fix search path security warnings
CREATE OR REPLACE FUNCTION get_campaign_stats()
RETURNS TABLE(
  active_campaigns bigint,
  closed_campaigns bigint,
  total_funds_raised numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_campaigns,
    COALESCE(SUM(total_raised), 0) as total_funds_raised
  FROM public_fundraiser_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update function with search path
CREATE OR REPLACE FUNCTION get_fundraiser_totals(fundraiser_ids UUID[])
RETURNS TABLE(
  fundraiser_id UUID,
  total_raised numeric,
  donor_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pfs.fundraiser_id,
    pfs.total_raised,
    pfs.donor_count
  FROM public_fundraiser_stats pfs
  WHERE pfs.fundraiser_id = ANY(fundraiser_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;