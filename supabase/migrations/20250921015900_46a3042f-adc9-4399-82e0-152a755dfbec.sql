-- Drop all org_members policies and recreate them correctly
DROP POLICY IF EXISTS "Only org owners can manage members" ON org_members;
DROP POLICY IF EXISTS "Org members are viewable by everyone" ON org_members;

-- Create a simple policy that allows viewing org members without recursion
CREATE POLICY "Org members are viewable by everyone" 
ON org_members 
FOR SELECT 
USING (true);

-- For now, let's disable the management policy to avoid recursion
-- We can revisit this when the organization management features are built