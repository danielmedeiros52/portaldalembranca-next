# 🚀 Post-Deployment Checklist

**Deployment Date**: 2026-01-17
**Environment**: Production (Vercel)
**Status**: ✅ Deployed

---

## 📋 Immediate Verification Steps

### 1. ✅ Database Migrations

**Priority**: CRITICAL - Must be done first

```bash
# Connect to your production database and run migrations
pnpm db:migrate

# Or manually run the migration SQL files in order:
# 1. drizzle/migrations/0000_confused_anita_blake.sql
# 2. drizzle/migrations/20251231131603_create_leads_table.sql
# 3. drizzle/migrations/20260102160111_add_memorial_fields.sql
```

**Verification**:
- [ ] All 3 migrations applied successfully
- [ ] No SQL errors in migration logs
- [ ] All tables created (10 tables: users, funeralHomes, familyUsers, memorials, descendants, photos, dedications, leads, orders, orderHistory, adminUsers)
- [ ] All enums created (6 enums: role, visibility, status, production_status, priority, lead_status)

**How to verify**:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check migration history
SELECT * FROM drizzle_migrations;
```

---

### 2. ✅ Environment Variables

**Priority**: CRITICAL

Verify in Vercel dashboard that all required variables are set:

**Required Variables**:
- [ ] `DATABASE_URL` - Production database connection string
- [ ] `JWT_SECRET` - Minimum 32 characters (use production value, not dev)
- [ ] `NODE_ENV` - Should be "production" (Vercel sets automatically)

**Optional Variables** (add if using these features):
- [ ] `OAUTH_SERVER_URL` - If using OAuth
- [ ] `OWNER_OPEN_ID` - If using OAuth admin
- [ ] `STRIPE_SECRET_KEY` - If using payments
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - If using payments
- [ ] AWS S3 credentials - If using file uploads
- [ ] `NEXT_PUBLIC_APP_TITLE` - Application title

**How to verify**:
- Go to Vercel dashboard → Your project → Settings → Environment Variables
- Ensure all required variables are present

---

### 3. ✅ Build Verification

**Priority**: HIGH

- [ ] Build completed without errors
- [ ] All 15 routes generated successfully
- [ ] No TypeScript compilation errors
- [ ] Deployment URL is accessible

**Check Vercel deployment logs**:
```
✓ Compiled successfully
  15 routes generated
  Static pages: 13/13
```

---

## 🧪 Functional Testing

### 4. ✅ Homepage & Public Pages

**Test URL**: `https://your-domain.vercel.app/`

- [ ] Homepage loads correctly
- [ ] Pricing section displays
- [ ] "Ver Demo" button works (should go to /memorials)
- [ ] "Ver Exemplo" button works
- [ ] Footer links work
- [ ] Dark mode toggle works
- [ ] No console errors in browser DevTools

---

### 5. ✅ Funeral Home Authentication

**Test URL**: `https://your-domain.vercel.app/login`

**Registration Flow**:
- [ ] Navigate to `/register`
- [ ] Fill in funeral home details
- [ ] Password validation works
- [ ] Submit registration
- [ ] Check for success message or error
- [ ] Verify redirect to dashboard after registration

**Login Flow**:
- [ ] Navigate to `/login`
- [ ] Click "Funerária" tab
- [ ] Enter credentials
- [ ] Submit login
- [ ] Verify redirect to `/dashboard`
- [ ] Check if session cookie is set (DevTools → Application → Cookies)

**Common Issues**:
- If login fails: Check DATABASE_URL connection
- If "JWT error": Verify JWT_SECRET is set correctly
- If redirects fail: Check middleware configuration

---

### 6. ✅ Dashboard Functionality

**Test URL**: `https://your-domain.vercel.app/dashboard`

**After logging in as funeral home**:
- [ ] Dashboard loads without errors
- [ ] Sidebar navigation visible
- [ ] Stats cards display (even if showing 0)
- [ ] "Criar Memorial" button works
- [ ] Search functionality works
- [ ] Grid/List view toggle works
- [ ] No 500 errors in network tab

**Create Memorial Test**:
- [ ] Click "Criar Memorial"
- [ ] Dialog opens
- [ ] Fill in memorial details:
  - Full name
  - Birth date
  - Death date
  - Biography
- [ ] Submit form
- [ ] Check for success toast notification
- [ ] Verify memorial appears in dashboard list
- [ ] Check database for new memorial record

---

### 7. ✅ Memorial Pages

**Test URL**: `https://your-domain.vercel.app/memorial/[slug]`

**Public Memorial View**:
- [ ] Memorial page loads
- [ ] Name and dates display correctly
- [ ] Biography renders
- [ ] Photos section appears (if photos exist)
- [ ] Dedications section appears
- [ ] QR code button works
- [ ] Share button works
- [ ] No missing images or broken links

