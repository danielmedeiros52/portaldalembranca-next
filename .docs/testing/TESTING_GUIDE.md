# Authentication Testing Guide

**Server Running**: http://localhost:3002 ⚠️ (Port changed - 3000 was in use)
**Date**: 2026-01-17
**Latest Fix**: SSL connection bug fixed - Neon database now properly connects in development

---

## 🧪 Test Plan

### Test 1: Funeral Home Registration (NEW USER)

**Steps**:
1. Open browser: http://localhost:3002/register
2. Fill in the form:
   - **Name**: Test Funeral Home
   - **Email**: funeral@test.com (use unique email)
   - **Password**: password123
   - **Phone**: (11) 98765-4321 (optional)
   - **Address**: Rua Teste, 123 (optional)
3. Click "Registrar" / "Sign Up"

**Expected Results**:
- ✅ Form submits without errors
- ✅ Redirects to `/dashboard`
- ✅ Dashboard shows funeral home name
- ✅ Refresh page - should STAY logged in
- ✅ Check browser DevTools → Application → Cookies → `session` cookie exists

**If it fails**:
- Check browser console for errors
- Check terminal for server errors
- Look for "Cannot find module jose" error (should NOT appear now)

---

### Test 2: Funeral Home Login (EXISTING USER)

**Prerequisites**: Use the account created in Test 1

**Steps**:
1. Logout (if logged in): Click logout button
2. Go to: http://localhost:3002/login
3. Enter credentials:
   - **Email**: funeral@test.com
   - **Password**: password123
4. Click "Entrar" / "Login"

**Expected Results**:
- ✅ Login succeeds without errors
- ✅ Redirects to `/dashboard`
- ✅ Dashboard shows correct user name
- ✅ Session persists on refresh

---

### Test 3: Family User Registration

**Steps**:
1. Go to: http://localhost:3002/register (select Family User tab if exists)
   OR: http://localhost:3002/family/register
2. Fill in the form:
   - **Name**: João Silva
   - **Email**: joao@test.com
   - **Password**: password123
   - **Phone**: (11) 91234-5678 (optional)
3. Click "Registrar"

**Expected Results**:
- ✅ Registration succeeds
- ✅ Redirects to dashboard or profile page
- ✅ Session cookie created
- ✅ Can access family dashboard

---

### Test 4: Family User Login

**Prerequisites**: Use account created in Test 3

**Steps**:
1. Logout if logged in
2. Go to: http://localhost:3002/login
3. Select "Family User" tab (if multi-tab login)
4. Enter credentials:
   - **Email**: joao@test.com
   - **Password**: password123
5. Click "Entrar"

**Expected Results**:
- ✅ Login succeeds
- ✅ Redirects to appropriate dashboard
- ✅ Session persists

---

### Test 5: Admin User Login

**Prerequisites**: Admin user must exist in database

**If no admin user exists**, create one first:
```bash
# In a new terminal (keep dev server running)
pnpm db:studio

# In Drizzle Studio (opens at localhost:4983):
# 1. Go to "admin_users" table
# 2. Click "Add Row"
# 3. Fill in:
#    - name: Admin User
#    - email: admin@test.com
#    - password_hash: (use bcrypt hash - see below)
#    - is_active: true
# 4. Save

# To generate bcrypt hash for "password123":
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(console.log)"
```

**Steps**:
1. Go to: http://localhost:3002/admin/login
2. Enter credentials:
   - **Email**: admin@test.com
   - **Password**: password123
3. Click "Entrar"

**Expected Results**:
- ✅ Login succeeds
- ✅ Redirects to `/admin/dashboard`
- ✅ Session cookie created
- ✅ Session persists on refresh

---

### Test 6: Session Persistence

**Steps**:
1. Login as any user type
2. Navigate to a protected route (e.g., `/dashboard`)
3. **Refresh the page** (F5 or Ctrl+R)
4. **Open new tab** and go to http://localhost:3002/dashboard
5. **Restart browser** and go back to the dashboard

