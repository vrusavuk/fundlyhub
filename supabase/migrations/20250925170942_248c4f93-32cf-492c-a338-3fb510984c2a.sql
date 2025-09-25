-- Create RBAC System Tables and Functions

-- 1. Create roles table for flexible role definitions
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  hierarchy_level integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create permissions table for granular access control
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- 4. Create user_role_assignments table for context-aware roles
CREATE TABLE public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  context_type text, -- 'global', 'organization', 'campaign'
  context_id uuid, -- organization_id or campaign_id for context-specific roles
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id, context_type, context_id)
);

-- 5. Create audit_logs table for tracking all admin actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Add account status fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification')),
ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until timestamp with time zone;

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RBAC security definer functions

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id uuid,
  _permission_name text,
  _context_type text DEFAULT 'global',
  _context_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN role_permissions rp ON ura.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ura.user_id = _user_id
      AND p.name = _permission_name
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND (
        (ura.context_type = 'global') OR
        (ura.context_type = _context_type AND ura.context_id = _context_id)
      )
  );
$$;

-- Function to get user's roles in a specific context
CREATE OR REPLACE FUNCTION public.get_user_roles(
  _user_id uuid,
  _context_type text DEFAULT 'global',
  _context_id uuid DEFAULT NULL
)
RETURNS TABLE(role_name text, context_type text, context_id uuid, hierarchy_level integer)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT r.name, ura.context_type, ura.context_id, r.hierarchy_level
  FROM user_role_assignments ura
  JOIN roles r ON ura.role_id = r.id
  WHERE ura.user_id = _user_id
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
    AND (
      _context_type = 'all' OR
      ura.context_type = 'global' OR
      (ura.context_type = _context_type AND (_context_id IS NULL OR ura.context_id = _context_id))
    )
  ORDER BY r.hierarchy_level DESC;
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.user_has_permission(_user_id, 'super_admin_access');
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _actor_id uuid,
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}',
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
  VALUES (_actor_id, _action, _resource_type, _resource_id, _metadata, _ip_address, _user_agent)
  RETURNING id;
$$;

-- Trigger function to update updated_at on roles
CREATE OR REPLACE FUNCTION public.update_roles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for roles updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_roles_updated_at();

-- 8. Create RLS Policies

-- Roles policies
CREATE POLICY "Super admins can manage all roles"
  ON public.roles FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view roles"
  ON public.roles FOR SELECT
  USING (true);

-- Permissions policies  
CREATE POLICY "Super admins can manage all permissions"
  ON public.permissions FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view permissions"
  ON public.permissions FOR SELECT
  USING (true);

-- Role permissions policies
CREATE POLICY "Super admins can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

