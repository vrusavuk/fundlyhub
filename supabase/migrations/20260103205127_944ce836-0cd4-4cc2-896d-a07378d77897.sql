-- Create audit table for donation reallocations
CREATE TABLE public.donation_reallocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id),
  source_fundraiser_id UUID NOT NULL,
  target_fundraiser_id UUID NOT NULL REFERENCES public.fundraisers(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  reallocated_by UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_reallocations ENABLE ROW LEVEL SECURITY;

-- Only super admins can view reallocation history
CREATE POLICY "Super admins can view reallocations"
ON public.donation_reallocations
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only the function can insert (via service role context)
CREATE POLICY "System can insert reallocations"
ON public.donation_reallocations
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR is_super_admin(auth.uid()));

-- Create index for efficient lookups
CREATE INDEX idx_donation_reallocations_donation_id ON public.donation_reallocations(donation_id);
CREATE INDEX idx_donation_reallocations_source ON public.donation_reallocations(source_fundraiser_id);
CREATE INDEX idx_donation_reallocations_target ON public.donation_reallocations(target_fundraiser_id);

-- Create secure function to reallocate a donation
CREATE OR REPLACE FUNCTION public.reallocate_donation(
  p_donation_id UUID,
  p_target_fundraiser_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_donation RECORD;
  v_target_fundraiser RECORD;
  v_source_fundraiser_id UUID;
  v_reallocation_id UUID;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied: Super admin access required');
  END IF;

  -- Validate reason
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason is required');
  END IF;

  -- Get the donation
  SELECT id, fundraiser_id, amount, currency, payment_status
  INTO v_donation
  FROM donations
  WHERE id = p_donation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Donation not found');
  END IF;

  -- Store source fundraiser ID
  v_source_fundraiser_id := v_donation.fundraiser_id;

  -- Check if source and target are the same
  IF v_source_fundraiser_id = p_target_fundraiser_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Donation is already assigned to this campaign');
  END IF;

  -- Validate target fundraiser exists
  SELECT id, title, status
  INTO v_target_fundraiser
  FROM fundraisers
  WHERE id = p_target_fundraiser_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target campaign not found');
  END IF;

  -- Update the donation's fundraiser_id
  UPDATE donations
  SET fundraiser_id = p_target_fundraiser_id
  WHERE id = p_donation_id;

  -- Create audit record
  INSERT INTO donation_reallocations (
    donation_id,
    source_fundraiser_id,
    target_fundraiser_id,
    amount,
    currency,
    reallocated_by,
    reason
  ) VALUES (
    p_donation_id,
    v_source_fundraiser_id,
    p_target_fundraiser_id,
    v_donation.amount,
    v_donation.currency,
    auth.uid(),
    p_reason
  )
  RETURNING id INTO v_reallocation_id;

  -- Log to audit_logs for visibility
  PERFORM log_audit_event(
    auth.uid(),
    'donation_reallocated',
    'donation',
    p_donation_id,
    jsonb_build_object(
      'source_fundraiser_id', v_source_fundraiser_id,
      'target_fundraiser_id', p_target_fundraiser_id,
      'amount', v_donation.amount,
      'currency', v_donation.currency,
      'reason', p_reason,
      'reallocation_id', v_reallocation_id
    )
  );

  -- Update campaign projections for source campaign (if not deleted)
  IF EXISTS (SELECT 1 FROM fundraisers WHERE id = v_source_fundraiser_id AND deleted_at IS NULL) THEN
    -- Update source campaign summary projection
    UPDATE campaign_summary_projection
    SET 
      total_raised = GREATEST(0, COALESCE(total_raised, 0) - v_donation.amount),
      donor_count = GREATEST(0, COALESCE(donor_count, 0) - 1),
      progress_percentage = CASE 
        WHEN goal_amount > 0 THEN ROUND((GREATEST(0, COALESCE(total_raised, 0) - v_donation.amount) / goal_amount) * 100, 2)
        ELSE 0
      END,
      updated_at = now()
    WHERE campaign_id = v_source_fundraiser_id;

    -- Update source campaign analytics projection
    UPDATE campaign_analytics_projection
    SET 
      total_donations = GREATEST(0, COALESCE(total_donations, 0) - v_donation.amount),
      donation_count = GREATEST(0, COALESCE(donation_count, 0) - 1),
      updated_at = now()
    WHERE campaign_id = v_source_fundraiser_id;

    -- Update source campaign stats projection
    UPDATE campaign_stats_projection
    SET 
      total_donations = GREATEST(0, COALESCE(total_donations, 0) - v_donation.amount),
      donation_count = GREATEST(0, COALESCE(donation_count, 0) - 1),
      updated_at = now()
    WHERE campaign_id = v_source_fundraiser_id;
  END IF;

  -- Update target campaign projections
  -- Update or insert target campaign summary projection
  INSERT INTO campaign_summary_projection (
    campaign_id, title, slug, goal_amount, status, visibility, 
    owner_user_id, created_at, total_raised, donor_count, progress_percentage, updated_at
  )
  SELECT 
    f.id, f.title, f.slug, f.goal_amount, f.status, f.visibility,
    f.owner_user_id, f.created_at,
    v_donation.amount, 1,
    CASE WHEN f.goal_amount > 0 THEN ROUND((v_donation.amount / f.goal_amount) * 100, 2) ELSE 0 END,
    now()
  FROM fundraisers f
  WHERE f.id = p_target_fundraiser_id
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_raised = COALESCE(campaign_summary_projection.total_raised, 0) + v_donation.amount,
    donor_count = COALESCE(campaign_summary_projection.donor_count, 0) + 1,
    progress_percentage = CASE 
      WHEN campaign_summary_projection.goal_amount > 0 
      THEN ROUND(((COALESCE(campaign_summary_projection.total_raised, 0) + v_donation.amount) / campaign_summary_projection.goal_amount) * 100, 2)
      ELSE 0
    END,
    updated_at = now();

  -- Update or insert target campaign analytics projection
  INSERT INTO campaign_analytics_projection (
    campaign_id, total_donations, donation_count, updated_at
  )
  VALUES (
    p_target_fundraiser_id, v_donation.amount, 1, now()
  )
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_donations = COALESCE(campaign_analytics_projection.total_donations, 0) + v_donation.amount,
    donation_count = COALESCE(campaign_analytics_projection.donation_count, 0) + 1,
    updated_at = now();

  -- Update or insert target campaign stats projection
  INSERT INTO campaign_stats_projection (
    campaign_id, total_donations, donation_count, updated_at
  )
  VALUES (
    p_target_fundraiser_id, v_donation.amount, 1, now()
  )
  ON CONFLICT (campaign_id) DO UPDATE SET
    total_donations = COALESCE(campaign_stats_projection.total_donations, 0) + v_donation.amount,
    donation_count = COALESCE(campaign_stats_projection.donation_count, 0) + 1,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'reallocation_id', v_reallocation_id,
    'donation_id', p_donation_id,
    'source_fundraiser_id', v_source_fundraiser_id,
    'target_fundraiser_id', p_target_fundraiser_id,
    'amount', v_donation.amount,
    'target_campaign_title', v_target_fundraiser.title
  );
END;
$$;