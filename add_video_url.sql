-- Add video_url column to memorials table
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
