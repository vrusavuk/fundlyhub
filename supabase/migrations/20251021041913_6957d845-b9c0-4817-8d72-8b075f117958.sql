-- Make changed_by nullable in settings_audit_log temporarily
ALTER TABLE settings_audit_log ALTER COLUMN changed_by DROP NOT NULL;

-- Update feature flags to use permissions
INSERT INTO system_settings (setting_key, setting_value)
VALUES 
  ('features.fundraiser_creation', 
   '{"enabled": true, "required_permission": "create_fundraiser", "description": "Allows users to create new fundraising campaigns"}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;

INSERT INTO system_settings (setting_key, setting_value)
VALUES 
  ('features.organization_creation', 
   '{"enabled": true, "required_permission": "create_organization", "description": "Allows users to create new organizations"}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;

INSERT INTO system_settings (setting_key, setting_value)
VALUES 
  ('features.profile_editing', 
   '{"enabled": true, "required_permission": "edit_own_profile", "description": "Allows users to edit their profile information"}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;

INSERT INTO system_settings (setting_key, setting_value)
VALUES 
  ('features.donations', 
   '{"enabled": true, "required_permission": "make_donation", "description": "Allows users to make donations to campaigns"}'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;