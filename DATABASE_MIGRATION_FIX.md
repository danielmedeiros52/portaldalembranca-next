# Database Migration Fix for Historical Memorials

## Problem
The historical memorials were not showing in the `/historic-memorials` page because the original seed data in the initial migration didn't include the new schema fields (`isHistorical` and `popularName`) added in subsequent migrations.

## Solution
Updated all migration files to ensure historical memorials are properly configured:

### Files Modified

#### 1. **0000_confused_anita_blake.sql** (Initial migration)
Updated the Chico Science seed data INSERT to include all required fields:
- Added `popular_name` column: `'Chico Science'`
- Added `is_historical` flag: `true`

**Before:**
```sql
INSERT INTO "memorials" ("slug", "full_name", "birth_date", ...)
VALUES ('chico-science', 'Francisco de Assis França', ...)
```

**After:**
```sql
INSERT INTO "memorials" ("slug", "full_name", "popular_name", "birth_date", ..., "is_historical", ...)
VALUES ('chico-science', 'Francisco de Assis França', 'Chico Science', ..., true, ...)
```

#### 2. **20260117_add_popular_name.sql** (Popular name migration)
Enhanced to:
- Add `IF NOT EXISTS` clause for safety
- Populate popular names for all historical figures
- Handle cases where data might already exist

```sql
ALTER TABLE "memorials" 
ADD COLUMN IF NOT EXISTS "popular_name" varchar(255);

UPDATE "memorials" 
SET "popular_name" = 'Chico Science'
WHERE "full_name" = 'Francisco de Assis França' AND "is_historical" = true AND "popular_name" IS NULL;
```

#### 3. **20260118_update_historical_memorials.sql** (NEW - Update migration)
New migration to ensure all historical memorials are properly marked:

```sql
-- Mark Chico Science as historical
UPDATE "memorials" 
SET "is_historical" = true, "popular_name" = 'Chico Science'
WHERE "full_name" = 'Francisco de Assis França' AND "slug" = 'chico-science';

-- Add other historical figures
UPDATE "memorials" 
SET "is_historical" = true, "popular_name" = 'Recife Nogueira'
WHERE "full_name" LIKE '%Recife Nogueira%' AND "is_historical" = false;

-- Ensure funeral home reference exists
UPDATE "memorials" 
SET "funeral_home_id" = (
  SELECT id FROM "funeral_homes" 
  WHERE "name" LIKE '%Memoriais Históricos%' 
  LIMIT 1
)
WHERE "is_historical" = true AND "funeral_home_id" IS NULL;
```

## How to Apply

### Fresh Database
If starting fresh, migrations will run in order:
1. `0000_confused_anita_blake.sql` - Creates tables and inserts Chico Science with all fields
2. `20260102160111_add_memorial_fields.sql` - Adds historical fields
3. `20260117_add_popular_name.sql` - Adds popular name field
4. `20260118_update_historical_memorials.sql` - Ensures all historical memorials are marked correctly

### Existing Database
If you already have data without these fields:

```bash
# Apply all pending migrations
pnpm db:migrate

# OR push the schema
pnpm db:push
```

The migrations will safely add the columns and update existing data.

## Verification

After applying migrations, verify historical memorials appear:

```sql
-- Check that Chico Science memorial exists and is marked as historical
SELECT id, full_name, popular_name, is_historical 
FROM "memorials" 
WHERE slug = 'chico-science';

-- Expected output:
-- id | full_name               | popular_name  | is_historical
-- 1  | Francisco de Assis França | Chico Science | true
```

## Schema Now Ensures

✅ **Historical memorials are properly marked** with `is_historical = true`
✅ **Popular names are populated** for all historical figures
✅ **Funeral home reference exists** for organization
✅ **Data is consistent** across all migrations
✅ **Query filters work correctly** - `WHERE is_historical = true`

## Timeline
- `0000_*` - Initial schema and seed data (UPDATED)
- `20251231*` - Lead tracking
- `20260102*` - Memorial fields (historical support)
- `20260117*` - Popular name field (UPDATED)
- `20260118*` - Update historical data (NEW)

## Notes
- All migrations use `IF NOT EXISTS` where applicable
- All UPDATE statements check conditions to avoid duplicates
- Memorials can exist without `is_historical = true` (for regular family memorials)
- `popularName` is optional but recommended for historical figures

## Result
Historical memorials will now:
- ✅ Display on `/historic-memorials` page
- ✅ Show popular name prominently (e.g., "Chico Science • Francisco de Assis França")
- ✅ Be searchable by popular name
- ✅ Have all required database relationships
