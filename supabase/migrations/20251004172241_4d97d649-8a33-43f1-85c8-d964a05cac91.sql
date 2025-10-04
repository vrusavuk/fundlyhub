-- Fix remaining recursion in org membership view policy

DROP POLICY IF EXISTS "Org owners and admins can view org membership" ON public.org_members;

-- Create non-recursive policy using security definer function
CREATE POLICY "Org owners and admins can view org membership"
ON public.org_members
FOR SELECT
USING (
  has_org_role(auth.uid(), org_id, 'owner') OR
  has_org_role(auth.uid(), org_id, 'admin')
);