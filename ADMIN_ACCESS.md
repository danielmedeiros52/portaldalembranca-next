# Admin Access Guide

This guide explains how to access and manage the admin panel for Portal da Lembrança.

## Quick Start

### Automatic Admin Creation (Recommended)

The easiest way to create an admin user is to configure it in your `.env` file. The admin will be created automatically when you start the server.

1. **Edit your `.env` file:**

```env
# Default Admin User (created automatically on first run)
DEFAULT_ADMIN_EMAIL="admin@portaldalembranca.com"
DEFAULT_ADMIN_PASSWORD="admin123456"
DEFAULT_ADMIN_NAME="Administrador"
```

2. **Start the dev server:**

```bash
pnpm dev
```

3. **Check the console output:**

You should see:
```
✅ Default admin user created successfully!
   Email: admin@portaldalembranca.com
   Password: ******* (check your .env file)
   Login at: /admin/login
```

4. **Login:**

Navigate to `http://localhost:3000/admin/login` and use:
- **Email:** `admin@portaldalembranca.com`
- **Password:** `admin123456`

### Manual Admin Creation

If you prefer to create admin users manually, use the CLI script:

```bash
pnpm create-admin
```

Follow the prompts:
```
🔧 Portal da Lembrança - Admin User Creator

Admin Name: John Doe
Admin Email: john@example.com
Admin Password (min 6 chars): securepass123

✅ Admin user created successfully!
   Name: John Doe
   Email: john@example.com
   Login at: /admin/login
```

### Using the Setup Page (Alternative)

If you prefer a web interface:

1. Navigate to: `http://localhost:3000/admin/setup`
2. Fill in the form with:
   - Name
   - Email
   - Password (min 6 characters)
   - Setup Key: `PORTAL_ADMIN_SETUP_2024`
3. Click "Criar Administrador"

**🔒 Security Feature:** The setup page automatically disables itself when there is at least one active admin user in the system. If you try to access it after an admin has been created, you'll see an "Access Denied" message and be redirected to the login page.

## Admin Panel Features

Once logged in at `/admin/login`, you'll have access to:

### Dashboard (`/admin/dashboard`)
- Overview of system statistics
- Total memorials, active memorials, pending memorials
- Recent activity feed
- Production queue overview

### Historical Memorials (`/admin/historical-memorials`)
- Manage historical memorials for Pernambuco personalities
- Toggle featured status (shows on homepage)
- Bulk import from JSON
- Search and filter memorials
- View and edit memorial details

### All Memorials
- View all memorials in the system
- Filter by status (active, pending, inactive)
- Quick actions: view, edit

### Leads
- View contact requests from homepage
- Update lead status (pending, contacted, converted)
- Manage follow-ups

### Production Queue
- Manage memorial production workflow
- Track order status
- Assign priorities

## Security Best Practices

### For Production

1. **Change the default password immediately:**
   ```env
   DEFAULT_ADMIN_PASSWORD="your-super-secure-password-here"
   ```

2. **Use a strong password:**
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't use dictionary words

3. **Change the setup key:**

   Edit `src/server/routers.ts` line 604:
   ```typescript
   if (input.setupKey !== "YOUR_CUSTOM_KEY_HERE") {
   ```

4. **Setup page is auto-disabled:**

   The `/admin/setup` page automatically disables itself when active admin users exist. No manual action needed!

   If you want to completely remove it:
   ```bash
   rm src/app/admin/setup/page.tsx
   ```

5. **Use environment-specific credentials:**

   Development:
   ```env
   DEFAULT_ADMIN_EMAIL="admin@localhost.com"
   DEFAULT_ADMIN_PASSWORD="devpassword123"
   ```

   Production (Vercel, etc.):
   ```env
   DEFAULT_ADMIN_EMAIL="admin@yourdomain.com"
   DEFAULT_ADMIN_PASSWORD="productionSecurePass123!"
   ```

6. **Consider IP whitelisting:**

   Add middleware to restrict admin access to specific IPs in production.

7. **Enable 2FA (Future Enhancement):**

   Consider implementing two-factor authentication for admin users.

## Troubleshooting

### Cannot access `/admin/setup` - "Access Denied"

This is expected behavior! The setup page automatically disables itself when there is at least one active admin user. Use one of these alternatives:

- Use the automatic admin from `.env` (already created)
- Use `pnpm create-admin` CLI script
- Login at `/admin/login` with existing credentials

### "E-mail ou senha inválidos"

- Verify the email and password in your `.env` file
- Check server logs for admin creation messages
- Try the `pnpm create-admin` script

### Admin user not created automatically

- Check database connection in `.env`
- Verify `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` are set
- Restart the dev server
- Check console for error messages

### Session expired

Admin sessions expire after 24 hours for security. Simply login again.

### Cannot access `/admin/dashboard`

- Ensure you're logged in at `/admin/login`
- Check browser localStorage for `adminSession`
- Clear browser cache and login again

## Admin User Management

### View all admin users

```sql
SELECT * FROM admin_users;
```

### Deactivate an admin user

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'user@example.com';
```

### Change admin password

```bash
pnpm create-admin
# Enter same email with new password
# Or use bcrypt to hash password and update database
```

### Delete admin user (careful!)

```sql
DELETE FROM admin_users WHERE email = 'user@example.com';
```

## Environment Variables Reference

```env
# Required for automatic admin creation
DEFAULT_ADMIN_EMAIL="admin@portaldalembranca.com"    # Admin email address
DEFAULT_ADMIN_PASSWORD="admin123456"                  # Admin password (min 6 chars)
DEFAULT_ADMIN_NAME="Administrador"                    # Admin display name

# Leave empty to skip automatic admin creation
DEFAULT_ADMIN_EMAIL=""
DEFAULT_ADMIN_PASSWORD=""
DEFAULT_ADMIN_NAME=""
```

## Production Deployment

### Vercel

1. Set environment variables in Vercel dashboard:
   - `DEFAULT_ADMIN_EMAIL`
   - `DEFAULT_ADMIN_PASSWORD`
   - `DEFAULT_ADMIN_NAME`

2. Deploy your app

3. Admin will be created on first deployment

4. Login at `https://yourdomain.com/admin/login`

### Docker

Environment variables can be passed via:

```bash
docker run -e DEFAULT_ADMIN_EMAIL="admin@example.com" \
           -e DEFAULT_ADMIN_PASSWORD="securepass" \
           -e DEFAULT_ADMIN_NAME="Admin" \
           your-image
```

Or use `.env` file with `--env-file`:

```bash
docker run --env-file .env your-image
```

## Database Schema

Admin users are stored in the `admin_users` table:

```typescript
{
  id: number;              // Auto-increment
  name: string;            // Full name
  email: string;           // Email (unique)
  passwordHash: string;    // Bcrypt hash
  isActive: boolean;       // Active status
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;       // Last login timestamp
}
```

## Support

For issues or questions:
1. Check server logs
2. Verify database connection
3. Check environment variables
4. Review this documentation
5. Contact system administrator

---

**Remember:** Keep your admin credentials secure and change default passwords in production!
