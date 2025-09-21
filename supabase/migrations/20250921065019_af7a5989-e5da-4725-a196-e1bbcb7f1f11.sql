-- Update the fundraiser_status enum to include the new status values
ALTER TYPE fundraiser_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE fundraiser_status ADD VALUE IF NOT EXISTS 'pending';

-- Update existing campaigns to set status distribution
-- First, let's set all to pending as default
UPDATE fundraisers SET status = 'pending';

-- Set 300 campaigns to active (most recent ones)
UPDATE fundraisers 
SET status = 'active' 
WHERE id IN (
  SELECT id FROM fundraisers 
  ORDER BY created_at DESC 
  LIMIT 300
);

-- Set 400 campaigns to closed (excluding the active ones, next most recent)
UPDATE fundraisers 
SET status = 'closed' 
WHERE id IN (
  SELECT id FROM fundraisers 
  WHERE status != 'active'
  ORDER BY created_at DESC 
  LIMIT 400
);

-- Add constraint to prevent donations on pending campaigns
ALTER TABLE donations ADD CONSTRAINT check_no_donations_on_pending_campaigns 
CHECK (
  NOT EXISTS (
    SELECT 1 FROM fundraisers 
    WHERE fundraisers.id = donations.fundraiser_id 
    AND fundraisers.status = 'pending'
  )
);