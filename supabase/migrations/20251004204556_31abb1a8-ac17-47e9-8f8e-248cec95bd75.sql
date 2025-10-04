-- Phase 1: Fix RLS Policy for Event Store
-- Allow anonymous users to publish search analytics events

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Event store is writable by authenticated users" ON event_store;

-- Create new policy that allows search events from any user
CREATE POLICY "Allow search events from anyone" 
ON event_store 
FOR INSERT 
WITH CHECK (
  event_type LIKE 'search.%' OR 
  auth.role() = 'authenticated'
);

-- Keep read policy for authenticated users
CREATE POLICY "Authenticated users can read events" 
ON event_store 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Add index for faster event type queries
CREATE INDEX IF NOT EXISTS idx_event_store_event_type ON event_store(event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_occurred_at ON event_store(occurred_at DESC);
