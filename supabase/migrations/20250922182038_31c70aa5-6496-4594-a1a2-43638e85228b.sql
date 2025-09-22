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

-- Enable RLS on the view
ALTER VIEW public_fundraiser_stats ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for public access to this view
CREATE POLICY "Public fundraiser stats viewable by everyone" ON public_fundraiser_stats
FOR SELECT USING (true);

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