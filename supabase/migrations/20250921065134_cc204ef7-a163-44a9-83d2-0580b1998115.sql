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
CREATE TRIGGER trigger_check_fundraiser_status_for_donations
  BEFORE INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION check_fundraiser_status_for_donations();