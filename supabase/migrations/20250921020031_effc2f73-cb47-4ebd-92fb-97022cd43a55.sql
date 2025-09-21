-- Add foreign key constraint between fundraisers and profiles
ALTER TABLE fundraisers 
ADD CONSTRAINT fundraisers_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES profiles(id);