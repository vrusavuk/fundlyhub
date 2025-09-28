-- Security & Performance Foundation - Database Optimization
-- Add composite indices for better query performance

-- Fundraisers performance indices
CREATE INDEX IF NOT EXISTS idx_fundraisers_status_visibility_created 
ON fundraisers(status, visibility, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fundraisers_owner_status 
ON fundraisers(owner_user_id, status);

CREATE INDEX IF NOT EXISTS idx_fundraisers_category_status 
ON fundraisers(category_id, status) WHERE visibility = 'public';

-- Donations performance indices
CREATE INDEX IF NOT EXISTS idx_donations_fundraiser_created 
ON donations(fundraiser_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donations_donor_created 
ON donations(donor_user_id, created_at DESC) WHERE donor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_donations_status_created 
ON donations(payment_status, created_at DESC);

-- Subscriptions performance indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_type 
ON subscriptions(follower_id, following_type);

CREATE INDEX IF NOT EXISTS idx_subscriptions_following_type 
ON subscriptions(following_id, following_type);

-- User activities performance indices
CREATE INDEX IF NOT EXISTS idx_user_activities_actor_created 
ON user_activities(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_target_type 
ON user_activities(target_type, target_id, created_at DESC);

-- Comments performance indices
CREATE INDEX IF NOT EXISTS idx_comments_fundraiser_created 
ON comments(fundraiser_id, created_at DESC);

-- Add security audit table for enhanced monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  request_path text,
  request_method text,
  success boolean DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Index for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type_created 
ON security_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_user_created 
ON security_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_events_ip_created 
ON security_events(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Enable RLS on security events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only super admins can access security events
CREATE POLICY "Super admins can manage security events" 
ON security_events 
FOR ALL 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  _event_type text,
  _user_id uuid DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _request_path text DEFAULT NULL,
  _request_method text DEFAULT NULL,
  _success boolean DEFAULT true,
  _details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO security_events (
    event_type, user_id, ip_address, user_agent, 
    request_path, request_method, success, details
  )
  VALUES (
    _event_type, _user_id, _ip_address, _user_agent,
    _request_path, _request_method, _success, _details
  )
  RETURNING id;
$$;