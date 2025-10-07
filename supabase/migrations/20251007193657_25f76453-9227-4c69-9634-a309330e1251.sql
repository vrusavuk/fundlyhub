-- Phase 1: Fix RLS Policy - Add WITH CHECK clause to admin update policy
-- Drop the incomplete policy
DROP POLICY IF EXISTS "Admins can update all campaigns" ON fundraisers;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Admins can update all campaigns"
ON fundraisers
FOR UPDATE
TO authenticated
USING (
  user_has_permission(auth.uid(), 'manage_campaigns') OR 
  is_super_admin(auth.uid())
)
WITH CHECK (
  user_has_permission(auth.uid(), 'manage_campaigns') OR 
  is_super_admin(auth.uid())
);