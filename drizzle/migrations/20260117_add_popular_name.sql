CREATE TABLE IF NOT EXISTS memorials_backup AS TABLE memorials;

ALTER TABLE "memorials" 
ADD COLUMN "popular_name" varchar(255);

-- For Chico Science, set the popular name
UPDATE "memorials" 
SET "popular_name" = 'Chico Science' 
WHERE "full_name" LIKE 'Francisco de Assis França%' AND "is_historical" = true;
