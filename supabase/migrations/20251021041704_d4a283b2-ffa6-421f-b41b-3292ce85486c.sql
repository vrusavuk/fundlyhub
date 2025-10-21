-- =====================================================
-- ROLE CONSOLIDATION & PERMISSION CREATION MIGRATION
-- =====================================================

-- Content Creation Permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('create_fundraiser', 'Create Fundraiser', 'Create new fundraising campaigns', 'content_creation'),
  ('edit_own_fundraiser', 'Edit Own Fundraiser', 'Edit own fundraising campaigns', 'content_creation'),
  ('delete_own_fundraiser', 'Delete Own Fundraiser', 'Delete own fundraising campaigns', 'content_creation'),
  ('create_organization', 'Create Organization', 'Create new organizations', 'content_creation'),
  ('edit_own_organization', 'Edit Own Organization', 'Edit own organizations', 'content_creation'),
  ('post_campaign_update', 'Post Campaign Update', 'Post updates to campaigns', 'content_creation'),
  ('upload_media', 'Upload Media', 'Upload images and videos to campaigns', 'content_creation')
ON CONFLICT (name) DO NOTHING;

-- Social Permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('follow_user', 'Follow User', 'Follow other users', 'social'),
  ('follow_organization', 'Follow Organization', 'Follow organizations', 'social'),
  ('comment_on_campaign', 'Comment on Campaign', 'Post comments on campaigns', 'social'),
  ('like_content', 'Like Content', 'Like campaigns and updates', 'social'),
  ('share_content', 'Share Content', 'Share campaigns on social media', 'social')
ON CONFLICT (name) DO NOTHING;

-- Financial Permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('make_donation', 'Make Donation', 'Donate to campaigns', 'financial'),
  ('make_recurring_donation', 'Make Recurring Donation', 'Set up recurring donations', 'financial'),
  ('view_own_donations', 'View Own Donations', 'View personal donation history', 'financial'),
  ('withdraw_funds', 'Withdraw Funds', 'Withdraw funds from own campaigns', 'financial'),
  ('view_own_financial_reports', 'View Own Financial Reports', 'View own campaign financial data', 'financial')
ON CONFLICT (name) DO NOTHING;

-- Profile Permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('edit_own_profile', 'Edit Own Profile', 'Edit personal profile information', 'profile'),
  ('view_own_profile', 'View Own Profile', 'View personal profile and settings', 'profile'),
  ('manage_notification_preferences', 'Manage Notification Preferences', 'Configure notification preferences', 'profile'),
  ('delete_own_account', 'Delete Own Account', 'Delete own account', 'profile')
ON CONFLICT (name) DO NOTHING;

-- Assign all user permissions to "user" role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'user'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- Migrate users from creator to user role
UPDATE user_role_assignments
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id = (SELECT id FROM roles WHERE name = 'creator')
  AND is_active = true;

-- Deprecate creator role
UPDATE roles 
SET 
  description = '[DEPRECATED] Merged into "user" role. All users now have full platform access by default.',
  hierarchy_level = 0,
  is_system_role = false,
  updated_at = NOW()
WHERE name = 'creator';

-- Remove all permissions from deprecated creator role
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'creator');

-- Create restricted_user role
INSERT INTO roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES (
  'restricted_user', 
  'Restricted User', 
  'Limited platform access without content creation abilities. Used for users with content violations or restrictions.', 
  5, 
  false
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  updated_at = NOW();

-- Assign limited permissions to restricted_user
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'restricted_user'),
  p.id
FROM permissions p
WHERE p.name IN (
  'follow_user', 'follow_organization', 'comment_on_campaign', 'like_content', 'share_content',
  'make_donation', 'view_own_donations',
  'edit_own_profile', 'view_own_profile', 'manage_notification_preferences'
)
ON CONFLICT DO NOTHING;

-- Add user permissions to all admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('support_agent', 'campaign_moderator', 'org_admin', 'platform_admin')
  AND p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- Ensure visitor role exists with minimal permissions
INSERT INTO roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES (
  'visitor', 
  'Visitor', 
  'Unauthenticated or newly registered users with read-only access', 
  1, 
  true
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  updated_at = NOW();

-- Assign minimal permissions to visitor
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'visitor'),
  p.id
FROM permissions p
WHERE p.name IN ('view_own_profile')
ON CONFLICT DO NOTHING;