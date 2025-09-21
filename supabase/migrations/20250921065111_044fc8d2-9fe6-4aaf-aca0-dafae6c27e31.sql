-- Update existing campaigns in smaller batches to avoid deadlocks
-- Set all to pending first
UPDATE fundraisers SET status = 'pending' WHERE status != 'pending';

-- Set 300 most recent campaigns to active
WITH recent_campaigns AS (
  SELECT id FROM fundraisers 
  ORDER BY created_at DESC 
  LIMIT 300
)
UPDATE fundraisers 
SET status = 'active' 
WHERE id IN (SELECT id FROM recent_campaigns);

-- Set next 400 campaigns to closed
WITH closed_campaigns AS (
  SELECT id FROM fundraisers 
  WHERE status = 'pending'
  ORDER BY created_at DESC 
  LIMIT 400
)
UPDATE fundraisers 
SET status = 'closed' 
WHERE id IN (SELECT id FROM closed_campaigns);