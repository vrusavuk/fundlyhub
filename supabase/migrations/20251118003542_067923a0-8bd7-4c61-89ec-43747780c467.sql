-- Drop and recreate get_user_earnings with enhanced hold breakdown
DROP FUNCTION IF EXISTS public.get_user_earnings(uuid);

CREATE FUNCTION public.get_user_earnings(_user_id uuid)
RETURNS TABLE(
  total_earnings numeric,
  total_payouts numeric,
  pending_payouts numeric,
  available_balance numeric,
  held_balance numeric,
  held_campaign_pending numeric,
  held_chargeback_reserve numeric,
  held_fraud_investigation numeric,
  held_manual numeric,
  active_holds_count integer,
  currency text,
  fundraiser_count integer,
  donation_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_fundraisers AS (
    SELECT id FROM fundraisers WHERE owner_user_id = _user_id AND deleted_at IS NULL
  ),
  earnings_data AS (
    SELECT 
      COALESCE(SUM(d.net_amount), 0) as total_earnings,
      COUNT(DISTINCT d.fundraiser_id) as fundraiser_count,
      COUNT(*) as donation_count
    FROM donations d
    WHERE d.fundraiser_id IN (SELECT id FROM user_fundraisers)
    AND d.payment_status = 'paid'
  ),
  payout_data AS (
    SELECT 
      COALESCE(SUM(pr.net_amount_str::numeric), 0) as completed_payouts
    FROM payout_requests pr
    WHERE pr.user_id = _user_id
    AND pr.status IN ('completed', 'processing')
  ),
  pending_data AS (
    SELECT 
      COALESCE(SUM(pr.net_amount_str::numeric), 0) as pending_payouts
    FROM payout_requests pr
    WHERE pr.user_id = _user_id
    AND pr.status IN ('pending', 'approved')
  ),
  hold_data AS (
    SELECT 
      COALESCE(SUM(ph.amount_held_str::numeric), 0) as total_held,
      COALESCE(SUM(ph.amount_held_str::numeric) FILTER (WHERE ph.hold_type = 'campaign_review'), 0) as campaign_pending,
      COALESCE(SUM(ph.amount_held_str::numeric) FILTER (WHERE ph.hold_type = 'chargeback_reserve'), 0) as chargeback_reserve,
      COALESCE(SUM(ph.amount_held_str::numeric) FILTER (WHERE ph.hold_type = 'fraud_investigation'), 0) as fraud_investigation,
      COALESCE(SUM(ph.amount_held_str::numeric) FILTER (WHERE ph.hold_type = 'manual'), 0) as manual_hold,
      COUNT(*)::integer as hold_count
    FROM payout_holds ph
    WHERE ph.user_id = _user_id
    AND ph.is_active = true
    AND ph.hold_until > now()
  )
  SELECT 
    e.total_earnings,
    p.completed_payouts as total_payouts,
    pd.pending_payouts,
    GREATEST(e.total_earnings - p.completed_payouts - pd.pending_payouts - h.total_held, 0) as available_balance,
    h.total_held as held_balance,
    h.campaign_pending as held_campaign_pending,
    h.chargeback_reserve as held_chargeback_reserve,
    h.fraud_investigation as held_fraud_investigation,
    h.manual_hold as held_manual,
    h.hold_count as active_holds_count,
    'USD'::text as currency,
    e.fundraiser_count::int,
    e.donation_count::int
  FROM earnings_data e, payout_data p, pending_data pd, hold_data h;
END;
$$;

-- Auto-create holds when campaigns go to pending status
CREATE OR REPLACE FUNCTION public.auto_create_campaign_status_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_donations NUMERIC;
BEGIN
  IF NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending') THEN
    SELECT COALESCE(SUM(net_amount), 0)
    INTO total_donations
    FROM donations
    WHERE fundraiser_id = NEW.id AND payment_status = 'paid';
    
    IF total_donations > 0 AND NOT EXISTS(
      SELECT 1 FROM payout_holds
      WHERE fundraiser_id = NEW.id AND hold_type = 'campaign_review' AND is_active = true
    ) THEN
      INSERT INTO payout_holds (
        user_id, fundraiser_id, hold_type, reason, amount_held_str,
        currency, hold_until, is_active, details
      ) VALUES (
        NEW.owner_user_id, NEW.id, 'campaign_review',
        'Campaign pending approval - funds held until campaign is approved',
        total_donations::text, COALESCE(NEW.currency, 'USD'),
        NOW() + INTERVAL '30 days', true,
        jsonb_build_object('campaign_title', NEW.title, 'auto_created', true)
      );
    END IF;
  END IF;
  
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    UPDATE payout_holds
    SET is_active = false, released_at = NOW()
    WHERE fundraiser_id = NEW.id AND hold_type = 'campaign_review' AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Auto-create 7-day chargeback holds on donations
CREATE OR REPLACE FUNCTION public.auto_create_chargeback_hold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campaign_owner UUID;
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.net_amount > 0 THEN
    SELECT owner_user_id INTO campaign_owner FROM fundraisers WHERE id = NEW.fundraiser_id;
    
    IF campaign_owner IS NOT NULL AND NOT EXISTS(
      SELECT 1 FROM payout_holds
      WHERE fundraiser_id = NEW.fundraiser_id AND hold_type = 'chargeback_reserve' 
      AND is_active = true AND details->>'donation_id' = NEW.id::text
    ) THEN
      INSERT INTO payout_holds (
        user_id, fundraiser_id, hold_type, reason, amount_held_str,
        currency, hold_until, is_active, details
      ) VALUES (
        campaign_owner, NEW.fundraiser_id, 'chargeback_reserve',
        'Chargeback protection - funds held for 7 days',
        NEW.net_amount::text, COALESCE(NEW.currency, 'USD'),
        NEW.created_at + INTERVAL '7 days', true,
        jsonb_build_object('donation_id', NEW.id, 'auto_created', true)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach triggers
DROP TRIGGER IF EXISTS trigger_auto_campaign_status_hold ON fundraisers;
CREATE TRIGGER trigger_auto_campaign_status_hold
  AFTER INSERT OR UPDATE OF status ON fundraisers
  FOR EACH ROW EXECUTE FUNCTION auto_create_campaign_status_hold();

DROP TRIGGER IF EXISTS trigger_auto_chargeback_hold ON donations;
CREATE TRIGGER trigger_auto_chargeback_hold
  AFTER INSERT OR UPDATE OF payment_status ON donations
  FOR EACH ROW EXECUTE FUNCTION auto_create_chargeback_hold();

-- Backfill holds for existing pending campaigns
INSERT INTO payout_holds (user_id, fundraiser_id, hold_type, reason, amount_held_str, currency, hold_until, is_active, details)
SELECT 
  f.owner_user_id, f.id, 'campaign_review',
  'Campaign pending approval - funds held (backfilled)',
  COALESCE(SUM(d.net_amount), 0)::text,
  COALESCE(f.currency, 'USD'), NOW() + INTERVAL '30 days', true,
  jsonb_build_object('campaign_title', f.title, 'backfilled_at', NOW())
FROM fundraisers f
LEFT JOIN donations d ON f.id = d.fundraiser_id AND d.payment_status = 'paid'
WHERE f.status = 'pending' AND f.deleted_at IS NULL
GROUP BY f.id, f.owner_user_id, f.currency, f.title
HAVING COALESCE(SUM(d.net_amount), 0) > 0
ON CONFLICT DO NOTHING;

-- Backfill 7-day holds for recent donations
INSERT INTO payout_holds (user_id, fundraiser_id, hold_type, reason, amount_held_str, currency, hold_until, is_active, details)
SELECT 
  f.owner_user_id, d.fundraiser_id, 'chargeback_reserve',
  'Chargeback protection (backfilled)',
  d.net_amount::text, COALESCE(d.currency, 'USD'), d.created_at + INTERVAL '7 days', true,
  jsonb_build_object('donation_id', d.id, 'backfilled_at', NOW())
FROM donations d
JOIN fundraisers f ON d.fundraiser_id = f.id
WHERE d.payment_status = 'paid' AND d.net_amount > 0 AND d.created_at > NOW() - INTERVAL '7 days'
ON CONFLICT DO NOTHING;