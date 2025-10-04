-- ============================================
-- FIX SECURITY ARCHITECTURE EXPOSURE
-- ============================================
-- Fix for: role_permissions, permissions, roles tables are publicly readable
-- This exposes the entire permission structure to attackers

-- 1. Fix role_permissions table - restrict to authenticated users viewing their own roles
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;

CREATE POLICY "Users can view their own role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    WHERE ura.role_id = role_permissions.role_id
    AND ura.user_id = auth.uid()
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  )
  OR is_super_admin(auth.uid())
);

COMMENT ON POLICY "Users can view their own role permissions" ON public.role_permissions 
IS 'Users can only see role_permissions for roles they are assigned to. Admins can see all.';

-- 2. Fix permissions table - restrict to authenticated admins only
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;

CREATE POLICY "Admins can view all permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (
  user_has_permission(auth.uid(), 'manage_user_roles') 
  OR is_super_admin(auth.uid())
);

COMMENT ON POLICY "Admins can view all permissions" ON public.permissions 
IS 'Only administrators can view the full permissions list';

-- 3. Fix roles table - restrict to authenticated admins only
DROP POLICY IF EXISTS "Users can view roles" ON public.roles;

CREATE POLICY "Admins can view all roles"
ON public.roles
FOR SELECT
TO authenticated
USING (
  user_has_permission(auth.uid(), 'manage_user_roles')
  OR is_super_admin(auth.uid())
);

COMMENT ON POLICY "Admins can view all roles" ON public.roles 
IS 'Only administrators can view the full roles list';

-- 4. Fix categories table - keep public read, restrict write to admins
DROP POLICY IF EXISTS "Only authenticated users can manage categories" ON public.categories;

-- Public read access
CREATE POLICY "Anyone can view active categories"
ON public.categories
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Admin write access only
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (
  user_has_permission(auth.uid(), 'manage_system_settings')
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  user_has_permission(auth.uid(), 'manage_system_settings')
  OR is_super_admin(auth.uid())
);

COMMENT ON POLICY "Anyone can view active categories" ON public.categories 
IS 'Public read access for active categories';

COMMENT ON POLICY "Admins can manage categories" ON public.categories 
IS 'Only admins can create, update, or delete categories';

-- 5. Fix org_members table - add explicit write policies
DROP POLICY IF EXISTS "Org members are viewable by everyone" ON public.org_members;

-- Read: Organization members and admins can view membership
CREATE POLICY "Organization members can view membership"
ON public.org_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
  )
  OR is_super_admin(auth.uid())
);

-- Insert: Only org owners/admins can add members
CREATE POLICY "Organization owners can add members"
ON public.org_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
  OR is_super_admin(auth.uid())
);

-- Update: Only org owners can change member roles
CREATE POLICY "Organization owners can update members"
ON public.org_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
  OR is_super_admin(auth.uid())
);

-- Delete: Only org owners can remove members
CREATE POLICY "Organization owners can remove members"
ON public.org_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.org_id = org_members.org_id
    AND om.user_id = auth.uid()
    AND om.role = 'owner'
  )
  OR is_super_admin(auth.uid())
);

COMMENT ON POLICY "Organization members can view membership" ON public.org_members 
IS 'Members and admins can view organization membership';

COMMENT ON POLICY "Organization owners can add members" ON public.org_members 
IS 'Only organization owners/admins can add new members';

-- 6. Add security comments to tables
COMMENT ON TABLE public.role_permissions IS 'SECURITY: Permission structure - restrict access to prevent privilege escalation attacks';
COMMENT ON TABLE public.permissions IS 'SECURITY: Permission definitions - only visible to administrators';
COMMENT ON TABLE public.roles IS 'SECURITY: Role hierarchy - only visible to administrators';

-- 7. Create helper function for getting user's own permissions (without exposing all)
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE (
  permission_name text,
  permission_display_name text,
  permission_category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT 
    p.name,
    p.display_name,
    p.category
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_role_assignments ura ON rp.role_id = ura.role_id
  WHERE ura.user_id = auth.uid()
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ORDER BY p.category, p.display_name;
$$;

COMMENT ON FUNCTION public.get_my_permissions IS 'Get current user''s permissions without exposing all permission structures';

GRANT EXECUTE ON FUNCTION public.get_my_permissions TO authenticated;