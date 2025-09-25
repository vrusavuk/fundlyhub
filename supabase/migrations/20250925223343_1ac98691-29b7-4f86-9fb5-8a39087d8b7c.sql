-- Create system_settings table for storing platform configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  requires_restart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create settings_audit_log table for tracking changes
CREATE TABLE public.settings_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Super admins can manage all settings"
ON public.system_settings
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Platform admins can view non-sensitive settings"
ON public.system_settings
FOR SELECT
USING (
  user_has_permission(auth.uid(), 'manage_platform_settings') 
  AND NOT is_sensitive
);

CREATE POLICY "Platform admins can update specific settings"
ON public.system_settings
FOR UPDATE
USING (
  user_has_permission(auth.uid(), 'manage_platform_settings')
  AND category IN ('user_management', 'content_moderation', 'notifications')
  AND NOT is_sensitive
);

-- RLS Policies for settings_audit_log
CREATE POLICY "Super admins can view all audit logs"
ON public.settings_audit_log
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Platform admins can view limited audit logs"
ON public.settings_audit_log
FOR SELECT
USING (
  user_has_permission(auth.uid(), 'view_audit_logs')
  AND setting_key NOT LIKE 'security.%'
  AND setting_key NOT LIKE 'system.%'
);

CREATE POLICY "System can insert audit logs"
ON public.settings_audit_log
FOR INSERT
WITH CHECK (true);

-- Function to log settings changes
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.settings_audit_log (
      setting_key,
      old_value,
      new_value,
      changed_by,
      change_reason
    ) VALUES (
      NEW.setting_key,
      OLD.setting_value,
      NEW.setting_value,
      NEW.updated_by,
      'Settings updated via admin panel'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for settings changes
CREATE TRIGGER settings_change_log
  AFTER UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_settings_change();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for timestamp updates
CREATE TRIGGER update_settings_timestamp
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_settings_timestamp();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, category, description, is_sensitive, requires_restart) VALUES
-- General Settings
('platform.maintenance_mode', '{"enabled": false, "message": "System maintenance in progress"}', 'general', 'Platform maintenance mode settings', false, false),
('platform.registration_enabled', '{"enabled": true}', 'general', 'Allow new user registrations', false, false),
('platform.public_registration', '{"enabled": true}', 'general', 'Allow public user registrations without invitation', false, false),

-- Security Settings
('security.password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special_chars": true, "max_age_days": 90}', 'security', 'Password complexity requirements', false, false),
('security.session_timeout', '{"hours": 24}', 'security', 'User session timeout duration', false, false),
('security.max_login_attempts', '{"attempts": 5, "lockout_duration_minutes": 30}', 'security', 'Failed login attempt limits', false, false),
('security.two_factor_required', '{"admin_required": true, "user_optional": true}', 'security', 'Two-factor authentication requirements', false, false),
('security.ip_restrictions', '{"enabled": false, "allowed_ranges": []}', 'security', 'IP address access restrictions', true, false),

-- Email Settings
('email.verification_required', '{"enabled": true}', 'email', 'Require email verification for new accounts', false, false),
('email.admin_notifications', '{"enabled": true, "recipients": []}', 'email', 'Admin notification email settings', false, false),
('email.rate_limiting', '{"enabled": true, "per_hour": 10}', 'email', 'Email sending rate limits', false, false),

-- API Settings
('api.rate_limiting', '{"enabled": true, "requests_per_minute": 100, "burst_limit": 200}', 'api', 'API rate limiting configuration', false, false),
('api.cors_origins', '{"origins": ["*"]}', 'api', 'Allowed CORS origins', false, true),
('api.webhook_timeout', '{"seconds": 30}', 'api', 'Webhook request timeout', false, false),

-- User Management Settings
('users.default_role', '{"role": "visitor"}', 'user_management', 'Default role for new users', false, false),
('users.profile_visibility', '{"default": "public", "options": ["public", "private"]}', 'user_management', 'Default profile visibility settings', false, false),
('users.deletion_policy', '{"soft_delete": true, "retention_days": 30}', 'user_management', 'User account deletion policy', false, false),

-- Content Moderation Settings
('moderation.auto_approval', '{"campaigns": false, "comments": true, "updates": true}', 'content_moderation', 'Auto-approval settings for content', false, false),
('moderation.profanity_filter', '{"enabled": true, "strict_mode": false}', 'content_moderation', 'Profanity filtering configuration', false, false),
('moderation.spam_detection', '{"enabled": true, "sensitivity": "medium"}', 'content_moderation', 'Spam detection settings', false, false),

-- Notification Settings
('notifications.push_enabled', '{"enabled": true}', 'notifications', 'Push notification availability', false, false),
('notifications.email_digest', '{"enabled": true, "frequency": "weekly"}', 'notifications', 'Email digest settings', false, false),
('notifications.admin_alerts', '{"new_campaigns": true, "large_donations": true, "security_events": true}', 'notifications', 'Admin alert preferences', false, false),

-- System Settings
('system.backup_frequency', '{"hours": 6}', 'system', 'Database backup frequency', false, false),
('system.log_retention', '{"days": 90}', 'system', 'System log retention period', false, false),
('system.performance_monitoring', '{"enabled": true, "threshold_ms": 1000}', 'system', 'Performance monitoring settings', false, false);