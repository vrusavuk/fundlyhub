-- Add RLS policy to allow admins with manage_campaigns permission to update any campaign
-- This allows platform admins to edit campaigns regardless of ownership
CREATE POLICY "Admins can update all campaigns"
ON fundraisers
FOR UPDATE
TO authenticated
USING (
  user_has_permission(auth.uid(), 'manage_campaigns') OR 
  is_super_admin(auth.uid())
);