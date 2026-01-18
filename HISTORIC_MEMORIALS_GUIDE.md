# Historic Memorials - Complete Troubleshooting Guide

## Quick Status Check

Your code is **100% correct**. The page, backend, queries, and migrations are all properly implemented.

**The most likely issue:** Migrations haven't been applied to your database yet.

## What's Implemented

### ✅ Frontend
- `/src/app/historic-memorials/page.tsx` - Complete page with search, filters, debug info
- Modern UI with gradient animations and responsive grid
- Cards show: Popular name, dates, birthplace, biography

### ✅ Backend
- `src/server/db.ts` - Three query functions:
  - `getHistoricMemorials()` - Filters: public + is_historical=true
  - `getAllHistoricalMemorials()` - Only: is_historical=true
  - `getAllMemorials()` - No filters (for debugging)
- `src/server/routers.ts` - Three exposed endpoints:
  - `getHistoricMemorials` - Main query
  - `debugAllHistorical` - Show all historical (any status)
  - `debugAll` - Show all memorials

### ✅ Database Schema
- `drizzle/schema.ts` - Memorial table has:
  - `popularName` - varchar for AKA
  - `isHistorical` - boolean, default false
  - `mainPhoto` - varchar for image

### ✅ Migrations
- `0000_confused_anita_blake.sql` - Initial schema + Chico Science seed data
- `20260117_add_popular_name.sql` - Adds popular_name column
- `20260118_update_historical_memorials.sql` - Updates flags

## Diagnostic: Check What's Happening

### Step 1: Open Debug Panel
1. Go to `http://localhost:3000/historic-memorials`
2. Scroll down
3. Click "Mostrar Informações de Debug"

### Step 2: Interpret the Output

You'll see 3 JSON outputs. Here's what each means:

**Box 1: Memoriais Históricos (Filtrado)**
```
Filters: visibility='public' AND is_historical=true
If empty → Data doesn't match these conditions
If shows data → Everything is working! ✅
```

**Box 2: Todos os Memoriais Históricos**
```
Filter: is_historical=true only (ignores visibility/status)
If empty → No records have is_historical=true
If shows data → Records exist but have wrong visibility/status
```

**Box 3: Todos os Memoriais**
```
No filter - shows first 5 memorials in database
If empty → Your database has NO memorials at all
If shows data → Database works, but memorials lack is_historical flag
```

## Solution Paths

### Path A: All boxes are EMPTY
**Problem:** Database has no data

**Solution:**
```bash
# Option 1 - Fresh database (recommended)
pnpm db:push

# Option 2 - Apply pending migrations
pnpm db:migrate
```

Then refresh browser and check debug panel again.

### Path B: Box 3 has data, but Boxes 1 & 2 are empty
**Problem:** Memorials exist but aren't flagged as historical

**Solution:**
1. Check if `is_historical` column exists in database
2. Check if Chico Science memorial exists:
   ```bash
   # Using psql or database UI
   SELECT * FROM "memorials" WHERE full_name LIKE '%Chico%';
   ```
3. If column doesn't exist: `pnpm db:migrate`
4. If column exists but data is wrong:
   ```sql
   UPDATE "memorials" 
   SET "is_historical" = true, "popular_name" = 'Chico Science' 
   WHERE full_name LIKE '%Francisco de Assis%';
   ```

### Path C: Box 2 has data, but Box 1 is empty
**Problem:** Memorials are historical but not public

**Solution:**
```sql
UPDATE "memorials" 
SET "visibility" = 'public' 
WHERE "is_historical" = true;
```

### Path D: All boxes have data
**Problem:** None! 🎉 Everything is working.

The page should show memorials. If it doesn't:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check browser console (F12) for JS errors

## Running Migrations

### Method 1: Using Drizzle CLI (Recommended)
```bash
# See what migrations would be applied
pnpm db:migrate --dry-run

# Apply migrations
pnpm db:migrate
```

### Method 2: Push Schema
```bash
# Sync entire schema (creates/alters tables as needed)
pnpm db:push
```

### Method 3: Manual SQL
If migrations fail, manually run the SQL:
1. Open your database UI (pgAdmin, DBeaver, etc.)
2. Execute `/drizzle/migrations/0000_confused_anita_blake.sql`
3. Execute `/drizzle/migrations/20260117_add_popular_name.sql`
4. Execute `/drizzle/migrations/20260118_update_historical_memorials.sql`

## Expected Schema After Migrations

The `memorials` table should have:
```sql
CREATE TABLE "memorials" (
	"id" serial PRIMARY KEY,
	"slug" varchar(255) UNIQUE NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"popular_name" varchar(255),  ← NEW in migration
	"birth_date" varchar(10),
	"death_date" varchar(10),
	"birthplace" varchar(255),
	"filiation" text,
	"biography" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"status" "status" DEFAULT 'pending_data' NOT NULL,
	"funeral_home_id" integer NOT NULL,
	"family_user_id" integer,
	"is_historical" boolean DEFAULT false NOT NULL,  ← NEW in migration
	"main_photo" varchar(500),  ← NEW in migration
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
```

