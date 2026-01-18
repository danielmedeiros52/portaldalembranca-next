-- First ensure funeral home for historical memorials exists
INSERT INTO funeral_homes (name, email, password_hash, phone, address, "createdAt", "updatedAt")
VALUES (
  'Portal da Lembrança - Memoriais Históricos',
  'historicos@portaldalembranca.com.br',
  '$2a$10$placeholder_hash_for_historical_account',
  '(81) 0000-0000',
  'Recife, Pernambuco, Brasil',
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Insert or update Chico Science historical memorial
INSERT INTO memorials (
  slug, full_name, popular_name, birth_date, death_date, birthplace, 
  filiation, biography, visibility, status, funeral_home_id, 
  is_historical, category, grave_location, "createdAt", "updatedAt"
) VALUES (
  'chico-science',
  'Francisco de Assis França',
  'Chico Science',
  '13/03/1966',
  '02/02/1997',
  'Recife, Pernambuco',
  'Filho de Severina Maia França e José Valdemar França',
  'Chico Science foi um cantor, compositor e líder da banda Chico Science & Nação Zumbi. Revolucionou a música brasileira ao criar o movimento manguebeat, fundindo ritmos regionais como maracatu e coco com rock, funk e hip hop. Sua obra influenciou gerações e colocou Recife no mapa da música mundial.',
  'public',
  'active',
  (SELECT id FROM funeral_homes WHERE email = 'historicos@portaldalembranca.com.br'),
  true,
  'histórico',
  'Recife, Pernambuco',
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET 
  popular_name = EXCLUDED.popular_name,
  is_historical = EXCLUDED.is_historical,
  visibility = EXCLUDED.visibility,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  grave_location = EXCLUDED.grave_location,
  "updatedAt" = now();

-- Update any existing memorials with is_historical=true to have is_historical flag set properly
UPDATE memorials 
SET is_historical = true, visibility = 'public', status = 'active'
WHERE slug IN ('chico-science', 'francisco-de-assis-franca', 'lampiao', 'recife-nogueira')
  AND is_historical IS NULL OR is_historical = false;

-- Ensure popular names are set for known historical figures
UPDATE memorials 
SET popular_name = 'Chico Science'
WHERE (full_name LIKE '%Francisco de Assis França%' OR slug = 'chico-science' OR slug = 'francisco-de-assis-franca')
  AND (popular_name IS NULL OR popular_name = '');

-- Verify data was inserted/updated
SELECT 'Historical Memorials Count:' as message, COUNT(*) as count FROM memorials WHERE is_historical = true;
SELECT 'Total Memorials Count:' as message, COUNT(*) as count FROM memorials;
SELECT 'Chico Science Data:' as check, id, slug, full_name, popular_name, is_historical, visibility FROM memorials WHERE slug LIKE '%chico%' OR full_name LIKE '%Francisco de Assis%' LIMIT 1;
