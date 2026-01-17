-- Add new fields to memorials table for historical memorials support
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS main_photo VARCHAR(500);--> statement-breakpoint
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS is_historical BOOLEAN DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS category VARCHAR(100);--> statement-breakpoint
ALTER TABLE memorials ADD COLUMN IF NOT EXISTS grave_location VARCHAR(255);--> statement-breakpoint
ALTER TABLE memorials ALTER COLUMN funeral_home_id DROP NOT NULL;
