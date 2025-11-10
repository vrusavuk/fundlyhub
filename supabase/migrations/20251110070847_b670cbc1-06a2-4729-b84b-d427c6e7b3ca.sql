-- Add RLS policies for admin access to profiles and user role assignments

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) 
  OR user_has_permission(auth.uid(), 'manage_users')
  OR user_has_permission(auth.uid(), 'view_users')
);

-- Allow admins to update user profiles (for suspend/ban/role management actions)
CREATE POLICY "Admins can update user profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_users')
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_users')
);

-- Allow admins to view all user role assignments
CREATE POLICY "Admins can view all user role assignments"
ON user_role_assignments
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_user_roles')
  OR user_has_permission(auth.uid(), 'view_users')
);

-- Allow admins to manage user role assignments
CREATE POLICY "Admins can manage user role assignments"
ON user_role_assignments
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_user_roles')
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_user_roles')
);