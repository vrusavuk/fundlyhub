-- Phase 1: Enhance Event Store Schema

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_store_event_type ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate_id ON event_store(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_store_correlation_id ON event_store(correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_at ON event_store(occurred_at DESC);

-- Create event processing status table
CREATE TABLE IF NOT EXISTS event_processing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event_store(event_id),
  processor_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, processor_name)
);

-- Create event dead letter queue
CREATE TABLE IF NOT EXISTS event_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL,
  event_data JSONB NOT NULL,
  processor_name TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  failure_count INTEGER DEFAULT 1,
  first_failed_at TIMESTAMPTZ DEFAULT NOW(),
  last_failed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event projections for analytics
CREATE TABLE IF NOT EXISTS campaign_analytics_projection (
  campaign_id UUID PRIMARY KEY,
  total_donations NUMERIC DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  unique_donors INTEGER DEFAULT 0,
  last_donation_at TIMESTAMPTZ,
  first_donation_at TIMESTAMPTZ,
  average_donation NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_history_projection (
  user_id UUID PRIMARY KEY,
  total_donated NUMERIC DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  campaigns_supported INTEGER DEFAULT 0,
  last_donation_at TIMESTAMPTZ,
  first_donation_at TIMESTAMPTZ,
  average_donation NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materialized view for event statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS event_statistics AS
SELECT 
  event_type,
  COUNT(*) as event_count,
  DATE_TRUNC('hour', occurred_at) as hour_bucket,
  MIN(occurred_at) as first_seen,
  MAX(occurred_at) as last_seen
FROM event_store
WHERE occurred_at > NOW() - INTERVAL '7 days'
GROUP BY event_type, hour_bucket;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_event_statistics_type_bucket ON event_statistics(event_type, hour_bucket);

-- Enable Realtime for event_store
ALTER TABLE event_store REPLICA IDENTITY FULL;

-- Create function to refresh event statistics periodically
CREATE OR REPLACE FUNCTION refresh_event_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY event_statistics;
END;
$$;

-- RLS Policies for new tables
ALTER TABLE event_processing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_history_projection ENABLE ROW LEVEL SECURITY;

-- Admin can view all event processing status
CREATE POLICY "Admins can view event processing status"
ON event_processing_status FOR SELECT
USING (is_super_admin(auth.uid()));

-- System can manage event processing status
CREATE POLICY "System can manage event processing status"
ON event_processing_status FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin can view dead letter queue
CREATE POLICY "Admins can view dead letter queue"
ON event_dead_letter_queue FOR SELECT
USING (is_super_admin(auth.uid()));

-- System can manage dead letter queue
CREATE POLICY "System can manage dead letter queue"
ON event_dead_letter_queue FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Campaign analytics are viewable by everyone
CREATE POLICY "Campaign analytics are viewable by everyone"
ON campaign_analytics_projection FOR SELECT
USING (true);

-- System can update campaign analytics
CREATE POLICY "System can update campaign analytics"
ON campaign_analytics_projection FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own donor history
CREATE POLICY "Users can view their own donor history"
ON donor_history_projection FOR SELECT
USING (user_id = auth.uid());

-- System can update donor history
CREATE POLICY "System can update donor history"
ON donor_history_projection FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');