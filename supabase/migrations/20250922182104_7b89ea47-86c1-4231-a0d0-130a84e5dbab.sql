-- Create aggregated donation view for public fundraisers
CREATE VIEW public_fundraiser_stats AS 
SELECT 
  f.id as fundraiser_id,
  f.title,
  f.status,
  f.visibility,
  COALESCE(SUM(d.amount), 0) as total_raised,
  COUNT(d.id) FILTER (WHERE d.payment_status = 'paid') as donor_count,
  f.goal_amount,
  f.currency,
  f.created_at,
  f.end_date
FROM fundraisers f 
LEFT JOIN donations d ON f.id = d.fundraiser_id AND d.payment_status = 'paid'
WHERE f.visibility = 'public' 
GROUP BY f.id, f.title, f.status, f.visibility, f.goal_amount, f.currency, f.created_at, f.end_date;

-- Create function to get campaign statistics efficiently
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get donation totals for specific fundraisers
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
$$ LANGUAGE plpgsql SECURITY DEFINER;