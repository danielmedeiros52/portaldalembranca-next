-- Populate popular_name for all historical memorials
-- This ensures historical figures are displayed with their popular/known names prominently

-- Chico Science
UPDATE "memorials" 
SET "popular_name" = 'Chico Science'
WHERE ("full_name" = 'Francisco de Assis França' OR "slug" = 'francisco-de-assis-franca' OR "slug" = 'chico-science')
  AND "is_historical" = true 
  AND ("popular_name" IS NULL OR "popular_name" = '');

-- Lampião (if exists)
UPDATE "memorials" 
SET "popular_name" = 'Lampião'
WHERE ("full_name" LIKE '%Virgulino Ferreira%' OR "full_name" LIKE '%Lampião%')
  AND "is_historical" = true 
  AND ("popular_name" IS NULL OR "popular_name" = '');

-- Recife Nogueira (if exists)
UPDATE "memorials" 
SET "popular_name" = 'Recife Nogueira'
WHERE ("full_name" LIKE '%Recife Nogueira%')
  AND "is_historical" = true 
  AND ("popular_name" IS NULL OR "popular_name" = '');

-- Ensure all historical memorials have visibility='public' and status='active'
UPDATE "memorials"
SET "visibility" = 'public', "status" = 'active'
WHERE "is_historical" = true;
