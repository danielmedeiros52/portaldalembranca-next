# Neon Database - Quick Reference

## 🔐 Security Notice

**⚠️ IMPORTANT**: The credentials shown in your message should be **rotated immediately** since they were shared publicly!

To rotate:
1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Navigate to your project → Settings
3. Click "Reset Password"
4. Update the `DATABASE_URL` in Vercel with new credentials

---

## 📋 Your Neon Configuration

### For Vercel Production (Recommended)

Use this in **Vercel Environment Variables**:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

✅ **Why**: The `-pooler` connection works with Vercel's serverless functions and prevents "too many connections" errors.

### For Running Migrations

Use this **locally or in one-off scripts**:

```bash
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

✅ **Why**: Migrations require a direct connection without pgBouncer pooling.

---

## 🚀 Quick Setup for Vercel

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` | Use pooled connection |
| `JWT_SECRET` | `[generate new with: openssl rand -hex 32]` | Must be 32+ chars |
| `NODE_ENV` | `production` | Auto-set by Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Your deployment URL |

### Step 2: Run Migrations

**Before first deployment**, migrate your database:

```bash
# Set unpooled connection for migrations
export DATABASE_URL="postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
pnpm db:migrate
```

### Step 3: Deploy

```bash
git push origin main
```

Or manually:
```bash
vercel --prod
```

---

## 🔍 Connection String Breakdown

```
postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
           ↑          ↑                  ↑                                                   ↑          ↑
         user     password         host with pgBouncer pooling                           database   SSL required
```

### Key Parts:

- **User**: `neondb_owner` - Database owner role
- **Password**: `npg_Ys9Nq5nUgLTV` - **ROTATE THIS IMMEDIATELY!**
- **Host**: `ep-fragrant-brook-ac2wqyd8-pooler` - Pooled connection
- **Region**: `sa-east-1.aws.neon.tech` - South America (São Paulo)
- **Database**: `neondb` - Default database name
- **SSL Mode**: `require` - Encrypted connection (required for production)

---

## 🔄 When to Use Which Connection

### Use POOLED Connection (`-pooler`)

✅ Vercel production environment
✅ Any serverless function
✅ API routes in Next.js
✅ Multiple concurrent connections

**Why**: pgBouncer manages connection pooling, preventing "too many clients" errors in serverless environments.

### Use DIRECT Connection (no `-pooler`)

✅ Running database migrations
✅ Using Drizzle Studio
✅ One-off database scripts
✅ Long-running transactions

**Why**: Some operations require a direct connection without pooling middleware.

---

## 🛠️ Testing Your Connection

### Test from Local Machine

```bash
# Install postgres client (if not installed)
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql

# Test pooled connection
psql "postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# If successful, you'll see:
# neondb=>
```

### Test from Node.js

```javascript
import postgres from 'postgres';

const sql = postgres('postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

const result = await sql`SELECT NOW()`;
console.log(result);
```

---

## 📊 Monitoring Your Database

### In Neon Dashboard

View at: https://console.neon.tech/

Monitor:
- **Connections**: Current active connections
- **Storage**: Database size (0.5 GB free tier)
- **Compute**: CPU/memory usage
- **Data Transfer**: Monthly bandwidth (10 GB free tier)
- **Queries**: Performance metrics

### Auto-Pause Feature

Neon automatically pauses your database after **5 minutes** of inactivity on the free tier.

- ⏱️ First query after pause: ~1-2 second cold start
- 🚀 Subsequent queries: Normal speed
- 💰 Paused databases don't count against compute hours

---

## 💡 Optimization Tips

### Connection Pooling

Your `src/server/db.ts` should have:

```typescript
const _client = postgres(process.env.DATABASE_URL, {
  max: 1,  // Important for serverless
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false
});
```

### Query Optimization

- Use indexes on frequently queried columns
- Limit large result sets
- Cache repeated queries with React Query

### Cost Management

Free tier limits:
- ✅ 0.5 GB storage
- ✅ 10 GB data transfer/month
- ✅ Unlimited queries
- ✅ Auto-pause after inactivity

**Tip**: Neon's free tier is generous for development and small production apps!

---

## 🚨 Common Issues & Solutions

### "too many clients already"

**Problem**: Connection pool exhausted
**Solution**: Use pooled connection with `-pooler` in hostname

### "SSL SYSCALL error"

**Problem**: Missing `?sslmode=require`
**Solution**: Add SSL parameter to connection string

### "database does not exist"

**Problem**: Wrong database name
**Solution**: Verify database name is `neondb` in connection string

### "authentication failed"

**Problem**: Wrong credentials or expired
**Solution**: Reset password in Neon dashboard

---

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle with Neon Guide](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [Complete Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Environment Setup](./ENV_SETUP.md)

---

## ✅ Quick Checklist

Before deploying to production:

- [ ] Rotate database credentials (they were exposed!)
- [ ] Use pooled connection in Vercel (`-pooler` hostname)
- [ ] Add `?sslmode=require` to connection string
- [ ] Generate new `JWT_SECRET` (don't reuse dev secret)
- [ ] Run migrations with unpooled connection
- [ ] Test connection from Vercel deployment
- [ ] Monitor connection count in Neon dashboard

---

**⚠️ Remember**: Your current credentials were shared publicly and should be rotated immediately for security!
