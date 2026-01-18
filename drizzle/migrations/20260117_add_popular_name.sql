-- Add popular_name column to memorials table
ALTER TABLE "memorials" 
ADD COLUMN IF NOT EXISTS "popular_name" varchar(255);

-- Populate popular names for known historical figures
-- Chico Science
UPDATE "memorials" 
SET "popular_name" = 'Chico Science'
WHERE "full_name" = 'Francisco de Assis França' AND "is_historical" = true AND "popular_name" IS NULL;

-- Recife Nogueira  
UPDATE "memorials" 
SET "popular_name" = 'Recife Nogueira'
WHERE "full_name" LIKE '%Recife Nogueira%' AND "is_historical" = true AND "popular_name" IS NULL;

-- Lampião
UPDATE "memorials" 
SET "popular_name" = 'Lampião do Nordeste'
WHERE "full_name" LIKE '%Virgulino Ferreira%' AND "is_historical" = true AND "popular_name" IS NULL;