-- User role assignments policies
CREATE POLICY "Super admins can manage all role assignments"
  ON public.user_role_assignments FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Platform admins can manage non-super-admin roles"
  ON public.user_role_assignments FOR ALL
  USING (
    public.user_has_permission(auth.uid(), 'manage_user_roles') AND
    NOT EXISTS (
      SELECT 1 FROM roles r 
      WHERE r.id = role_id AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Users can view their own role assignments"
  ON public.user_role_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Platform admins can view limited audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    public.user_has_permission(auth.uid(), 'view_audit_logs') AND
    action NOT IN ('role_assignment_changed', 'super_admin_action')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- 9. Seed initial roles and permissions

-- Insert roles
INSERT INTO public.roles (name, display_name, description, is_system_role, hierarchy_level) VALUES
('super_admin', 'Super Administrator', 'Full platform access with all permissions', true, 100),
('platform_admin', 'Platform Administrator', 'Platform management with limited super admin access', true, 90),
('org_admin', 'Organization Administrator', 'Organization-specific administrative access', true, 80),
('campaign_moderator', 'Campaign Moderator', 'Campaign review and moderation capabilities', true, 70),
('support_agent', 'Support Agent', 'Customer support and basic user management', true, 60),
('user', 'Regular User', 'Standard user with basic platform access', true, 10);

-- Insert permissions by category
INSERT INTO public.permissions (name, display_name, description, category) VALUES
-- Super Admin permissions
('super_admin_access', 'Super Admin Access', 'Full unrestricted platform access', 'super_admin'),
('manage_system_settings', 'Manage System Settings', 'Configure platform-wide settings', 'super_admin'),
('manage_roles', 'Manage Roles', 'Create, edit, and delete roles', 'super_admin'),
('manage_permissions', 'Manage Permissions', 'Assign and revoke permissions', 'super_admin'),

-- User Management permissions
('view_all_users', 'View All Users', 'Access to view all user profiles', 'user_management'),
('manage_users', 'Manage Users', 'Edit user profiles and settings', 'user_management'),
('suspend_users', 'Suspend Users', 'Suspend and unsuspend user accounts', 'user_management'),
('ban_users', 'Ban Users', 'Permanently ban user accounts', 'user_management'),
('manage_user_roles', 'Manage User Roles', 'Assign and revoke user roles', 'user_management'),
('impersonate_users', 'Impersonate Users', 'Login as other users for support', 'user_management'),

-- Campaign Management permissions
('view_all_campaigns', 'View All Campaigns', 'Access to view all campaigns', 'campaign_management'),
('manage_campaigns', 'Manage Campaigns', 'Edit campaign details and settings', 'campaign_management'),
('approve_campaigns', 'Approve Campaigns', 'Approve pending campaigns', 'campaign_management'),
('suspend_campaigns', 'Suspend Campaigns', 'Suspend and unsuspend campaigns', 'campaign_management'),
('feature_campaigns', 'Feature Campaigns', 'Mark campaigns as featured', 'campaign_management'),
('delete_campaigns', 'Delete Campaigns', 'Permanently delete campaigns', 'campaign_management'),

-- Organization Management permissions
('view_all_organizations', 'View All Organizations', 'Access to view all organizations', 'org_management'),
('manage_organizations', 'Manage Organizations', 'Edit organization profiles', 'org_management'),
('verify_organizations', 'Verify Organizations', 'Approve organization verification', 'org_management'),
('suspend_organizations', 'Suspend Organizations', 'Suspend organization accounts', 'org_management'),

-- Analytics permissions
('view_platform_analytics', 'View Platform Analytics', 'Access to platform-wide analytics', 'analytics'),
('view_financial_reports', 'View Financial Reports', 'Access to revenue and financial data', 'analytics'),
('view_user_analytics', 'View User Analytics', 'Access to user behavior analytics', 'analytics'),
('export_data', 'Export Data', 'Export platform data and reports', 'analytics'),

-- Audit and Compliance permissions
('view_audit_logs', 'View Audit Logs', 'Access to system audit logs', 'audit'),
('manage_compliance', 'Manage Compliance', 'Handle compliance and legal matters', 'audit'),
('access_sensitive_data', 'Access Sensitive Data', 'View sensitive user and financial data', 'audit'),

-- Support permissions
('access_support_tools', 'Access Support Tools', 'Use customer support tools', 'support'),
('manage_tickets', 'Manage Support Tickets', 'Handle customer support requests', 'support'),
('send_notifications', 'Send Notifications', 'Send platform-wide notifications', 'support');

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'super_admin'; -- Super admin gets all permissions

-- Platform admin permissions (excluding super admin specific ones)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'platform_admin'
  AND p.category IN ('user_management', 'campaign_management', 'org_management', 'analytics', 'audit', 'support')
  AND p.name NOT IN ('ban_users', 'impersonate_users', 'delete_campaigns', 'access_sensitive_data');

-- Organization admin permissions (context-specific)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'org_admin'
  AND p.name IN ('manage_campaigns', 'view_all_campaigns', 'manage_organizations', 'access_support_tools');

-- Campaign moderator permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'campaign_moderator'
  AND p.name IN ('view_all_campaigns', 'approve_campaigns', 'suspend_campaigns', 'feature_campaigns');

-- Support agent permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'support_agent'
  AND p.name IN ('view_all_users', 'access_support_tools', 'manage_tickets', 'send_notifications');

-- Assign super admin role to existing admin users (update existing profiles with role = 'admin')
INSERT INTO public.user_role_assignments (user_id, role_id, context_type, assigned_by, assigned_at)
SELECT p.id, r.id, 'global', p.id, now()
FROM public.profiles p, public.roles r
WHERE p.role = 'admin' AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id, context_type, context_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_user_role_assignments_user_context ON public.user_role_assignments(user_id, context_type, context_id);
CREATE INDEX idx_user_role_assignments_active ON public.user_role_assignments(user_id, is_active, expires_at);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_audit_logs_actor_action ON public.audit_logs(actor_id, action, created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id, created_at);
CREATE INDEX idx_profiles_account_status ON public.profiles(account_status);