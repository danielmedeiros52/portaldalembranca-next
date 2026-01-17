# Vercel Deployment Guide with Neon Database

This guide covers deploying Portal da Lembrança to Vercel with Neon PostgreSQL database.

## 🚀 Quick Deploy

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables (see below)
4. Deploy!

---

## 📋 Environment Variables Configuration

### Required Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

#### Database Connection (Choose ONE)

**Option 1: Pooled Connection (Recommended for Vercel)**
```bash
DATABASE_URL=postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```
✅ Use this for most cases - pgBouncer connection pooling handles serverless connections efficiently

**Option 2: Direct Connection (For Migrations)**
```bash
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8.sa-east-1.aws.neon.tech/neondb?sslmode=require
```
⚠️ Only use for running migrations - direct connection without pooling

#### JWT Secret
```bash
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters-long
```
🔐 Generate with: `openssl rand -hex 32`

#### Node Environment
```bash
NODE_ENV=production
```
Vercel sets this automatically, but include it to be explicit.

### Optional Variables

#### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```
Used for QR code generation and absolute URLs.

#### AWS S3 (for file uploads)
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

#### OAuth (if using external authentication)
```bash
OAUTH_SERVER_URL=https://your-oauth-server.com
OWNER_OPEN_ID=your-owner-openid
```

#### Stripe (future feature)
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 🗄️ Database Setup on Neon

### Understanding Your Connection Strings

Neon provides different connection strings for different use cases:

| Variable | Purpose | When to Use |
|----------|---------|-------------|
| `DATABASE_URL` | Pooled connection via pgBouncer | ✅ **Production app** (Vercel functions) |
| `DATABASE_URL_UNPOOLED` | Direct connection | 🔧 Migrations, Drizzle Studio |
| `POSTGRES_PRISMA_URL` | Prisma-specific (with timeout) | ❌ Not needed (we use Drizzle) |

### Why Use Pooled Connection?

Vercel functions are **serverless** - they:
- Spin up and down frequently
- Create new database connections on each invocation
- Can quickly exhaust connection limits

**pgBouncer pooling** solves this by:
- Managing a pool of persistent connections
- Reusing connections across function invocations
- Preventing connection limit errors

### Connection String Breakdown

```
postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
           ↑          ↑                  ↑                                      ↑          ↑
         user     password            host (with -pooler)                    database   SSL required
```

**Important**:
- `-pooler` in hostname = pooled connection
- `?sslmode=require` = SSL encryption (required for production)

---

## 🔐 Security Best Practices

### Rotating Credentials

After sharing credentials (like you just did), **rotate them immediately**:

1. Go to Neon Dashboard → Your Project → Settings → Reset Password
2. Update `DATABASE_URL` in Vercel with new credentials
3. Redeploy to apply changes

### Environment Variable Management

✅ **Do**:
- Store credentials in Vercel environment variables
- Use different databases for dev/staging/production
- Rotate credentials periodically
- Limit database user permissions

❌ **Don't**:
- Commit `.env` file to git
- Share credentials in public forums/chats
- Use same credentials across environments
- Give database users more permissions than needed

---

## 📦 Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js configuration

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to **Settings → Environment Variables**
2. Add each variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon pooled connection string
   - **Environments**: Select Production, Preview, Development
3. Add `JWT_SECRET` (generate new one!)
4. Add other optional variables as needed

### Step 4: Run Database Migrations

**Before first deployment**, run migrations:

```bash
# Use unpooled connection for migrations
export DATABASE_URL="postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8.sa-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
pnpm db:migrate
```

Or use Neon's direct connection in your local `.env`:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_Ys9Nq5nUgLTV@ep-fragrant-brook-ac2wqyd8.sa-east-1.aws.neon.tech/neondb?sslmode=require
pnpm db:migrate
```

### Step 5: Deploy

Click **Deploy** in Vercel dashboard or:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🔍 Verifying Deployment

### Check Build Logs

In Vercel Dashboard → Deployments → Click your deployment → View Logs

Look for:
- ✅ Build completed successfully
- ✅ No database connection errors
- ✅ All routes generated

### Test Your Application

1. Visit your deployment URL: `https://your-app.vercel.app`
2. Test login functionality
3. Test memorial creation
4. Check database connectivity

### Common Issues

#### "Cannot connect to database"
- Check `DATABASE_URL` is set correctly
- Ensure `?sslmode=require` is in connection string
- Verify Neon database is active (not paused)

#### "JWT_SECRET is required"
- Set `JWT_SECRET` in Vercel environment variables
- Redeploy after adding

#### "Module not found" errors
- Clear build cache: Settings → Clear Cache → Redeploy
- Check `package.json` dependencies are correct

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with URL

### Preview Deployments

Each PR gets a unique URL:
```
https://your-app-git-feature-branch-username.vercel.app
```

Preview deployments use the same environment variables as production (unless you configure separately).

---

## 📊 Monitoring

### Vercel Analytics

Enable in: Project Settings → Analytics

Tracks:
- Page views
- Web Vitals (performance)
- Error rates

### Database Monitoring

In Neon Dashboard:
- Connection count
- Storage usage
- Query performance
- Active queries

---

## 💰 Cost Optimization

### Neon Free Tier
- 0.5 GB storage
- 10 GB data transfer
- Unlimited queries
- Auto-pause after 5 minutes inactivity

### Vercel Free Tier
- Unlimited deployments
- 100 GB bandwidth
- 6,000 GB-hours function execution
- Automatic HTTPS

**Both free tiers are sufficient for development and small-scale production!**

---

## 🔧 Advanced Configuration

### Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Add your domain: `portaldalembranca.com.br`
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### Environment-Specific Variables

Set different values for Production vs Preview:

1. Add variable
2. Check only "Production" or only "Preview"
3. Redeploy

Example:
- **Production**: `DATABASE_URL` = production Neon database
- **Preview**: `DATABASE_URL` = staging Neon database

### Build Commands (if needed)

Default is fine for this project, but you can customize:

```
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

---

## 🚨 Production Checklist

Before going live:

- [ ] ✅ Database migrations applied to production database
- [ ] ✅ `JWT_SECRET` set and unique (32+ characters)
- [ ] ✅ `DATABASE_URL` using pooled connection with `?sslmode=require`
- [ ] ✅ `NODE_ENV=production` set
- [ ] ✅ `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] ✅ AWS credentials configured (for file uploads)
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ All tests passing: `make utest`
- [ ] ✅ Build succeeds locally: `pnpm build`
- [ ] ✅ Test login flow on production
- [ ] ✅ Test memorial creation
- [ ] ✅ Test file uploads (if using S3)

---

## 📞 Troubleshooting

### Database Connection Pool Exhausted

If you see "sorry, too many clients already":

1. **Use pooled connection** (`-pooler` in hostname)
2. Check `src/server/db.ts` - ensure `max: 1` for connection pool
3. In Neon: Increase connection limit (paid plans)

### SSL/TLS Errors

Ensure connection string has `?sslmode=require`:
```bash
DATABASE_URL=postgresql://...?sslmode=require
```

### Build Fails on Vercel but Works Locally

1. Clear Vercel build cache
2. Check all environment variables are set
3. Verify `pnpm-lock.yaml` is committed
4. Check Node.js version compatibility

### Functions Timeout

Vercel limits:
- Free: 10s execution time
- Pro: 60s execution time

Optimize slow queries or upgrade plan.

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Drizzle with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)

---

## 🎉 You're Ready!

Your application is now configured for Vercel deployment with Neon database. Follow the steps above to deploy your memorial platform to production.

**Remember to rotate your database credentials** since they were shared in your message!
