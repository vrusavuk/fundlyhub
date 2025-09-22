-- Drop and recreate get_category_stats function with closed campaigns
DROP FUNCTION IF EXISTS public.get_category_stats();

CREATE OR REPLACE FUNCTION public.get_category_stats()
 RETURNS TABLE(category_id uuid, category_name text, emoji text, color_class text, active_campaigns bigint, closed_campaigns bigint, total_raised numeric, campaign_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.emoji,
    c.color_class,
    COUNT(f.id) FILTER (WHERE f.status = 'active') as active_campaigns,
    COUNT(f.id) FILTER (WHERE f.status = 'closed') as closed_campaigns,
    COALESCE(SUM(pfs.total_raised) FILTER (WHERE f.status IN ('active', 'closed')), 0) as total_raised,
    COUNT(f.id) FILTER (WHERE f.status IN ('active', 'closed')) as campaign_count
  FROM public.categories c
  LEFT JOIN public.fundraisers f ON c.id = f.category_id AND f.visibility = 'public'
  LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.emoji, c.color_class, c.display_order
  ORDER BY c.display_order;
END;
$function$