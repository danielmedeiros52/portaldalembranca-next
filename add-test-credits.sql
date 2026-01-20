-- Add 3 test credits to all funeral homes
-- Run this to test the memorial credits feature

UPDATE funeral_homes
SET memorial_credits = 3
WHERE memorial_credits = 0;

-- Or if you want to add credits to a specific user:
-- UPDATE funeral_homes
-- SET memorial_credits = 3
-- WHERE email = 'your@email.com';

-- Check the results:
SELECT id, name, email, memorial_credits
FROM funeral_homes;
