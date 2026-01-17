# Environment Variables Setup

## Status: ✅ CONFIGURED FOR DEVELOPMENT

All required environment variables are properly configured for local development.

---

## Required Variables (Must be set)

### ✅ DATABASE_URL
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/portal_lembranca"
```
- **Status**: ✅ Configured
- **Purpose**: PostgreSQL connection string for Drizzle ORM
- **For Production**: Update with Neon or Vercel Postgres URL with `?sslmode=require`

### ✅ JWT_SECRET
```bash
JWT_SECRET="a2e839d99bb9b3dc5d6ef7177f1ac7f707eb0cf8989df472f8f8182ed77c1d35"
```
- **Status**: ✅ Configured (64 characters, exceeds 32 minimum)
- **Purpose**: Signs session tokens for authentication
- **For Production**: Generate new secret with `openssl rand -hex 32`

### ✅ NODE_ENV
```bash
NODE_ENV="development"
```
- **Status**: ✅ Configured
- **Purpose**: Environment mode (development/test/production)
- **For Production**: Vercel sets this automatically to "production"

---

## Optional Variables (Can be empty)

### OAuth Configuration (Optional)
```bash
OAUTH_SERVER_URL=""
OWNER_OPEN_ID=""
```
- **Status**: ⚠️ Not configured (optional)
- **Purpose**: External OAuth provider integration
- **Current**: Using email/password authentication only
- **Action**: Leave empty unless integrating external OAuth

### Stripe Payment Integration (Optional)
```bash
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```
- **Status**: ⚠️ Not configured (optional)
- **Purpose**: Payment processing for subscriptions
- **Current**: Returns mock payment intent if not set
- **Action**: Add when ready for payment processing

### Frontend Forge API (Optional)
```bash
NEXT_PUBLIC_FRONTEND_FORGE_API_KEY=""
NEXT_PUBLIC_FRONTEND_FORGE_API_URL=""
```
- **Status**: ⚠️ Not configured (optional)
- **Purpose**: Map integration for cemetery locations
- **Current**: Map component works without this
- **Action**: Add when integrating map features

### Analytics (Optional)
```bash
NEXT_PUBLIC_ANALYTICS_ENDPOINT=""
NEXT_PUBLIC_ANALYTICS_WEBSITE_ID=""
```
- **Status**: ⚠️ Not configured (optional)
- **Purpose**: Umami analytics tracking
- **Action**: Add when setting up analytics

### App Configuration
```bash
NEXT_PUBLIC_APP_TITLE="Portal da Lembrança"
NEXT_PUBLIC_APP_ID=""
```
- **Status**: ✅ Title configured, ID optional
- **Purpose**: Application branding

---

## Validation

The environment configuration is validated using `@t3-oss/env-nextjs` in `src/env.js`:

```typescript
server: {
  DATABASE_URL: z.string().url(),           // ✅ Required
  NODE_ENV: z.enum([...]).default("dev"),  // ✅ Required with default
  JWT_SECRET: z.string().min(32),          // ✅ Required (min 32 chars)
  OAUTH_SERVER_URL: z.string().url().optional(),
  OWNER_OPEN_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
}
```

**Build will fail if required variables are missing or invalid.**

---

## For Production Deployment (Vercel)

When deploying to Vercel, add these environment variables in the dashboard:

### Required
1. **DATABASE_URL** - Vercel Postgres or Neon connection string
   ```
   postgres://user:pass@host/db?sslmode=require
   ```

2. **JWT_SECRET** - Generate new production secret
   ```bash
   openssl rand -hex 32
   ```

3. **NODE_ENV** - Automatically set to "production" by Vercel

### Optional (Add as needed)
- STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- OAUTH_SERVER_URL / OWNER_OPEN_ID
- NEXT_PUBLIC_FRONTEND_FORGE_API_KEY / NEXT_PUBLIC_FRONTEND_FORGE_API_URL
- Analytics variables

---

## Quick Start Checklist

- [x] **DATABASE_URL** configured for local PostgreSQL
- [x] **JWT_SECRET** generated and set (64 chars)
- [x] **NODE_ENV** set to "development"
- [x] **NEXT_PUBLIC_APP_TITLE** set to "Portal da Lembrança"
- [x] All optional variables documented as empty
- [x] `.env.example` template available for reference

---

## Notes

- ✅ No sensitive data in `.env.example` (committed to git)
- ✅ `.env` is gitignored (not committed)
- ✅ Environment validation runs before build
- ✅ Empty strings treated as undefined (per env.js config)
- ⚠️ OAuth and Stripe integrations gracefully degrade when not configured

---

**Last Updated**: 2026-01-17
**Configuration Status**: ✅ Ready for Development
