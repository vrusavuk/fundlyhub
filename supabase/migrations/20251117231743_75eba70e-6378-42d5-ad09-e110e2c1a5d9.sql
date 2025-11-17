-- Create RPC function to get user earnings across all fundraisers
-- This is the SINGLE SOURCE OF TRUTH for user earnings data

CREATE OR REPLACE FUNCTION get_user_earnings(_user_id UUID)
RETURNS TABLE (
  total_earnings NUMERIC,
  total_payouts NUMERIC,
  pending_payouts NUMERIC,
  available_balance NUMERIC,
  held_balance NUMERIC,
  currency TEXT,
  fundraiser_count INT,
  donation_count INT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_fundraisers AS (
    -- Get all fundraisers owned by user
    SELECT id FROM fundraisers WHERE owner_user_id = _user_id AND deleted_at IS NULL
  ),
  earnings_data AS (
    -- Calculate total earnings from paid donations
    SELECT 
      COALESCE(SUM(d.net_amount), 0) as total_earnings,
      COUNT(DISTINCT d.fundraiser_id) as fundraiser_count,
      COUNT(*) as donation_count
    FROM donations d
    WHERE d.fundraiser_id IN (SELECT id FROM user_fundraisers)
    AND d.payment_status = 'paid'
  ),
  payout_data AS (
    -- Calculate completed payouts
    SELECT 
      COALESCE(SUM(pr.net_amount_str::numeric), 0) as completed_payouts
    FROM payout_requests pr
    WHERE pr.user_id = _user_id
    AND pr.status IN ('completed', 'processing')
  ),
  pending_data AS (
    -- Calculate pending payout requests
    SELECT 
      COALESCE(SUM(pr.net_amount_str::numeric), 0) as pending_payouts
    FROM payout_requests pr
    WHERE pr.user_id = _user_id
    AND pr.status IN ('pending', 'approved')
  ),
  hold_data AS (
    -- Calculate held amounts
    SELECT 
      COALESCE(SUM(ph.amount_held_str::numeric), 0) as held_balance
    FROM payout_holds ph
    WHERE ph.user_id = _user_id
    AND ph.is_active = true
    AND ph.hold_until > now()
  )
  SELECT 
    e.total_earnings,
    p.completed_payouts as total_payouts,
    pd.pending_payouts,
    GREATEST(e.total_earnings - p.completed_payouts - pd.pending_payouts - h.held_balance, 0) as available_balance,
    h.held_balance as held_balance,
    'USD'::text as currency,
    e.fundraiser_count::int,
    e.donation_count::int
  FROM earnings_data e, payout_data p, pending_data pd, hold_data h;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;