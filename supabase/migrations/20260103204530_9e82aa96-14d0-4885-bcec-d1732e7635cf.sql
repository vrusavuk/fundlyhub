-- Remove fake/test donations (those without Stripe receipt IDs)
DELETE FROM donations 
WHERE receipt_id IS NULL;

-- Update campaign_analytics_projection
UPDATE campaign_analytics_projection cap
SET 
  total_donations = COALESCE((
    SELECT SUM(d.amount) FROM donations d 
    WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'
  ), 0),
  donation_count = COALESCE((
    SELECT COUNT(*) FROM donations d 
    WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'
  ), 0),
  unique_donors = COALESCE((
    SELECT COUNT(DISTINCT d.donor_user_id) FROM donations d 
    WHERE d.fundraiser_id = cap.campaign_id AND d.donor_user_id IS NOT NULL AND d.payment_status = 'paid'
  ), 0),
  average_donation = CASE 
    WHEN COALESCE((SELECT COUNT(*) FROM donations d WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'), 0) > 0
    THEN COALESCE((SELECT SUM(d.amount) FROM donations d WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'), 0) /
         COALESCE((SELECT COUNT(*) FROM donations d WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'), 1)
    ELSE 0
  END,
  last_donation_at = (
    SELECT MAX(d.created_at) FROM donations d 
    WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'
  ),
  first_donation_at = (
    SELECT MIN(d.created_at) FROM donations d 
    WHERE d.fundraiser_id = cap.campaign_id AND d.payment_status = 'paid'
  ),
  updated_at = NOW();

-- Update campaign_summary_projection (excluding generated column progress_percentage)
UPDATE campaign_summary_projection csp
SET 
  total_raised = COALESCE((
    SELECT SUM(d.amount) FROM donations d 
    WHERE d.fundraiser_id = csp.campaign_id AND d.payment_status = 'paid'
  ), 0),
  donor_count = COALESCE((
    SELECT COUNT(*) FROM donations d 
    WHERE d.fundraiser_id = csp.campaign_id AND d.payment_status = 'paid'
  ), 0),
  last_donation_at = (
    SELECT MAX(d.created_at) FROM donations d 
    WHERE d.fundraiser_id = csp.campaign_id AND d.payment_status = 'paid'
  ),
  updated_at = NOW();

-- Update campaign_stats_projection
UPDATE campaign_stats_projection cst
SET 
  total_donations = COALESCE((
    SELECT SUM(d.amount) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'
  ), 0),
  donation_count = COALESCE((
    SELECT COUNT(*) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'
  ), 0),
  unique_donors = COALESCE((
    SELECT COUNT(DISTINCT d.donor_user_id) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.donor_user_id IS NOT NULL AND d.payment_status = 'paid'
  ), 0),
  average_donation = CASE 
    WHEN COALESCE((SELECT COUNT(*) FROM donations d WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'), 0) > 0
    THEN COALESCE((SELECT SUM(d.amount) FROM donations d WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'), 0) /
         COALESCE((SELECT COUNT(*) FROM donations d WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'), 1)
    ELSE 0
  END,
  peak_donation_amount = COALESCE((
    SELECT MAX(d.amount) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'
  ), 0),
  last_donation_at = (
    SELECT MAX(d.created_at) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'
  ),
  first_donation_at = (
    SELECT MIN(d.created_at) FROM donations d 
    WHERE d.fundraiser_id = cst.campaign_id AND d.payment_status = 'paid'
  ),
  updated_at = NOW();

-- Update donor_history_projection
UPDATE donor_history_projection dhp
SET 
  total_donated = COALESCE((
    SELECT SUM(d.amount) FROM donations d 
    WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'
  ), 0),
  donation_count = COALESCE((
    SELECT COUNT(*) FROM donations d 
    WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'
  ), 0),
  campaigns_supported = COALESCE((
    SELECT COUNT(DISTINCT d.fundraiser_id) FROM donations d 
    WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'
  ), 0),
  average_donation = CASE 
    WHEN COALESCE((SELECT COUNT(*) FROM donations d WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'), 0) > 0
    THEN COALESCE((SELECT SUM(d.amount) FROM donations d WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'), 0) /
         COALESCE((SELECT COUNT(*) FROM donations d WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'), 1)
    ELSE 0
  END,
  last_donation_at = (
    SELECT MAX(d.created_at) FROM donations d 
    WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'
  ),
  first_donation_at = (
    SELECT MIN(d.created_at) FROM donations d 
    WHERE d.donor_user_id = dhp.user_id AND d.payment_status = 'paid'
  ),
  updated_at = NOW();

-- Update user profile stats
UPDATE profiles p
SET 
  total_funds_raised = COALESCE((
    SELECT SUM(d.amount) 
    FROM donations d 
    JOIN fundraisers f ON d.fundraiser_id = f.id 
    WHERE f.owner_user_id = p.id 
    AND d.payment_status = 'paid'
  ), 0)
WHERE p.deleted_at IS NULL;