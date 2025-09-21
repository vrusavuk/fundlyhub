-- Enable real-time updates for donations table
ALTER TABLE donations REPLICA IDENTITY FULL;

-- Add donations table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE donations;