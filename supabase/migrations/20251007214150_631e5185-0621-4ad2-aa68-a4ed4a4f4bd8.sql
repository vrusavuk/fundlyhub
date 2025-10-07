-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  icon VARCHAR(50),
  
  -- Recipient targeting
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name VARCHAR(50),
  is_global BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  related_resource_type VARCHAR(50),
  related_resource_id UUID,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  
  -- Event correlation
  event_id UUID,
  correlation_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read, created_at DESC) 
  WHERE NOT is_archived;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_global 
  ON notifications(is_global, created_at DESC) 
  WHERE is_global = TRUE;

CREATE INDEX IF NOT EXISTS idx_notifications_role 
  ON notifications(role_name, created_at DESC) 
  WHERE role_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_correlation 
  ON notifications(correlation_id) 
  WHERE correlation_id IS NOT NULL;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_global = TRUE OR
    role_name IN (
      SELECT r.name 
      FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid() 
        AND ura.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
    )
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Update notification_preferences table for email toggles
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS email_campaign_updates BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_donations BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_social BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_security BOOLEAN DEFAULT TRUE;