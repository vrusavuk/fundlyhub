-- Add new hold_type enum values (must be in separate transaction)
ALTER TYPE hold_type ADD VALUE IF NOT EXISTS 'campaign_review';
ALTER TYPE hold_type ADD VALUE IF NOT EXISTS 'chargeback_reserve';