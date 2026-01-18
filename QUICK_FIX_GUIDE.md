# Quick Steps to Fix Historical Memorials Display

## The Issue
Historical memorials weren't showing because the database schema was updated but the seed data wasn't updated to match.

## What Was Fixed
All migration files have been updated to ensure the historical memorials are created with the correct schema:

1. ✅ **0000_confused_anita_blake.sql** - Updated seed data to include `popular_name` and `is_historical`
2. ✅ **20260117_add_popular_name.sql** - Enhanced with proper population logic
3. ✅ **20260118_update_historical_memorials.sql** - New migration to ensure all historical data is correct

## To Apply the Fix

### Option 1: Fresh Database Setup
```bash
# Delete .next and node_modules if you want a clean slate
rm -r .next node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Push schema to database
pnpm db:push
```

### Option 2: Apply Migrations to Existing Database
```bash
# Apply migrations
pnpm db:migrate

# Or push the schema
pnpm db:push
```

### Option 3: Manual Database Update (if migrations don't work)
```sql
-- Ensure Chico Science memorial exists and is marked as historical
INSERT INTO "memorials" (
  "slug", "full_name", "popular_name", "birth_date", "death_date",
  "birthplace", "filiation", "biography", "visibility", "status",
  "funeral_home_id", "is_historical", "createdAt", "updatedAt"
)
VALUES (
  'chico-science',
  'Francisco de Assis França',
  'Chico Science',
  '13/03/1966',
  '02/02/1997',
  'Recife, Pernambuco',
  'Filho de Severina Maia França e José Valdemar França',
  'Chico Science foi um cantor, compositor e líder da banda Chico Science & Nação Zumbi...',
  'public',
  'active',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  is_historical = true,
  popular_name = 'Chico Science';
```

## Verify the Fix
1. Run your application: `pnpm dev` or `pnpm start`
2. Navigate to `/historic-memorials`
3. You should see the Chico Science memorial card displayed

## What Changed
- Initial migration now includes `popular_name` and `is_historical` in INSERT
- Popular name migration safely adds the column and populates data
- New update migration ensures all historical memorials are marked correctly

## Files Updated
- `drizzle/migrations/0000_confused_anita_blake.sql`
- `drizzle/migrations/20260117_add_popular_name.sql`
- `drizzle/migrations/20260118_update_historical_memorials.sql` (NEW)

## Historical Memorials Now Show
The `/historic-memorials` page will now display all memorials with:
- `is_historical = true`
- Proper `popularName` for famous figures
- All required fields populated correctly

---

**Status**: ✅ Ready to deploy
**No breaking changes**: ✅ All changes are safe and backward compatible
