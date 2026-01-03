-- Fix donor_count to include anonymous donations
-- Previously used COUNT(DISTINCT donor_user_id) which excluded NULL values (anonymous donations)
-- Now using COUNT(d.id) to count ALL donation records

CREATE OR REPLACE FUNCTION public.get_public_fundraiser_stats()
 RETURNS TABLE(fundraiser_id uuid, title text, goal_amount numeric, currency text, status fundraiser_status, visibility visibility_type, created_at timestamp with time zone, end_date date, total_raised numeric, donor_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Count ALL donations including anonymous (d.id is never null)
    COUNT(d.id) AS donor_count
  FROM fundraisers f
  LEFT JOIN donations d ON f.id = d.fundraiser_id 
    AND d.payment_status = 'paid'
  WHERE f.visibility = 'public'
    AND f.deleted_at IS NULL
    AND f.status IN ('active', 'ended', 'closed')
  GROUP BY f.id, f.title, f.goal_amount, f.currency, f.status, f.visibility, f.created_at, f.end_date;
$function$;