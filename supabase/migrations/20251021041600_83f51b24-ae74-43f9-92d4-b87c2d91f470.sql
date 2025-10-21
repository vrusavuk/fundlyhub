-- =====================================================
-- ROLE CONSOLIDATION & PERMISSION CREATION MIGRATION
-- =====================================================
-- This migration:
-- 1. Creates 21 new regular user permissions
-- 2. Consolidates "creator" into "user" role
-- 3. Creates "restricted_user" role template
-- 4. Ensures admin roles inherit user permissions

-- =====================================================
-- PART 1: CREATE MISSING USER PERMISSIONS
-- =====================================================

-- Content Creation Permissions (7)
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('create_fundraiser', 'Create Fundraiser', 'Create new fundraising campaigns', 'content_creation'),
  ('edit_own_fundraiser', 'Edit Own Fundraiser', 'Edit own fundraising campaigns', 'content_creation'),
  ('delete_own_fundraiser', 'Delete Own Fundraiser', 'Delete own fundraising campaigns', 'content_creation'),
  ('create_organization', 'Create Organization', 'Create new organizations', 'content_creation'),
  ('edit_own_organization', 'Edit Own Organization', 'Edit own organizations', 'content_creation'),
  ('post_campaign_update', 'Post Campaign Update', 'Post updates to campaigns', 'content_creation'),
  ('upload_media', 'Upload Media', 'Upload images and videos to campaigns', 'content_creation')
ON CONFLICT (name) DO NOTHING;

-- Social Permissions (5)
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('follow_user', 'Follow User', 'Follow other users', 'social'),
  ('follow_organization', 'Follow Organization', 'Follow organizations', 'social'),
  ('comment_on_campaign', 'Comment on Campaign', 'Post comments on campaigns', 'social'),
  ('like_content', 'Like Content', 'Like campaigns and updates', 'social'),
  ('share_content', 'Share Content', 'Share campaigns on social media', 'social')
ON CONFLICT (name) DO NOTHING;

-- Financial Permissions (5)
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('make_donation', 'Make Donation', 'Donate to campaigns', 'financial'),
  ('make_recurring_donation', 'Make Recurring Donation', 'Set up recurring donations', 'financial'),
  ('view_own_donations', 'View Own Donations', 'View personal donation history', 'financial'),
  ('withdraw_funds', 'Withdraw Funds', 'Withdraw funds from own campaigns', 'financial'),
  ('view_own_financial_reports', 'View Own Financial Reports', 'View own campaign financial data', 'financial')
ON CONFLICT (name) DO NOTHING;

-- Profile Permissions (4)
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('edit_own_profile', 'Edit Own Profile', 'Edit personal profile information', 'profile'),
  ('view_own_profile', 'View Own Profile', 'View personal profile and settings', 'profile'),
  ('manage_notification_preferences', 'Manage Notification Preferences', 'Configure notification preferences', 'profile'),
  ('delete_own_account', 'Delete Own Account', 'Delete own account', 'profile')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PART 2: ASSIGN ALL USER PERMISSIONS TO "user" ROLE
-- =====================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'user'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 3: MIGRATE USERS FROM "creator" TO "user" ROLE
-- =====================================================

-- Update all user_role_assignments from creator to user
UPDATE user_role_assignments
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id = (SELECT id FROM roles WHERE name = 'creator')
  AND is_active = true;

-- =====================================================
-- PART 4: DEPRECATE "creator" ROLE
-- =====================================================

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

-- =====================================================
-- PART 5: CREATE "restricted_user" ROLE TEMPLATE
-- =====================================================

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

-- Assign limited permissions to restricted_user (social + basic financial + profile)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'restricted_user'),
  p.id
FROM permissions p
WHERE p.name IN (
  -- Social permissions (allow engagement)
  'follow_user', 'follow_organization', 'comment_on_campaign', 'like_content', 'share_content',
  -- Financial permissions (allow donations only, no withdrawals)
  'make_donation', 'view_own_donations',
  -- Profile permissions (basic account management)
  'edit_own_profile', 'view_own_profile', 'manage_notification_preferences'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 6: ADD USER PERMISSIONS TO ADMIN ROLES
-- =====================================================

-- Support Agent inherits all user permissions + support tools
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'support_agent'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- Campaign Moderator inherits all user permissions + moderation tools
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'campaign_moderator'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- Org Admin inherits all user permissions + org management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'org_admin'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- Platform Admin inherits all user permissions + platform management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'platform_admin'),
  p.id
FROM permissions p
WHERE p.category IN ('content_creation', 'social', 'financial', 'profile')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 7: UPDATE DEFAULT ROLE FOR NEW USERS
-- =====================================================

-- Ensure visitor role exists and has minimal permissions
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

-- Assign minimal permissions to visitor (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'visitor'),
  p.id
FROM permissions p
WHERE p.name IN ('view_own_profile')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (For logging/debugging)
-- =====================================================

-- Log the migration results
DO $$
DECLARE
  user_role_perms INT;
  restricted_user_perms INT;
  creator_users INT;
  user_users INT;
BEGIN
  -- Count permissions for user role
  SELECT COUNT(*) INTO user_role_perms
  FROM role_permissions
  WHERE role_id = (SELECT id FROM roles WHERE name = 'user');

  -- Count permissions for restricted_user role
  SELECT COUNT(*) INTO restricted_user_perms
  FROM role_permissions
  WHERE role_id = (SELECT id FROM roles WHERE name = 'restricted_user');

  -- Count users still assigned to creator role
  SELECT COUNT(*) INTO creator_users
  FROM user_role_assignments
  WHERE role_id = (SELECT id FROM roles WHERE name = 'creator')
    AND is_active = true;

  -- Count users assigned to user role
  SELECT COUNT(*) INTO user_users
  FROM user_role_assignments
  WHERE role_id = (SELECT id FROM roles WHERE name = 'user')
    AND is_active = true;

  RAISE NOTICE '=== MIGRATION RESULTS ===';
  RAISE NOTICE 'User role permissions: %', user_role_perms;
  RAISE NOTICE 'Restricted user permissions: %', restricted_user_perms;
  RAISE NOTICE 'Users with creator role: %', creator_users;
  RAISE NOTICE 'Users with user role: %', user_users;
  RAISE NOTICE 'NOTE: Feature flags must be updated manually via System Settings UI';
  RAISE NOTICE '=========================';
END $$;