# Database Setup Guide

## Migration Status

The Next.js project has **3 migration files** copied from the original Vite project:

1. `0000_confused_anita_blake.sql` - Initial schema (all core tables)
2. `20251231131603_create_leads_table.sql` - Leads table for landing page
3. `20260102160111_add_memorial_fields.sql` - Additional memorial fields

---

## Database Commands

### Development (Local PostgreSQL)

```bash
# Generate new migrations after schema changes
npm run db:generate

# Push schema directly to database (development only)
npm run db:push

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio for database inspection
npm run db:studio
```

### Production (Neon/Vercel Postgres)

```bash
# Apply migrations to production database
# Make sure DATABASE_URL points to production
npm run db:migrate
```

---

## Initial Setup

### Option 1: Fresh Database with Migrations (Recommended)

If you have a clean PostgreSQL database:

```bash
# 1. Ensure DATABASE_URL is set in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/portal_lembranca"

# 2. Apply all migrations in order
npm run db:migrate

# 3. (Optional) Seed with historical data
npm run db:seed:historical
```

### Option 2: Direct Schema Push (Development)

If you're in active development and want to skip migrations:

```bash
# Push schema directly (overwrites existing schema)
npm run db:push
```

⚠️ **Warning**: `db:push` is for development only. Use `db:migrate` for production.

---

## Schema Overview

The database schema is defined in `drizzle/schema.ts`:

### Core Tables

**users** - OAuth users (SDK integration)
- openId (unique identifier)
- name, email, role
- loginMethod, timestamps

**funeralHomes** - Funeral home accounts
- email/password authentication
- name, phone, address
- Relationship: Creates memorials

**familyUsers** - Family member accounts
- email/password authentication
- invitationToken for onboarding
- isActive flag
- Relationship: Manages memorials

**memorials** - Core memorial records
- slug (unique URL identifier)
- fullName, birthDate, deathDate
- biography, mainPhoto
- visibility (public/private)
- status (active/pending_data/inactive)
- funeralHomeId, familyUserId

### Related Tables

**descendants** - Children/grandchildren relationships
- memorialId → memorials
- name, relationship, description

**photos** - Memorial photo gallery
- memorialId → memorials
- url, caption, order

**dedications** - Public tribute messages
- memorialId → memorials
- authorName, message, isApproved

### Admin Tables

**leads** - Contact requests from landing page
- name, email, phone, message
- status (pending/contacted/converted/rejected)

**orders** - Production queue for memorial creation
- memorialId, funeralHomeId, familyUserId
- productionStatus (new → in_production → waiting_data → ready → delivered)
- priority (low/normal/high/urgent)

**orderHistory** - Audit trail for order status changes
- orderId → orders
- status, notes, timestamp

**adminUsers** - System administrators
- email/password authentication
- lastLogin tracking

---

## Migration Files Explained

### 0000_confused_anita_blake.sql
Initial schema setup with all core tables:
- users, funeralHomes, familyUsers
- memorials, descendants, photos, dedications
- adminUsers, orders, orderHistory
- All enums: role, visibility, status, production_status, priority, lead_status

### 20251231131603_create_leads_table.sql
Adds leads table for landing page contact forms:
- Captures prospect information
- Tracks conversion status

### 20260102160111_add_memorial_fields.sql
Enhances memorials table with:
- isHistorical flag (for historical figures)
- category field (classification)
- graveLocation field (cemetery location)

---

## Verifying Migration Status

To check which migrations have been applied:

```sql
-- Connect to your database and run:
SELECT * FROM drizzle_migrations;
```

This table is automatically created by Drizzle and tracks applied migrations.

---

## Common Issues

### Issue: "relation does not exist"
**Solution**: Migrations haven't been applied yet
```bash
npm run db:migrate
```

### Issue: "duplicate key value violates unique constraint"
**Solution**: Database already has data, check if migrations were already applied
```bash
npm run db:studio
# Inspect the drizzle_migrations table
```

### Issue: "password authentication failed"
**Solution**: Check DATABASE_URL in .env has correct credentials
```bash
# Test connection:
psql "postgresql://postgres:password@localhost:5432/portal_lembranca"
```

---

## Production Deployment

### Pre-Deployment Checklist

1. **Set Production DATABASE_URL**
   ```bash
   # In Vercel dashboard, add environment variable:
   DATABASE_URL="postgres://user:pass@host/db?sslmode=require"
   ```

2. **Run Migrations on Production Database**
   ```bash
   # Temporarily set DATABASE_URL to production in .env
   # Then run:
   npm run db:migrate

   # Or use Drizzle Kit directly:
   npx drizzle-kit migrate
   ```

3. **Verify Schema**
   ```bash
   npm run db:studio
   # Check all tables exist and have correct structure
   ```

4. **Backup Before Changes**
   ```bash
   # For Neon/Vercel Postgres, use their dashboard to create backup
   # Or pg_dump:
   pg_dump DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

---

## Database Configuration

### drizzle.config.ts
```typescript
{
  schema: "./drizzle/schema.ts",      // Source of truth
  out: "./drizzle/migrations",        // Migration files output
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,            // From .env
  },
}
```

### Connection Details
- **Driver**: @neondatabase/serverless (works with all PostgreSQL)
- **ORM**: Drizzle with PostgreSQL dialect
- **Pooling**: Single connection, lazy initialization
- **SSL**: Required for production (add `?sslmode=require` to URL)

---

## Next Steps

### If database is NOT set up yet:

1. Create PostgreSQL database locally or on Neon/Vercel
2. Set DATABASE_URL in .env
3. Run `npm run db:migrate` to apply all 3 migrations
4. Run `npm run db:studio` to verify tables exist
5. (Optional) Seed with test data

### If database is already set up:

1. Verify connection: `npm run db:studio`
2. Check migrations table to see what's applied
3. If schema is outdated, run `npm run db:migrate`

---

**Last Updated**: 2026-01-17
**Migration Files**: 3 (all copied from original project)
**Schema Version**: Latest (includes historical memorials and leads table)