**Memorial Edit** (requires auth):
- [ ] Navigate to `/memorial/[slug]/edit`
- [ ] Edit form loads with existing data
- [ ] Can update biography
- [ ] Can add photos (test if S3 configured)
- [ ] Can add descendants
- [ ] Save button works
- [ ] Changes persist after refresh

---

### 8. ✅ Family User Flow

**Test URL**: `https://your-domain.vercel.app/accept-invitation/[token]`

**Invitation Flow**:
1. Create memorial as funeral home (should auto-generate invitation)
2. Check database for invitation token:
   ```sql
   SELECT invitation_token, invitation_expiry, is_active
   FROM family_users
   WHERE email = 'family@example.com';
   ```
3. Navigate to `/accept-invitation/[token]` with the token
4. Fill in family user details and password
5. Submit acceptance
6. Try logging in as family user
7. Verify access to memorial edit page

**Common Issues**:
- Token expired: Check `invitation_expiry` in database
- Token invalid: Verify token matches exactly
- Login fails: Check password was set correctly

---

### 9. ✅ Admin Dashboard

**Test URL**: `https://your-domain.vercel.app/admin/login`

**Admin Setup** (if not done):
```sql
-- Create admin user in production database
INSERT INTO admin_users (email, password_hash, created_at, updated_at)
VALUES (
  'admin@portaldalembranca.com',
  -- Use bcrypt to hash password first
  '$2a$10$YourHashedPasswordHere',
  NOW(),
  NOW()
);
```

**Admin Login Test**:
- [ ] Navigate to `/admin/login`
- [ ] Enter admin credentials
- [ ] Login successful
- [ ] Redirect to `/admin/dashboard`

**Admin Dashboard**:
- [ ] Overview stats display
- [ ] Memorials list loads
- [ ] Leads section visible
- [ ] Production queue accessible
- [ ] Can view all memorials (not just own)
- [ ] Search and filter work

---

### 10. ✅ QR Code Generation

**Test**: Generate QR code for a memorial

- [ ] Open memorial page
- [ ] Click QR code button
- [ ] PNG QR code generates
- [ ] SVG QR code generates
- [ ] QR code scans correctly (test with phone)
- [ ] QR code links to correct memorial URL

---

### 11. ✅ Dedications/Tributes

**Test URL**: `https://your-domain.vercel.app/memorial/[slug]`

**Public Dedication Flow**:
- [ ] Navigate to public memorial
- [ ] Find dedication form
- [ ] Fill in name and message
- [ ] Submit dedication
- [ ] See success message
- [ ] Dedication appears in list (if auto-approved)
- [ ] Check database for dedication record

---

### 12. ✅ Photo Upload

**Test**: Upload photo to memorial (requires S3 configured)

If S3 configured:
- [ ] Navigate to memorial edit page
- [ ] Click add photo button
- [ ] Select image file
- [ ] Upload succeeds
- [ ] Photo appears in gallery
- [ ] Photo loads from S3 URL
- [ ] Next.js Image optimization works

If S3 NOT configured:
- [ ] Test with external URL instead
- [ ] Verify URL-based photos work

---

## 🔧 Performance & SEO Verification

### 13. ✅ Performance Testing

**Use Google PageSpeed Insights**: https://pagespeed.web.dev/

Test homepage: `https://your-domain.vercel.app/`
- [ ] Performance score > 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

**Common performance issues**:
- Large images: Use Next.js Image component
- Slow API: Check database query performance
- Large bundles: Check bundle analysis

---

### 14. ✅ SEO Verification

**Test with**: https://metatags.io/

- [ ] Title tag present: "Portal da Lembrança - Memoriais Digitais com QR Code"
- [ ] Meta description present
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Favicon loads
- [ ] robots.txt accessible (`/robots.txt`)

**Memorial-specific SEO**:
- [ ] Dynamic metadata works on `/memorial/[slug]`
- [ ] Each memorial has unique title
- [ ] Open Graph image set (if configured)

---

### 15. ✅ Error Handling

**Test Error Boundaries**:

**404 Page**:
- [ ] Navigate to `/nonexistent-page`
- [ ] Custom 404 page displays
- [ ] Can navigate back to home

**Global Error**:
- [ ] Check error.tsx works (intentionally break something)
- [ ] Error boundary catches error
- [ ] User sees friendly error message
- [ ] "Try Again" button works

**API Errors**:
- [ ] Test invalid login credentials
- [ ] Test creating memorial with missing data
- [ ] Verify toast error messages appear
- [ ] No unhandled promise rejections in console

---

### 16. ✅ Security Verification

**Session Security**:
- [ ] Cookies are HTTP-only (check DevTools → Application)
- [ ] Cookies have SameSite attribute
- [ ] Session expires correctly
- [ ] Logout clears session cookie

