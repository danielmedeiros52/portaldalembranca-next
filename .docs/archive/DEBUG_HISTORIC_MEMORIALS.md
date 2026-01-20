# Debugging Historic Memorials Issue

## Problem
The `/historic-memorials` page shows "Nenhum memorial disponível" (No memorial available) even though the code is correct.

## Solution Steps

### Step 1: Check Debug Info on the Page
1. Open `/historic-memorials` in your browser
2. Scroll to the bottom
3. Click "Mostrar Informações de Debug" button
4. You'll see three JSON outputs:

**Output 1: "Memoriais Históricos (Filtrado)"**
- This shows memorials with `visibility='public'` AND `is_historical=true`
- **If empty**: The data doesn't exist with these exact conditions

**Output 2: "Todos os Memoriais Históricos (Sem Status/Visibility)"**
- This shows ALL memorials with `is_historical=true` (ignoring visibility/status)
- **If empty**: No memorials have `is_historical=true` in your database
- **If not empty**: Your memorials exist but have wrong `visibility` or `status`

**Output 3: "Todos os Memoriais (Sem Filtro)"**
- This shows the first 5 memorials in the entire database
- **If empty**: Your database has NO memorials at all
- **If shows data**: You have memorials but they're missing `is_historical=true`

### Step 2: Interpret Results

#### Scenario A: All outputs are EMPTY
→ Your database has NO data
**Solution**: Run migrations to seed data
```bash
pnpm db:push
```

#### Scenario B: Output 3 has data, but 1 & 2 are empty
→ You have memorials but they're not marked as historical
**Solution**: 
1. Check if migrations were applied: `pnpm db:migrate`
2. The `is_historical` column needs to exist and be set to `true`

#### Scenario C: Output 2 has data, but Output 1 is empty  
→ Memorials have `is_historical=true` but wrong `visibility`
**Solution**: Update memorial visibility to 'public'
```sql
UPDATE "memorials" SET "visibility" = 'public' WHERE "is_historical" = true;
```

#### Scenario D: All outputs have data
→ Everything is working correctly! Page should show memorials

### Step 3: Run Migrations
If your database is empty or missing the `is_historical` column:

**Option A - Fresh database:**
```bash
pnpm db:push
```

**Option B - Existing database with schema:**
```bash
pnpm db:migrate
```

### Step 4: Verify Schema
Check if your database has these columns:
- `is_historical` (boolean, default false)
- `popular_name` (varchar)
- `main_photo` (varchar)

If missing, the migrations didn't apply.

### Step 5: Verify Seed Data
After migrations, check if Chico Science memorial was created:
```sql
SELECT id, full_name, popular_name, is_historical, visibility FROM "memorials" WHERE full_name LIKE '%Chico%';
```

Should show:
- `is_historical`: true
- `visibility`: public
- `popular_name`: "Chico Science"

### Still Not Working?

#### Check tRPC connection:
Open browser console (F12) and look for any network errors when loading `/historic-memorials`

#### Verify Router Endpoints Exist:
These endpoints should work:
- `/api/trpc/memorial.getHistoricMemorials`
- `/api/trpc/memorial.debugAllHistorical` 
- `/api/trpc/memorial.debugAll`

Try in browser: `http://localhost:3000/api/trpc/memorial.debugAll?input=null`

#### Check Database Connection:
Verify your database URL is set correctly in `.env.local`

#### Clear Cache:
```bash
pnpm db:generate  # Regenerate Drizzle client
```

## Advanced Debugging

### Direct Database Query
Run this in your database tool (pgAdmin, DBeaver, etc.):
```sql
-- Check if is_historical column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name='memorials' AND column_name LIKE '%historical%';

-- Check historical memorials
SELECT id, full_name, popular_name, is_historical, visibility, status
FROM "memorials" 
WHERE is_historical = true;

-- Check all memorials
SELECT COUNT(*), is_historical, visibility, status
FROM "memorials"
GROUP BY is_historical, visibility, status;
```

### Check Migrations Status
```bash
# See migration history
pnpm db:migrate --dry-run

# See current schema
pnpm db:generate
```

## Key Migration Files

These should have been applied to your database:

1. **20260117_add_popular_name.sql**
   - Adds `popular_name` column
   - Updates Chico Science and other historical figures

2. **20260118_update_historical_memorials.sql**
   - Sets `is_historical=true` for historical figures
   - Ensures correct funeral_home_id

3. **0000_confused_anita_blake.sql** (Initial seed)
   - Creates initial data with `is_historical=true` for Chico Science

## Success Indicators

✅ Page shows memorials
✅ Card displays with popular name (e.g., "Chico Science • Francisco de Assis França")
✅ Cards are clickable and navigate to memorial detail page
✅ Search works to filter by name or biography
✅ No console errors in browser DevTools

## Contact / Support
If issues persist after following these steps, check:
1. Database logs for migration errors
2. Backend logs for query errors
3. Network tab in DevTools for API errors
