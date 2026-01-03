-- Create sync_campaign_summary_totals function to keep totals consistent
-- progress_percentage is a generated column - do NOT insert/update it directly
CREATE OR REPLACE FUNCTION public.sync_campaign_summary_totals(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_raised NUMERIC;
  v_donor_count BIGINT;
  v_last_donation_at TIMESTAMPTZ;
BEGIN
  -- Get accurate totals from donations table directly
  SELECT 
    COALESCE(SUM(d.amount), 0),
    COUNT(d.id),
    MAX(d.created_at)
  INTO v_total_raised, v_donor_count, v_last_donation_at
  FROM donations d
  WHERE d.fundraiser_id = p_campaign_id
    AND d.payment_status = 'paid';
  
  -- Update campaign_summary_projection (progress_percentage is auto-generated)
  UPDATE campaign_summary_projection
  SET 
    total_raised = v_total_raised,
    donor_count = v_donor_count::integer,
    last_donation_at = v_last_donation_at,
    updated_at = now()
  WHERE campaign_id = p_campaign_id;
  
  -- If no row was updated, the projection doesn't exist - create it
  IF NOT FOUND THEN
    INSERT INTO campaign_summary_projection (
      campaign_id, title, slug, summary, cover_image, goal_amount,
      total_raised, donor_count, status, visibility,
      category_id, owner_user_id, owner_name, owner_avatar, org_id, org_name,
      created_at, end_date, days_remaining, last_donation_at
    )
    SELECT 
      f.id,
      f.title,
      f.slug,
      f.summary,
      f.cover_image,
      f.goal_amount,
      v_total_raised,
      v_donor_count::integer,
      f.status,
      f.visibility,
      f.category_id,
      f.owner_user_id,
      p.name,
      p.avatar,
      f.org_id,
      COALESCE(o.dba_name, o.legal_name),
      f.created_at,
      f.end_date,
      CASE WHEN f.end_date IS NOT NULL THEN 
        GREATEST(0, EXTRACT(DAY FROM (f.end_date::timestamp - now()))::integer)
      ELSE NULL END,
      v_last_donation_at
    FROM fundraisers f
    LEFT JOIN profiles p ON f.owner_user_id = p.id
    LEFT JOIN organizations o ON f.org_id = o.id
    WHERE f.id = p_campaign_id
    ON CONFLICT (campaign_id) DO UPDATE SET
      total_raised = EXCLUDED.total_raised,
      donor_count = EXCLUDED.donor_count,
      last_donation_at = EXCLUDED.last_donation_at,
      updated_at = now();
  END IF;
END;
$function$;

-- Backfill: Insert missing campaigns into campaign_summary_projection
-- Exclude progress_percentage (it's generated)
INSERT INTO campaign_summary_projection (
  campaign_id, title, slug, summary, cover_image, goal_amount,
  total_raised, donor_count, status, visibility,
  category_id, owner_user_id, owner_name, owner_avatar, org_id, org_name,
  created_at, end_date, days_remaining
)
SELECT 
  f.id,
  f.title,
  f.slug,
  f.summary,
  f.cover_image,
  f.goal_amount,
  COALESCE(pfs.total_raised, 0),
  COALESCE(pfs.donor_count, 0)::integer,
  f.status,
  f.visibility,
  f.category_id,
  f.owner_user_id,
  p.name,
  p.avatar,
  f.org_id,
  COALESCE(o.dba_name, o.legal_name),
  f.created_at,
  f.end_date,
  CASE WHEN f.end_date IS NOT NULL THEN 
    GREATEST(0, EXTRACT(DAY FROM (f.end_date::timestamp - now()))::integer)
  ELSE NULL END
FROM fundraisers f
LEFT JOIN profiles p ON f.owner_user_id = p.id
LEFT JOIN organizations o ON f.org_id = o.id
LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
WHERE f.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM campaign_summary_projection csp WHERE csp.campaign_id = f.id
  )
ON CONFLICT (campaign_id) DO NOTHING;

-- Backfill: Insert missing campaigns into campaign_stats_projection
INSERT INTO campaign_stats_projection (
  campaign_id, total_donations, donation_count, unique_donors, average_donation
)
SELECT 
  f.id,
  COALESCE(pfs.total_raised, 0),
  COALESCE(pfs.donor_count, 0)::integer,
  COALESCE(pfs.donor_count, 0)::integer,
  CASE WHEN COALESCE(pfs.donor_count, 0) > 0 
    THEN ROUND(COALESCE(pfs.total_raised, 0) / pfs.donor_count, 2)
    ELSE 0
  END
FROM fundraisers f
LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
WHERE f.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM campaign_stats_projection csp WHERE csp.campaign_id = f.id
  )
ON CONFLICT (campaign_id) DO NOTHING;

-- Backfill: Insert missing campaigns into campaign_search_projection
INSERT INTO campaign_search_projection (
  campaign_id, title, summary, story_text, beneficiary_name, location,
  tags, category_name, owner_name, org_name, status, visibility, created_at, slug
)
SELECT 
  f.id,
  f.title,
  f.summary,
  COALESCE(regexp_replace(f.story_html, '<[^>]*>', '', 'g'), ''),
  f.beneficiary_name,
  f.location,
  f.tags,
  c.name,
  p.name,
  COALESCE(o.dba_name, o.legal_name),
  f.status,
  f.visibility,
  f.created_at,
  f.slug
FROM fundraisers f
LEFT JOIN profiles p ON f.owner_user_id = p.id
LEFT JOIN organizations o ON f.org_id = o.id
LEFT JOIN categories c ON f.category_id = c.id
WHERE f.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM campaign_search_projection csp WHERE csp.campaign_id = f.id
  )
ON CONFLICT (campaign_id) DO NOTHING;

-- Sync all totals for existing campaigns using the new function
DO $$
DECLARE
  campaign_record RECORD;
BEGIN
  FOR campaign_record IN 
    SELECT id FROM fundraisers WHERE deleted_at IS NULL
  LOOP
    PERFORM sync_campaign_summary_totals(campaign_record.id);
  END LOOP;
END $$;