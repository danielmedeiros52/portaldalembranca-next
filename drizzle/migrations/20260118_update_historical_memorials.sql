-- Update historical memorials with isHistorical flag and popularName
-- This migration ensures all historical memorials are properly marked and have popular names

-- Mark Chico Science as historical and set popular name (if not already set)
UPDATE "memorials" 
SET "is_historical" = true, "popular_name" = 'Chico Science'
WHERE "full_name" = 'Francisco de Assis França' AND "slug" = 'chico-science';

-- Add other historical memorials if they exist and update them
UPDATE "memorials" 
SET "is_historical" = true, "popular_name" = 'Recife Nogueira'
WHERE "full_name" LIKE '%Recife Nogueira%' AND "is_historical" = false;

UPDATE "memorials" 
SET "is_historical" = true, "popular_name" = 'Lampião do Nordeste'
WHERE "full_name" LIKE '%Virgulino Ferreira%' AND "is_historical" = false;

-- Ensure funeral home exists for historical memorials
UPDATE "memorials" 
SET "funeral_home_id" = (
  SELECT id FROM "funeral_homes" 
  WHERE "name" LIKE '%Memoriais Históricos%' 
  LIMIT 1
)
WHERE "is_historical" = true AND "funeral_home_id" IS NULL;
