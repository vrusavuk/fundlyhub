-- Create RPC function to get aggregate campaign statistics with filters
CREATE OR REPLACE FUNCTION public.get_campaign_aggregate_stats(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  category_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  total_campaigns BIGINT,
  active_campaigns BIGINT,
  closed_campaigns BIGINT,
  pending_campaigns BIGINT,
  paused_campaigns BIGINT,
  draft_campaigns BIGINT,
  ended_campaigns BIGINT,
  total_raised NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(f.id)::BIGINT as total_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'active')::BIGINT as active_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'closed')::BIGINT as closed_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'pending')::BIGINT as pending_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'paused')::BIGINT as paused_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'draft')::BIGINT as draft_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'ended')::BIGINT as ended_campaigns,
    COALESCE(SUM(pfs.total_raised), 0)::NUMERIC as total_raised
  FROM fundraisers f
  LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
  WHERE 
    (search_term IS NULL OR 
     f.title ILIKE '%' || search_term || '%' OR 
     f.summary ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR f.status::TEXT = status_filter)
    AND (category_filter IS NULL OR f.category_id = category_filter);
END;
$$;