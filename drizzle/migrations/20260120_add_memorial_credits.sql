-- Migration: Add Memorial Credits to Funeral Homes
-- Date: 2026-01-20
-- Description: Add memorial_credits column to track available memorial creation credits

-- Add memorial_credits column to funeral_homes table
ALTER TABLE funeral_homes
  ADD COLUMN IF NOT EXISTS memorial_credits INTEGER DEFAULT 0 NOT NULL;

-- Update existing funeral homes to have 0 credits (they will need to purchase)
-- New funeral homes will automatically get 0 credits from the DEFAULT value
UPDATE funeral_homes
SET memorial_credits = 0
WHERE memorial_credits IS NULL;

-- Add index for faster credit lookups
CREATE INDEX IF NOT EXISTS idx_funeral_homes_memorial_credits
  ON funeral_homes(memorial_credits);
