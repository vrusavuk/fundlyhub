-- Fix the function with proper search_path
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
$$ LANGUAGE plpgsql SET search_path = public;