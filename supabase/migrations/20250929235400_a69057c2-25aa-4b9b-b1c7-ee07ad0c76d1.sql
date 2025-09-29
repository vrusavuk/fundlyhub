-- Phase 1: Add test data with draft and paused statuses for testing

-- Update 30 random campaigns to draft status
UPDATE fundraisers
SET status = 'draft'
WHERE id IN (
  SELECT id FROM fundraisers 
  WHERE status = 'active' 
  ORDER BY RANDOM() 
  LIMIT 30
);

-- Update 25 random campaigns to paused status  
UPDATE fundraisers
SET status = 'paused'
WHERE id IN (
  SELECT id FROM fundraisers 
  WHERE status = 'active' 
  AND id NOT IN (SELECT id FROM fundraisers WHERE status = 'draft')
  ORDER BY RANDOM() 
  LIMIT 25
);