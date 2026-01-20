# Subscription System Documentation

## Overview

The Portal da Lembrança platform now includes a subscription system that controls memorial creation capabilities. This system allows:
- **Anyone can register** - All users can create accounts regardless of subscription status
- **Subscription required for funeral homes** - Funeral homes need an active subscription to create new memorials
- **Family users always have access** - Family members invited to edit memorials don't need subscriptions

## Database Schema

### New Fields Added to `funeral_homes` Table

```sql
-- Note: subscription_status enum already exists with these values:
-- ('active', 'cancelled', 'expired', 'past_due', 'trialing')

ALTER TABLE funeral_homes
ADD COLUMN subscription_status "subscription_status" DEFAULT 'trialing' NOT NULL,
ADD COLUMN subscription_expires_at TIMESTAMP;
```

**Subscription Statuses:**
- `active` - Full access to create memorials
- `trialing` - Trial period access (default for new accounts)
- `cancelled` - Subscription cancelled, cannot create memorials
- `expired` - Subscription expired, cannot create memorials
- `past_due` - Payment pending, cannot create memorials

## How It Works

### 1. Registration
- All users can register accounts (funeral homes or family members)
- New funeral home accounts start with `trialing` status
- Existing accounts are grandfathered with `active` status and 1-year expiry

### 2. Memorial Creation

**Funeral Homes:**
- Must have `active` or valid `trialing` subscription
- Cannot create memorials if:
  - Status is `cancelled`, `expired`, or `past_due`
  - Subscription has expired (`subscription_expires_at` < current date)

**Family Users:**
- Can always create and edit memorials
- No subscription required
- Access is granted by funeral homes through invitations

### 3. UI Behavior

**Dashboard:**
- "Novo Memorial" button is disabled if subscription is inactive
- Warning banner displays when subscription is expired/inactive
- Error toast shows when trying to open create dialog without valid subscription

**Create Memorial Dialog:**
- Prevented from opening if subscription check fails
- Clear error message: "Assinatura necessária para criar novos memoriais"

## API Endpoints

### Check Subscription Status
```typescript
api.auth.getSubscriptionStatus.useQuery()
```

**Returns:**
```typescript
{
  hasSubscription: boolean,      // true for funeral homes, false for family users
  status: "active" | "trialing" | "cancelled" | "expired" | "past_due" | null,
  expiresAt: Date | null,
  isExpired: boolean,
  canCreateMemorials: boolean    // Main flag to check
}
```

### Create Memorial (Protected)
```typescript
api.memorial.create.useMutation({
  fullName: string,
  birthDate?: string,
  deathDate?: string,
  birthplace?: string,
  funeralHomeId?: number
})
```

**Checks:**
1. User is authenticated
2. If funeral home: subscription is active and not expired
3. If family user: always allowed

## Migration Steps

### 1. Run Migration
```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

Or manually run:
```bash
psql $DATABASE_URL -f drizzle/migrations/add_subscription_fields.sql
```

### 2. Grandfather Existing Users
The migration automatically sets existing funeral homes to `active` with 1-year expiry.

### 3. Test
1. Create new funeral home account → Should have `trialing` status
2. Try to create memorial → Should work
3. Set subscription to `cancelled` → Should block memorial creation
4. Test family user account → Should always work

## Error Messages

**Portuguese (Production):**
- "Sua assinatura está inativa. Por favor, renove sua assinatura para criar novos memoriais." (cancelled/expired)
- "Sua assinatura expirou. Por favor, renove para criar novos memoriais." (date expired)
- "Seu pagamento está pendente. Por favor, regularize para criar novos memoriais." (past_due)
- "Assinatura necessária para criar novos memoriais." (frontend toast)

**English (Code Comments):**
- "Subscription is cancelled/expired"
- "Subscription expired (date)"
- "Payment is past due"
- "Subscription required"

## Future Enhancements

1. **Payment Integration**
   - Add Stripe/payment gateway
   - Automatic subscription renewal
   - Different subscription tiers

2. **Subscription Management UI**
   - View current plan details
   - Upgrade/downgrade options
   - Billing history

3. **Usage Limits**
   - Limit memorials per plan
   - Photo storage limits
   - Feature gating (e.g., video uploads only on premium)

4. **Grace Period**
   - Allow X days after expiration
   - Warning emails before expiration

5. **Admin Panel**
   - Manually adjust subscriptions
   - View subscription revenue
   - Grant complimentary access

## Code Locations

- **Schema**: `drizzle/schema.ts` (lines 46-59)
- **Migration**: `drizzle/migrations/add_subscription_fields.sql`
- **Backend Logic**: `src/server/routers.ts`
  - Subscription check: lines 391-404
  - Get status endpoint: lines 101-136
- **Frontend UI**: `src/app/dashboard/page.tsx`
  - Status query: line 28
  - Button disable: line 270
  - Warning banner: lines 242-263

## Testing Scenarios

### Scenario 1: New Funeral Home
1. Register new funeral home account
2. Status: `trialing` (default)
3. Can create memorials until trial expires
4. Expiry date: NULL (set manually or via admin)

### Scenario 2: Expired Subscription
1. Funeral home with `active` status
2. Set `subscription_expires_at` to past date
3. Cannot create new memorials
4. See warning banner with "Assinatura Expirada"

### Scenario 3: Cancelled Subscription
1. Set funeral home `subscription_status` to `cancelled`
2. Cannot create memorials
3. See warning banner with "Assinatura Inativa"

### Scenario 4: Past Due Payment
1. Set funeral home `subscription_status` to `past_due`
2. Cannot create memorials
3. Error message: "Seu pagamento está pendente"

### Scenario 5: Family User
1. Family user invited to memorial
2. No subscription check
3. Can always edit assigned memorial
4. Can create new memorials (if needed for family tree)

## Support

For issues or questions:
- Check error logs in backend console
- Verify subscription status in database
- Ensure migration was applied correctly
- Test with different user types
