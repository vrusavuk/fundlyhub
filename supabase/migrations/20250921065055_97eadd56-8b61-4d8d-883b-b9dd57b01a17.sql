-- Update existing campaigns to set status distribution
-- First, set all to pending as default
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

-- Create a trigger function to prevent donations on pending campaigns
CREATE OR REPLACE FUNCTION check_fundraiser_status_for_donations()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM fundraisers 
    WHERE id = NEW.fundraiser_id 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Cannot create donations for pending campaigns';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
DROP TRIGGER IF EXISTS trigger_check_fundraiser_status_for_donations ON donations;
CREATE TRIGGER trigger_check_fundraiser_status_for_donations
  BEFORE INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION check_fundraiser_status_for_donations();