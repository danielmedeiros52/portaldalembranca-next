# Pay-Per-Memorial Business Model Migration

**Date**: 2026-01-20
**Status**: ✅ Core Implementation Complete
**Commit**: `7b45303`

---

## 🎯 Business Model Change

### FROM: Annual Subscriptions
- Users paid R$ 19.90/year for unlimited memorials
- Subscription-based recurring revenue
- Required renewal to maintain access

### TO: Pay-Per-Memorial
- Users pay R$ 19.90 per memorial (one-time payment)
- Each memorial has permanent access
- No monthly fees or renewals
- Users buy memorial credits and use them to create memorials

---

## ✅ What's Been Implemented

### 1. Database Schema ✅
**File**: `drizzle/schema.ts`

Added `memorialCredits` field to `funeral_homes` table:
```typescript
memorialCredits: integer("memorial_credits").default(0).notNull()
```

**⚠️ ACTION REQUIRED**: Run database migration
```bash
pnpm db:push
```

### 2. Homepage Updates ✅
**File**: `src/app/page.tsx`

**Changes**:
- Hero section emphasizes permanent memorials
- Pricing section title: "Pague Apenas pelo que Usar"
- Subtitle: "Sem mensalidades ou assinaturas"
- Plan renamed: "Memorial Digital Permanente"
- Price display: "R$ 19,90 **por memorial**" (not "/ano")
- Benefits updated:
  - "Acesso Permanente" - Memorial disponível para sempre
  - "Sem Mensalidades" - Pague apenas uma vez
  - "Suporte dedicado" - Estamos aqui para ajudar

### 3. Dashboard Updates ✅
**File**: `src/app/dashboard/page.tsx`

**Memorial Credits Banner**:
- Shows available memorial count
- Green banner when credits > 0: "X Memorial(is) Disponível(is)"
- Amber banner when credits = 0: "Nenhum Memorial Disponível"
- Includes "Comprar Memorial" button when credits are 0

**Create Memorial Button**:
- Shows "Novo Memorial" when credits > 0 (opens dialog)
- Shows "Comprar Memorial" when credits = 0 (redirects to checkout)
- Conditional rendering based on `subscriptionStatus.canCreateMemorials`

### 4. API Updates ✅
**File**: `src/server/routers.ts`

**getSubscriptionStatus** endpoint now returns:
```typescript
{
  hasSubscription: true, // For compatibility
  status: funeralHome.subscriptionStatus,
  expiresAt: funeralHome.subscriptionExpiresAt,
  isExpired: false,
  canCreateMemorials: memorialCredits > 0,
  memorialCredits: number, // New field!
}
```

**Logic**:
- Funeral homes: `canCreateMemorials = memorialCredits > 0`
- Family users: Always `canCreateMemorials = true` (they edit existing memorials)

---

## ⏳ What Still Needs to Be Done

### 1. Database Migration (REQUIRED)
Run the migration to add the `memorialCredits` column:
```bash
cd C:\Users\xb72\Desktop\personal\portaldalembranca-next
pnpm db:push
```

When prompted:
- Select **"create column"** for `memorial_credits`

### 2. Update Checkout Page
**File**: `src/app/checkout/page.tsx`

**Changes Needed**:
- Update plans array to sell memorial packages (not subscriptions)
- Examples:
  - 1 Memorial: R$ 19,90
  - 5 Memoriais: R$ 89,50 (10% discount)
  - 10 Memoriais: R$ 159,00 (20% discount)
- Update success message: "Memorial comprado com sucesso!"
- Remove subscription-related messaging

### 3. Update Payment Flow
**File**: `src/server/payments.ts` and `src/server/routers.ts`

**Changes Needed**:
- After successful payment, add credits to funeral home account
- Update `createCardPayment` success handler
- Update `createPixPayment` success handler
- Example logic:
```typescript
// After payment approved
const memorialCount = getPlanMemorialCount(planId); // 1, 5, or 10
await db.incrementMemorialCredits(funeralHomeId, memorialCount);
```

### 4. Decrement Credits on Memorial Creation
**File**: `src/server/routers.ts` (memorial.create procedure)

**Changes Needed**:
- Check if user has credits before creating memorial
- Decrement credits after successful creation
- Example logic:
```typescript
memorial.create: protectedProcedure
  .input(...)
  .mutation(async ({ input, ctx }) => {
    const funeralHome = await db.getFuneralHomeById(funeralHomeId);

    if (funeralHome.memorialCredits <= 0) {
      throw new Error("Você não possui créditos disponíveis");
    }

    // Create memorial
    const memorial = await db.createMemorial(...);

    // Decrement credits
    await db.decrementMemorialCredits(funeralHomeId, 1);

    return memorial;
  })
```

### 5. Add Credit Management Functions
**File**: `src/server/db.ts`