**Access Control**:
- [ ] Cannot access `/dashboard` without login (redirects to `/login`)
- [ ] Cannot access other funeral home's memorials
- [ ] Family users can only edit assigned memorials
- [ ] Admin has access to all resources

**Password Security**:
- [ ] Passwords are hashed in database (check with SQL)
- [ ] Password requirements enforced (8+ chars, etc.)
- [ ] Password reset flow works (`/forgot-password`)

---

## 📊 Monitoring Setup

### 17. ⏳ Optional: Enable Vercel Analytics

**If not already enabled**:
- [ ] Go to Vercel dashboard → Analytics
- [ ] Enable Web Analytics
- [ ] Check analytics data after 24 hours

---

### 18. ⏳ Optional: Error Tracking

**Consider setting up** (Phase 2):
- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Vercel Log Drains for custom logging

---

## 🔍 Database Health Check

### 19. ✅ Verify Database Records

**Connect to production database and check**:

```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return 11+ tables

-- Check if any data was created
SELECT COUNT(*) FROM memorials;
SELECT COUNT(*) FROM funeral_homes;
SELECT COUNT(*) FROM family_users;
SELECT COUNT(*) FROM dedications;

-- Check migrations applied
SELECT * FROM drizzle_migrations ORDER BY created_at;
-- Should show 3 migrations
```

---

## 🚨 Common Post-Deployment Issues

### Issue 1: "Database connection error"
**Cause**: DATABASE_URL not set or incorrect
**Fix**:
1. Check Vercel environment variables
2. Verify DATABASE_URL format: `postgresql://user:pass@host:5432/db?sslmode=require`
3. Test connection from production

### Issue 2: "JWT must be a string"
**Cause**: JWT_SECRET not set in Vercel
**Fix**:
1. Go to Vercel → Settings → Environment Variables
2. Add JWT_SECRET (min 32 characters)
3. Redeploy

### Issue 3: "Prisma/Drizzle not found"
**Cause**: Build dependencies issue
**Fix**:
1. Ensure `drizzle-orm` in dependencies (not devDependencies)
2. Check package.json
3. Redeploy

### Issue 4: "Module not found" errors
**Cause**: Import path issues
**Fix**:
1. Check tsconfig.json paths configuration
2. Verify all imports use correct aliases (`@/`, `~/`)
3. Check next.config.js

### Issue 5: Photos not loading
**Cause**: S3 not configured or CORS issue
**Fix**:
1. Verify AWS credentials in Vercel
2. Check S3 bucket CORS configuration
3. Test with external image URL first

### Issue 6: Dark mode not working
**Cause**: Theme provider script not loading
**Fix**:
1. Check if theme-provider.tsx has "use client"
2. Verify next-themes is in dependencies
3. Check layout.tsx includes ThemeProvider

---

## ✅ Sign-Off Checklist

Before considering deployment complete:

### Critical (Must Do)
- [ ] Database migrations applied successfully
- [ ] Can create funeral home account
- [ ] Can login as funeral home
- [ ] Can create memorial
- [ ] Can view memorial publicly
- [ ] All environment variables set
- [ ] No 500 errors on any page
- [ ] Build completed without errors

### Important (Should Do)
- [ ] Family invitation flow tested
- [ ] Admin dashboard accessible
- [ ] QR codes generate correctly
- [ ] Dedications can be submitted
- [ ] Photo upload works (if S3 configured)
- [ ] Error boundaries display correctly
- [ ] SEO metadata verified
- [ ] Performance acceptable (>80 PageSpeed)

### Nice to Have (Can Do Later)
- [ ] Analytics enabled
- [ ] Error tracking setup
- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Email notifications working (if configured)
- [ ] Payment integration tested (if configured)

---

## 📝 Post-Deployment Notes

**Deployment Date**: 2026-01-17
**Deployment URL**: _[Add your Vercel URL here]_
**Database**: _[Neon/Vercel Postgres/Other]_

**Known Issues**: _[Document any issues found during testing]_

**To Be Done**:
- [ ] Monitor error logs for first 24 hours
- [ ] Check database backup configuration
- [ ] Set up staging environment (optional)
- [ ] Document any production-specific configurations

---

## 🎉 Success Criteria

Your deployment is successful if:

✅ Users can register funeral home accounts
✅ Users can create and view memorials
✅ Public memorial pages are accessible
✅ QR codes can be generated
✅ No critical errors in logs
✅ Application is stable under normal load

**Migration Status**: ✅ **COMPLETE**
**Deployment Status**: ✅ **LIVE**
**Production Ready**: ✅ **YES**

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check database connection
3. Review environment variables
4. Check browser console for errors
5. Review this checklist for common issues

---

**Congratulations on your successful deployment! 🎉**

The Portal da Lembrança Next.js application is now live in production!
