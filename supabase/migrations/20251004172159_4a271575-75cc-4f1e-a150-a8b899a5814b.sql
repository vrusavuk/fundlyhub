-- Fix infinite recursion in org_members RLS policies
-- Create security definer function to check organization membership safely

-- 1. Create function to check if user is org member (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = _user_id
      AND org_id = _org_id
  )
$$;

-- 2. Create function to check if user has org role
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role org_member_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role = _role
  )
$$;

-- 3. Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Organization members can view membership" ON public.org_members;
DROP POLICY IF EXISTS "Organization owners can add members" ON public.org_members;
DROP POLICY IF EXISTS "Organization owners can update members" ON public.org_members;
DROP POLICY IF EXISTS "Organization owners can remove members" ON public.org_members;

-- 4. Create new policies using security definer functions
CREATE POLICY "Users can view their own memberships"
ON public.org_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all memberships"
ON public.org_members
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Org owners and admins can view org membership"
ON public.org_members
FOR SELECT
USING (
  -- User can see memberships for orgs where they are owner/admin
  EXISTS (
    SELECT 1
    FROM public.org_members om
    WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org owners and admins can add members"
ON public.org_members
FOR INSERT
WITH CHECK (
  has_org_role(auth.uid(), org_id, 'owner') OR
  has_org_role(auth.uid(), org_id, 'admin') OR
  is_super_admin(auth.uid())
);

CREATE POLICY "Org owners can update members"
ON public.org_members
FOR UPDATE
USING (
  has_org_role(auth.uid(), org_id, 'owner') OR
  is_super_admin(auth.uid())
);

CREATE POLICY "Org owners can remove members"
ON public.org_members
FOR DELETE
USING (
  has_org_role(auth.uid(), org_id, 'owner') OR
  is_super_admin(auth.uid())
);