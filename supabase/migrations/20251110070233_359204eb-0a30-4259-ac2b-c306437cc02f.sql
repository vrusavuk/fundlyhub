-- Add foreign key from user_role_assignments to profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_role_assignments_user_id_fkey'
  ) THEN
    ALTER TABLE user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id 
ON user_role_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id 
ON user_role_assignments(role_id);