-- Add new enum values in separate statements
ALTER TYPE fundraiser_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE fundraiser_status ADD VALUE IF NOT EXISTS 'pending';