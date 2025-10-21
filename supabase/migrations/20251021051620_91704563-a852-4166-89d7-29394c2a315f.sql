-- Add permission for creating project updates
INSERT INTO permissions (name, display_name, description, category)
VALUES (
  'create_project_updates',
  'Create Project Updates',
  'Allows users to post updates on their fundraisers/projects',
  'campaign'
)
ON CONFLICT (name) DO NOTHING;

-- Assign permission to relevant roles
WITH perm AS (SELECT id FROM permissions WHERE name = 'create_project_updates')
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r
CROSS JOIN perm p 
WHERE r.name IN ('creator', 'org_admin', 'platform_admin', 'super_admin')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add feature toggle for project updates
INSERT INTO system_settings (setting_key, setting_value, description, category)
VALUES (
  'features.project_updates',
  '{"enabled": true, "allowed_roles": ["creator", "org_admin", "platform_admin", "super_admin"], "disabled_message": "Project updates are currently disabled by administrators.", "max_updates_per_day": 10}',
  'Enable project creators to post updates on their fundraisers',
  'features'
)
ON CONFLICT (setting_key) DO NOTHING;