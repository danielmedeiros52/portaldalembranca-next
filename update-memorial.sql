-- Update the existing Francisco de Assis França memorial to set popular_name
UPDATE memorials 
SET popular_name = 'Chico Science', is_historical = true, visibility = 'public'
WHERE full_name LIKE '%Francisco de Assis França%';

-- Verify the update
SELECT id, full_name, popular_name, is_historical, visibility FROM memorials WHERE full_name LIKE '%Francisco%';
