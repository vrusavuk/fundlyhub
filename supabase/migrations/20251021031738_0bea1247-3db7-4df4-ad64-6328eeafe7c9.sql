-- Phase 1: Feature Toggle Schema
-- Add comprehensive feature toggle settings

INSERT INTO public.system_settings (setting_key, setting_value, category, description, is_sensitive, requires_restart) VALUES

-- User Management Features
('features.user_registration', '{"enabled": true, "allowed_roles": ["visitor"], "require_email_verification": true, "disabled_message": "New user registration is currently disabled. Please contact support if you need access."}', 'user_management', 'Control new user registration', false, false),
('features.user_profile_editing', '{"enabled": true, "allowed_roles": ["visitor", "creator", "org_admin"], "disabled_message": "Profile editing is temporarily disabled."}', 'user_management', 'Allow users to edit their profiles', false, false),
('features.user_profile_visibility', '{"enabled": true, "allow_public_profiles": true}', 'user_management', 'Control user profile visibility settings', false, false),

-- Social Features
('features.user_follow_user', '{"enabled": true, "max_following_per_user": 10000, "disabled_message": "User following is temporarily disabled."}', 'social', 'Enable user-to-user following', false, false),
('features.user_follow_organization', '{"enabled": true, "max_following_per_user": 5000, "disabled_message": "Organization following is temporarily disabled."}', 'social', 'Enable following organizations', false, false),
('features.user_comments', '{"enabled": true, "require_approval": false, "rate_limit_per_hour": 30}', 'content_moderation', 'Allow users to comment on fundraisers', false, false),

-- Fundraiser Features (Causes)
('features.fundraiser_creation', '{"enabled": true, "allowed_roles": ["creator", "org_admin"], "require_verification": false, "max_active_per_user": 10, "disabled_message": "Creating new fundraisers is currently disabled."}', 'content_moderation', 'Control creation of quick fundraisers (causes)', false, false),
('features.fundraiser_editing', '{"enabled": true, "allowed_roles": ["creator", "org_admin"], "edit_window_hours": 72}', 'content_moderation', 'Allow editing of existing fundraisers', false, false),
('features.fundraiser_deletion', '{"enabled": true, "allowed_roles": ["creator", "org_admin", "platform_admin"], "require_approval": true}', 'content_moderation', 'Allow deleting fundraisers', false, false),

-- Project Features (new structured projects)
('features.project_creation', '{"enabled": true, "allowed_roles": ["creator", "org_admin"], "require_verification": true, "max_active_per_org": 5, "disabled_message": "Project creation is currently disabled. Contact support for more information."}', 'content_moderation', 'Control creation of structured projects with milestones', false, false),
('features.project_milestones', '{"enabled": true, "max_milestones_per_project": 50}', 'content_moderation', 'Enable milestone functionality for projects', false, false),
('features.project_updates', '{"enabled": true, "rate_limit_per_day": 5}', 'content_moderation', 'Enable project update feeds', false, false),
('features.project_verification', '{"enabled": true, "auto_approve": false}', 'content_moderation', 'Enable project verification workflow', false, false),

-- Donation Features
('features.donations', '{"enabled": true, "min_amount": 1.00, "max_amount": 100000.00, "allowed_currencies": ["USD", "EUR", "GBP"], "disabled_message": "Donations are temporarily disabled."}', 'general', 'Control donation functionality', false, false),
('features.donation_anonymous', '{"enabled": true}', 'general', 'Allow anonymous donations', false, false),
('features.donation_recurring', '{"enabled": false}', 'general', 'Enable recurring donation subscriptions', false, false),
('features.donation_tips', '{"enabled": true, "default_tip_percentage": 10, "suggested_tips": [5, 10, 15, 20]}', 'general', 'Platform tip functionality', false, false),

