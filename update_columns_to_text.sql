-- Update columns to TEXT to support base64 images
-- These changes are safe as TEXT can hold all VARCHAR data

-- Update memorials table
ALTER TABLE memorials ALTER COLUMN main_photo TYPE TEXT;
ALTER TABLE memorials ALTER COLUMN video_url TYPE TEXT;

-- Update photos table
ALTER TABLE photos ALTER COLUMN file_url TYPE TEXT;
