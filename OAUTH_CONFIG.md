# OAuth Configuration

## Status: ⚠️ OPTIONAL - Not Currently Required

OAuth integration is **optional** in this application. The system currently uses **email/password authentication** for all user types and works perfectly without OAuth.

---

## Current Authentication Flow

The application has **three authentication methods**:

### 1. Funeral Home Authentication
- **Method**: Email + Password (bcrypt hashing)
- **Table**: `funeralHomes`
- **Login**: `/login` (Funeral Home tab)
- **Registration**: `/register` (Funeral Home tab)
- **Cookie**: Session token stored in HTTP-only cookie

### 2. Family User Authentication
- **Method**: Email + Password (bcrypt hashing)
- **Table**: `familyUsers`
- **Login**: `/login` (Family tab)
- **Registration**: Via invitation token (7-day expiry)
- **Flow**: Funeral home creates memorial → Family receives invitation → Family accepts and sets password

### 3. Admin Authentication
- **Method**: Email + Password (bcrypt hashing)
- **Table**: `adminUsers`
- **Login**: `/admin/login`
- **Session**: localStorage (24-hour expiry)

---

## OAuth Variables (Currently Empty)

```bash
# In .env
OAUTH_SERVER_URL=""
OWNER_OPEN_ID=""
```

### OAUTH_SERVER_URL
- **Purpose**: External OAuth provider endpoint (e.g., Auth0, Manus OAuth)
- **Usage**: If set, enables SSO (Single Sign-On) integration
- **Current**: Empty → OAuth disabled
- **Impact**: None - email/password auth works independently

### OWNER_OPEN_ID
- **Purpose**: Owner's openId for auto-admin assignment
- **Usage**: Automatically grants admin role to specific OAuth user
- **Current**: Empty → Manual admin creation only
- **Impact**: None - admins can be created via API/database

---

## When to Enable OAuth

Consider enabling OAuth if you need:

1. **Single Sign-On (SSO)**: Users authenticate via external provider
2. **Social Login**: "Login with Google/Microsoft" buttons
3. **Enterprise Integration**: Connect to company Active Directory
4. **Centralized Auth**: Manage users across multiple apps

---

## OAuth Implementation (If Needed)

The codebase has remnants of OAuth support from the original Vite project:

### Files with OAuth Code

**server/_core/oauth.ts.old** (renamed, not in use)
- OAuth callback handling
- Token exchange
- User profile fetching

**server/routers.ts** (lines with OAuth references)
- `users` table has `openId` field
- `loginMethod` field tracks OAuth provider

### To Enable OAuth:

1. **Choose OAuth Provider**
   - Auth0, Okta, Google OAuth, Microsoft Azure AD, etc.

2. **Set Environment Variables**
   ```bash
   OAUTH_SERVER_URL="https://your-oauth-provider.com"
   OWNER_OPEN_ID="oauth-user-id-for-admin"
   ```

3. **Restore OAuth Files**
   ```bash
   # If needed, restore from .old files
   mv server/_core/oauth.ts.old server/_core/oauth.ts
   ```

4. **Add OAuth Routes**
   ```typescript
   // In app router or API routes
   app.get("/api/auth/oauth/callback", handleOAuthCallback);
   ```

5. **Update Login UI**
   ```tsx
   // Add OAuth button to login page
   <Button onClick={() => window.location.href = "/api/auth/oauth"}>
     Login with OAuth
   </Button>
   ```

---

## SDK Integration (users table)

The `users` table was originally for SDK OAuth integration:

```typescript
// drizzle/schema.ts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  // ...
});
```

**Current Usage**: Minimal - funeral homes and family users have their own tables

**Future Use**: If OAuth is enabled, this table would store OAuth users

---

## Authentication Decision Matrix

| Scenario | Recommended Auth | OAuth Needed? |
|----------|------------------|---------------|
| Small business with <100 funeral homes | Email/Password | ❌ No |
| Enterprise with SSO requirement | OAuth + Email/Password | ✅ Yes |
| SaaS with social login | OAuth (Google, etc.) | ✅ Yes |
| Family-focused memorial site | Email/Password | ❌ No |
| White-label for corporations | OAuth (company AD) | ✅ Yes |

---

## Current Recommendation

**✅ Keep OAuth disabled** for now because:

1. **Email/password works perfectly** for funeral homes and families
2. **No enterprise SSO requirement** mentioned in project scope
3. **Simpler deployment** without external OAuth dependencies
4. **Faster onboarding** - users don't need external accounts
5. **Privacy-focused** - no third-party authentication tracking

**When to revisit**:
- Customer requests SSO integration
- Expanding to enterprise clients
- Adding "Login with Google" for families

---

## Testing Current Authentication

All authentication methods work without OAuth:

```bash
# Start development server
npm run dev

# Test funeral home login
# Visit: http://localhost:3000/login
# Use funeral home credentials from database

# Test family login
# Visit: http://localhost:3000/login (Family tab)
# Use invitation token to create account

# Test admin login
# Visit: http://localhost:3000/admin/login
# Use admin credentials
```

---

## Security Without OAuth

The application is secure using email/password:

- ✅ **Password hashing**: bcrypt with salt rounds
- ✅ **JWT tokens**: Signed with JWT_SECRET (64 chars)
- ✅ **HTTP-only cookies**: Session tokens not accessible to JavaScript
- ✅ **Invitation tokens**: Cryptographically secure random strings
- ✅ **Expiry handling**: Invitations expire after 7 days
- ✅ **Session validation**: Middleware checks on every protected route
- ✅ **Role-based access**: Admin, funeral home, family user separation

---

## References

### Current Auth Implementation
- `server/routers.ts` - Auth procedures (funeralHomeLogin, familyUserLogin, adminLogin)
- `server/_core/context.ts` - Session validation from cookies
- `app/login/page.tsx` - Login UI with tabs
- `app/register/page.tsx` - Funeral home registration
- `app/accept-invitation/[token]/page.tsx` - Family invitation acceptance

### OAuth Resources (If Needed Later)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [NextAuth.js](https://next-auth.js.org/) - Popular OAuth library
- [Auth0 Documentation](https://auth0.com/docs)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

**Decision**: ✅ OAuth is optional and not currently needed
**Recommendation**: Keep disabled until specific OAuth requirement arises
**Current Auth**: ✅ Email/Password working for all three user types
**Last Updated**: 2026-01-17
