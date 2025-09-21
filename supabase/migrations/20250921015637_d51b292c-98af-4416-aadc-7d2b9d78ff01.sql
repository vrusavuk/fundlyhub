-- Fix infinite recursion in org_members RLS policy
DROP POLICY IF EXISTS "Only org owners can manage members" ON org_members;

CREATE POLICY "Only org owners can manage members" 
ON org_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM org_members om 
    WHERE om.org_id = org_members.org_id 
    AND om.user_id = auth.uid() 
    AND om.role = 'owner'::org_member_role
  )
);