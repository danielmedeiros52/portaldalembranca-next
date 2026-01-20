-- Add is_cover field to photos table
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false NOT NULL;
