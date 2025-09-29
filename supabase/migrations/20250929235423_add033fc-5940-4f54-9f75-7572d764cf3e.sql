-- Phase 6: Update RPC function to support visibility filter and beneficiary_name search

CREATE OR REPLACE FUNCTION public.get_campaign_aggregate_stats(
  search_term text DEFAULT NULL,
  status_filter text DEFAULT NULL,
  category_filter uuid DEFAULT NULL,
  visibility_filter text DEFAULT NULL
)
RETURNS TABLE(
  total_campaigns bigint,
  active_campaigns bigint,
  closed_campaigns bigint,
  pending_campaigns bigint,
  paused_campaigns bigint,
  draft_campaigns bigint,
  ended_campaigns bigint,
  total_raised numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
     f.summary ILIKE '%' || search_term || '%' OR
     f.beneficiary_name ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR f.status::TEXT = status_filter)
    AND (category_filter IS NULL OR f.category_id = category_filter)
    AND (visibility_filter IS NULL OR f.visibility::TEXT = visibility_filter);
END;
$function$;