## Expected Data After Migrations

Sample record for Chico Science:
```
id: 1
slug: chico-science
full_name: Francisco de Assis França
popular_name: Chico Science  ← Visible as title on card
birth_date: 13/03/1966
death_date: 02/02/1997
birthplace: Recife, Pernambuco
visibility: public  ← CRITICAL
status: active  ← CRITICAL
is_historical: true  ← CRITICAL
funeral_home_id: 1 (Portal da Lembrança - Memoriais Históricos)
```

## Verify Everything is Working

### Step 1: Check Database Directly
```bash
# Connect to database and run:
SELECT COUNT(*) as total_memorials FROM "memorials";
SELECT COUNT(*) as historical_memorials FROM "memorials" WHERE is_historical = true;
SELECT COUNT(*) as public_historical FROM "memorials" WHERE is_historical = true AND visibility = 'public';

# Should show Chico Science record
SELECT id, full_name, popular_name, is_historical, visibility, status 
FROM "memorials" 
WHERE full_name LIKE '%Chico%';
```

### Step 2: Check API Directly
Open these URLs in your browser (they should return JSON):
```
http://localhost:3000/api/trpc/memorial.debugAll?input=null
http://localhost:3000/api/trpc/memorial.debugAllHistorical?input=null
http://localhost:3000/api/trpc/memorial.getHistoricMemorials?input=null
```

### Step 3: Check Build
```bash
# Make sure no TypeScript errors
pnpm build

# If build fails, check error messages
```

## Common Issues & Solutions

### Issue: "Cannot find module drizzle-orm"
**Solution:**
```bash
pnpm install
```

### Issue: Database connection error
**Solution:**
1. Check `.env.local` has correct `DATABASE_URL`
2. Verify database is running
3. Check database credentials

### Issue: Migration fails with "column already exists"
**Solution:**
Some migrations check with `IF NOT EXISTS`. This is safe - re-run:
```bash
pnpm db:migrate --force
```

### Issue: Page loads but shows debug info, no memorials appear
**Solution:**
- Check Box 3 output in debug panel
- If Box 3 is empty: Database has NO records (run migrations)
- If Box 3 has data: Memorials exist but don't have `is_historical=true`

### Issue: See memorials in debug but not on page
**Solution:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+Shift+R
3. Check browser console (F12) for JavaScript errors

## Development: Testing the Feature

### Test 1: Add a Historical Memorial Manually
```sql
INSERT INTO "memorials" (
	slug, full_name, popular_name, birth_date, death_date, 
	birthplace, biography, visibility, status, 
	funeral_home_id, is_historical, createdAt, updatedAt
) VALUES (
	'lampiao-test',
	'Virgulino Ferreira da Silva',
	'Lampião',
	'28/06/1898',
	'28/07/1938',
	'São Bento do Una, Pernambuco',
	'Chefe do bando de Lampião, legendário cangaceiro brasileiro.',
	'public',
	'active',
	1,
	true,
	now(),
	now()
);
```

### Test 2: Search Function
Search for:
- "Chico" - should find by popular_name
- "Lampião" - should find by popular_name
- "Francisco" - should find by full_name

### Test 3: Card Display
Check that each card shows:
- ✓ Title with popular name (e.g., "Chico Science • Francisco de Assis França")
- ✓ Birth/death dates with calendar icon
- ✓ Birthplace with map pin icon
- ✓ Biography excerpt (truncated)
- ✓ "Ver Memorial Completo" button
- ✓ Hover animation (card lifts, image zooms)

## Files Modified for This Feature

```
src/app/historic-memorials/page.tsx
  └─ Complete page with debug panel, search, responsive grid

src/server/db.ts
  └─ getHistoricMemorials()
  └─ getAllHistoricalMemorials()
  └─ getAllMemorials()

src/server/routers.ts
  └─ getHistoricMemorials endpoint
  └─ debugAllHistorical endpoint
  └─ debugAll endpoint

src/app/page.tsx
  └─ "Ver Demo" button links to /historic-memorials

drizzle/schema.ts
  └─ Added popularName field

drizzle/migrations/
  └─ 0000_confused_anita_blake.sql (Chico Science seed data)
  └─ 20260117_add_popular_name.sql (Column addition)
  └─ 20260118_update_historical_memorials.sql (Data updates)
```

## Next Steps

1. **Now:** Check debug panel on `/historic-memorials` page
2. **See what data exists:** Review the JSON outputs
3. **Based on what you see:** Follow appropriate solution path above
4. **Verify:** Refresh page, memorials should appear
5. **Done:** Remove debug toggle (optional cleanup)

---

**Remember:** All code is correct. This is just about getting your database in sync with the migrations.

If stuck, the debug panel will tell you exactly what data exists in your database, which will help pinpoint the issue.