**Functions to Add**:
```typescript
export async function incrementMemorialCredits(
  funeralHomeId: number,
  amount: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(funeralHomes)
    .set({
      memorialCredits: sql`${funeralHomes.memorialCredits} + ${amount}`
    })
    .where(eq(funeralHomes.id, funeralHomeId));
}

export async function decrementMemorialCredits(
  funeralHomeId: number,
  amount: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(funeralHomes)
    .set({
      memorialCredits: sql`${funeralHomes.memorialCredits} - ${amount}`
    })
    .where(eq(funeralHomes.id, funeralHomeId));
}
```

---

## 🧪 Testing Checklist

### Database
- [ ] Database migration applied successfully
- [ ] `memorial_credits` column exists with default value 0
- [ ] Existing funeral homes have 0 credits (or test data added)

### Homepage
- [ ] Pricing section shows "Pague Apenas pelo que Usar"
- [ ] Plan title is "Memorial Digital Permanente"
- [ ] Price shows "R$ 19,90 **por memorial**"
- [ ] Benefits mention "Acesso Permanente" and "Sem Mensalidades"

### Dashboard (with 0 credits)
- [ ] Amber banner shows "Nenhum Memorial Disponível"
- [ ] "Comprar Memorial" button appears
- [ ] Clicking button redirects to `/checkout?plan=essencial`
- [ ] Create dialog does NOT open

### Dashboard (with credits)
- [ ] Green banner shows "X Memorial(is) Disponível(is)"
- [ ] "Novo Memorial" button appears
- [ ] Clicking button opens create dialog
- [ ] Can create memorial successfully

### Checkout & Payment (TODO)
- [ ] Checkout page shows memorial packages
- [ ] Payment success adds credits to account
- [ ] Credits appear immediately in dashboard

### Memorial Creation (TODO)
- [ ] Creating memorial decrements credits by 1
- [ ] Credits update immediately in UI
- [ ] Error shown if no credits available

---

## 📊 User Flow Examples

### New User Flow
1. User registers → Gets 0 credits
2. Dashboard shows "Nenhum Memorial Disponível" (amber banner)
3. Clicks "Comprar Memorial"
4. Redirected to checkout
5. Purchases 1 memorial for R$ 19,90
6. Payment approved → 1 credit added
7. Dashboard shows "1 Memorial Disponível" (green banner)
8. Clicks "Novo Memorial" → Creates memorial
9. Memorial created → Credits: 1 - 1 = 0
10. Dashboard shows "Nenhum Memorial Disponível" again

### Existing User Flow
1. User has active subscription
2. Dashboard shows "1 Memorial Disponível" (green banner)
3. Can create memorial immediately

---

## 🔄 Migration Strategy for Existing Users

### Option 1: Grandfathering (Generous)
Give existing subscribers credits equal to their remaining subscription time:
- 1 year remaining → 12 credits (1 memorial per month)
- 6 months remaining → 6 credits

### Option 2: Partial Credits (Balanced)
Give existing subscribers a fixed number of credits:
- All active subscribers → 5 credits
- Trial users → 1 credit

### Option 3: Strict Migration (Revenue-focused)
All users start at 0 credits:
- Existing subscriptions end
- Users must purchase credits to continue

**Recommendation**: Option 2 (Partial Credits) for goodwill and smooth transition

**Implementation**:
```sql
-- Give all active subscribers 5 credits
UPDATE funeral_homes
SET memorial_credits = 5
WHERE subscription_status = 'active';

-- Give trial users 1 credit
UPDATE funeral_homes
SET memorial_credits = 1
WHERE subscription_status = 'trialing';
```

---

## 💡 Revenue Model Comparison

### Old Model (Subscriptions)
- R$ 19,90/year per user
- Recurring revenue
- Churn risk (users cancel)
- Unlimited memorials per user

### New Model (Pay-Per-Memorial)
- R$ 19,90 per memorial
- One-time revenue per memorial
- No churn (no subscriptions to cancel)
- Revenue scales with memorial creation

**Example**:
- User creates 5 memorials/year
- Old model: R$ 19,90/year
- New model: R$ 99,50/year (5x R$ 19,90)
- **Revenue increase**: 5x!

---

## 🚀 Next Steps

1. **Run database migration** ✅
   ```bash
   pnpm db:push
   ```

2. **Test current changes**:
   - Visit homepage → Check pricing section
   - Login to dashboard → Check banner (should show 0 credits)
   - Click "Comprar Memorial" → Should redirect to checkout

3. **Complete remaining tasks**:
   - Update checkout page (memorial packages)
   - Update payment flow (add credits on purchase)
   - Add credit management functions (increment/decrement)
   - Update memorial creation (decrement credits)

4. **Test end-to-end**:
   - Purchase memorial → Check credits added
   - Create memorial → Check credits decremented
   - Try creating with 0 credits → Should see error

5. **Deploy to production**:
   - Test thoroughly in development first
   - Deploy database migration
   - Deploy code changes
   - Monitor user behavior and revenue

---

## 📞 Support

If you encounter issues:
1. Check database migration ran successfully
2. Verify `memorial_credits` column exists
3. Check browser console for errors
4. Review tRPC endpoint responses

---

**Questions?** Review this document or check the code changes in commit `7b45303`.

**Ready to complete the migration?** Follow the "What Still Needs to Be Done" section above!
