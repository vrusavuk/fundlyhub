-- Fix security definer view warning
-- Views should use security_invoker to respect querying user's RLS policies

DROP VIEW IF EXISTS public.donations_with_privacy CASCADE;

-- Recreate the view with explicit security_invoker setting
CREATE VIEW public.donations_with_privacy 
WITH (security_invoker=true) AS
SELECT 
  d.id,
  d.fundraiser_id,
  d.amount,
  d.currency,
  d.tip_amount,
  d.fee_amount,
  d.net_amount,
  d.created_at,
  d.payment_status,
  d.receipt_id,
  d.payment_provider,
  d.is_anonymous,
  -- Only show donor info if NOT anonymous OR viewing own donation OR fundraiser owner OR admin
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN d.donor_user_id 
    ELSE NULL 
  END as donor_user_id,
  -- Only show donor name when allowed
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.name
    ELSE 'Anonymous'
  END as donor_name,
  -- Only show donor avatar when allowed
  CASE 
    WHEN d.is_anonymous = false OR d.donor_user_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = d.fundraiser_id AND f.owner_user_id = auth.uid()) OR
         is_super_admin(auth.uid())
    THEN p.avatar
    ELSE NULL
  END as donor_avatar
FROM public.donations d
LEFT JOIN public.public_profiles p ON d.donor_user_id = p.id;

-- Grant access to the privacy-respecting donations view
GRANT SELECT ON public.donations_with_privacy TO authenticated, anon;