-- =====================================================
-- Unified SECURITY DEFINER Architecture for Donations
-- This replaces the broken donations_with_privacy view
-- =====================================================

-- Drop the broken view (was accidentally dropped by CASCADE previously)
DROP VIEW IF EXISTS public.donations_with_privacy CASCADE;

-- Create SECURITY DEFINER function to get donations with privacy controls
-- This bypasses RLS but implements explicit access control logic inside
CREATE OR REPLACE FUNCTION public.get_donations_with_privacy(p_fundraiser_id uuid)
RETURNS TABLE (
  id uuid,
  fundraiser_id uuid,
  donor_user_id uuid,
  amount numeric,
  currency text,
  tip_amount numeric,
  fee_amount numeric,
  net_amount numeric,
  payment_status payment_status,
  payment_provider text,
  receipt_id text,
  is_anonymous boolean,
  created_at timestamptz,
  donor_name text,
  donor_avatar text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    d.id,
    d.fundraiser_id,
    d.donor_user_id,
    d.amount,
    d.currency,
    d.tip_amount,
    d.fee_amount,
    d.net_amount,
    d.payment_status,
    d.payment_provider,
    d.receipt_id,
    d.is_anonymous,
    d.created_at,
    -- Show donor name based on anonymity settings and permissions
    CASE 
      WHEN d.is_anonymous = false OR 
           d.donor_user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
           is_super_admin(auth.uid())
      THEN p.name
      ELSE 'Anonymous'
    END as donor_name,
    -- Show donor avatar based on anonymity settings and permissions
    CASE 
      WHEN d.is_anonymous = false OR 
           d.donor_user_id = auth.uid() OR
           EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
           is_super_admin(auth.uid())
      THEN p.avatar
      ELSE NULL
    END as donor_avatar
  FROM public.donations d
  LEFT JOIN public.public_profiles p ON d.donor_user_id = p.id
  WHERE d.fundraiser_id = p_fundraiser_id
    AND d.payment_status = 'paid'
    -- Only expose donations for public, active fundraisers (explicit access control)
    AND EXISTS (
      SELECT 1 FROM fundraisers f 
      WHERE f.id = d.fundraiser_id 
        AND f.visibility = 'public' 
        AND f.deleted_at IS NULL
    )
  ORDER BY d.created_at DESC;
$$;

-- Grant execute permission to all users (including anonymous)
GRANT EXECUTE ON FUNCTION public.get_donations_with_privacy(uuid) TO anon, authenticated;

-- Add documentation comment
COMMENT ON FUNCTION public.get_donations_with_privacy IS 
'SECURITY DEFINER function to retrieve donations with privacy controls. 
- Bypasses RLS for performance and to allow anonymous users to see public donations
- Implements explicit access control: only shows donations for public, non-deleted fundraisers
- Respects donor anonymity preferences
- Shows full donor info to: the donor themselves, fundraiser owner, or super admins
- Safe for public use because it explicitly filters to public fundraisers only';