**Expected Results**:
- ✅ Page refresh: Still logged in
- ✅ New tab: Still logged in
- ✅ Browser restart: Still logged in (cookie persists for 1 year)

---

### Test 7: Logout

**Steps**:
1. While logged in, click "Logout" button
2. Note the current page

**Expected Results**:
- ✅ Redirects to `/login` or home page
- ✅ Session cookie deleted (check DevTools)
- ✅ Trying to access `/dashboard` redirects to login

---

### Test 8: Protected Routes Without Session

**Steps**:
1. Ensure you're logged out (delete cookies if needed)
2. Try to access: http://localhost:3002/dashboard

**Expected Results**:
- ✅ Redirects to `/login?redirect=/dashboard`
- ✅ After logging in, redirects back to `/dashboard`

---

### Test 9: Previous Bug - Existing Users Can Now Login

**Context**: Users created before the fix existed in database but couldn't log in.

**Steps**:
1. Find an email from database that was created before the fix
2. Try logging in with that email

**Expected Results**:
- ✅ Login now works (session is created properly)
- ✅ No "Cannot find module jose" error

---

## 🔍 Debugging Tools

### Check Session Cookie
**Browser DevTools**:
1. Press F12
2. Go to "Application" (Chrome) or "Storage" (Firefox)
3. Expand "Cookies"
4. Click on `http://localhost:3002`
5. Look for cookie named `session`

**Expected Cookie**:
- Name: `session`
- Value: `eyJhbGci...` (JWT token)
- HttpOnly: true
- SameSite: Lax
- Expires: ~1 year from now

### Check Server Logs
Monitor terminal where dev server is running for:
- ✅ `[Auth] Initialized with baseURL: ...`
- ❌ NO "Cannot find module jose" errors
- ❌ NO "Session verification failed" errors

### Check Database Records
```bash
# Open Drizzle Studio
pnpm db:studio

# Verify in browser (localhost:4983):
# 1. funeral_homes table - should have your test user
# 2. users table - should have OAuth user records
# 3. family_users table - should have family members
# 4. admin_users table - should have admin users
```

---

## 📊 Test Results Checklist

Mark each test as you complete it:

- [ ] Test 1: Funeral Home Registration
- [ ] Test 2: Funeral Home Login
- [ ] Test 3: Family User Registration
- [ ] Test 4: Family User Login
- [ ] Test 5: Admin User Login
- [ ] Test 6: Session Persistence
- [ ] Test 7: Logout
- [ ] Test 8: Protected Routes
- [ ] Test 9: Existing Users Can Login

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module jose"
**Status**: Should be FIXED now ✅
**If it appears**: The fix wasn't applied correctly. Check `src/server/_core/sdk.ts` has proper imports.

### Issue: User created but can't login
**Status**: Should be FIXED now ✅
**If it appears**: Check that `persistUserSession` is called in registration/login mutations.

### Issue: Session doesn't persist
**Possible causes**:
- Cookie blocked by browser (check SameSite settings)
- Cookie expired
- JWT_SECRET changed between sessions

**Debug**:
```bash
# Check JWT_SECRET is consistent
grep JWT_SECRET .env

# Should be 32+ characters
```

### Issue: "Session verification failed"
**Possible causes**:
- JWT_SECRET mismatch
- Token expired
- Token format invalid

**Debug**: Check server logs for detailed error message.

---

## ✅ Success Criteria

All authentication is working if:
- ✅ Can register new users (all types)
- ✅ Can login with credentials
- ✅ Session cookie is created
- ✅ Session persists across page refreshes
- ✅ Protected routes are accessible when logged in
- ✅ Protected routes redirect to login when not logged in
- ✅ Logout clears session
- ✅ No "jose" module errors in console

---

## 📞 Need Help?

If tests fail:
1. Check browser console (F12)
2. Check server terminal output
3. Review `AUTH_FIXES_SUMMARY.md`
4. Check database tables in Drizzle Studio
5. Verify `.env` has correct values

---

**Happy Testing!** 🧪