-- Search & Discovery Features
('features.search', '{"enabled": true, "advanced_filters": true, "save_searches": false}', 'general', 'Search and discovery features', false, false),
('features.trending_campaigns', '{"enabled": true, "algorithm": "donation_velocity"}', 'general', 'Show trending/popular campaigns', false, false),
('features.recommendations', '{"enabled": false, "personalized": false}', 'general', 'Campaign recommendation engine', false, false),

-- Notification Features
('features.email_notifications', '{"enabled": true, "allow_user_preferences": true}', 'notifications', 'Email notification system', false, false),
('features.push_notifications', '{"enabled": false}', 'notifications', 'Browser push notifications', false, false),
('features.sms_notifications', '{"enabled": false}', 'notifications', 'SMS notifications (premium)', false, false),

-- Organization Features
('features.organization_creation', '{"enabled": true, "require_verification": true, "allowed_roles": ["creator", "org_admin"], "disabled_message": "Organization creation is currently disabled."}', 'user_management', 'Allow creating organizations', false, false),
('features.organization_verification', '{"enabled": true, "manual_review": true}', 'user_management', 'Organization verification workflow', false, false),

-- AI/Enhancement Features
('features.ai_text_enhancement', '{"enabled": true, "rate_limit_per_day": 10, "disabled_message": "AI text enhancement is currently unavailable."}', 'general', 'AI-powered text enhancement for fundraiser stories', false, false),
('features.ai_suggestions', '{"enabled": false}', 'general', 'AI-powered campaign suggestions', false, false)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Create Feature Dependencies Table
CREATE TABLE IF NOT EXISTS public.feature_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  depends_on_key TEXT NOT NULL,
  dependency_type TEXT CHECK (dependency_type IN ('required', 'recommended', 'enhanced_by')) DEFAULT 'required',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_feature_key FOREIGN KEY (feature_key) REFERENCES public.system_settings(setting_key) ON DELETE CASCADE,
  CONSTRAINT fk_depends_on_key FOREIGN KEY (depends_on_key) REFERENCES public.system_settings(setting_key) ON DELETE CASCADE,
  CONSTRAINT unique_dependency UNIQUE (feature_key, depends_on_key)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feature_dependencies_feature ON public.feature_dependencies(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_dependencies_depends ON public.feature_dependencies(depends_on_key);

-- Enable RLS
ALTER TABLE public.feature_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view feature dependencies"
  ON public.feature_dependencies FOR SELECT
  USING (true);

CREATE POLICY "Only super admins can manage feature dependencies"
  ON public.feature_dependencies FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Insert feature dependencies
INSERT INTO public.feature_dependencies (feature_key, depends_on_key, dependency_type) VALUES
('features.project_milestones', 'features.project_creation', 'required'),
('features.project_updates', 'features.project_creation', 'required'),
('features.project_verification', 'features.project_creation', 'recommended'),
('features.donation_recurring', 'features.donations', 'required'),
('features.user_follow_user', 'features.user_profile_visibility', 'enhanced_by'),
('features.user_follow_organization', 'features.organization_creation', 'enhanced_by')
ON CONFLICT (feature_key, depends_on_key) DO NOTHING;

-- Create Feature Usage Analytics Table
CREATE TABLE IF NOT EXISTS public.feature_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('attempted', 'succeeded', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_key_date ON public.feature_usage_analytics(feature_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user ON public.feature_usage_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_action ON public.feature_usage_analytics(action, created_at DESC);

-- Enable RLS
ALTER TABLE public.feature_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feature usage"
  ON public.feature_usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all feature usage"
  ON public.feature_usage_analytics FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert feature usage records"
  ON public.feature_usage_analytics FOR INSERT
  WITH CHECK (true);

-- Helper function to log feature usage
CREATE OR REPLACE FUNCTION public.log_feature_usage(
  _feature_key TEXT,
  _action TEXT,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.feature_usage_analytics (feature_key, user_id, action, metadata)
  VALUES (_feature_key, auth.uid(), _action, _metadata)
  RETURNING id;
$$;