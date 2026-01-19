-- Mark prominent historical figures as featured
UPDATE "memorials"
SET "is_featured" = true
WHERE "slug" IN (
  'joaquim-nabuco',           -- Major abolitionist, diplomat
  'miguel-arraes-de-alencar', -- Important political figure
  'francisco-de-assis-franca', -- Chico Science - Revolutionary musician
  'eduardo-henrique-accioly-campos' -- Eduardo Campos - Modern political figure
);
