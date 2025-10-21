-- Make changed_by nullable in audit log to allow system migrations
ALTER TABLE settings_audit_log 
ALTER COLUMN changed_by DROP NOT NULL;

-- Now update feature flags safely
UPDATE system_settings
SET setting_value = '{"enabled": true, "required_permission": "create_fundraiser", "description": "Allows users to create new fundraising campaigns"}'::jsonb
WHERE setting_key = 'features.fundraiser_creation';

UPDATE system_settings
SET setting_value = '{"enabled": true, "required_permission": "create_organization", "description": "Allows users to create new organizations"}'::jsonb
WHERE setting_key = 'features.organization_creation';

UPDATE system_settings
SET setting_value = '{"enabled": true, "required_permission": "edit_own_profile", "description": "Allows users to edit their profile information"}'::jsonb
WHERE setting_key = 'features.profile_editing';

UPDATE system_settings
SET setting_value = '{"enabled": true, "required_permission": "make_donation", "description": "Allows users to make donations to campaigns"}'::jsonb
WHERE setting_key = 'features.donations';