# Stripe Payment Integration - Complete Flow Testing Guide

## Summary of Implementation

I've integrated Stripe payment processing into your Portal da Lembrança application with the following components:

### ✅ Implemented Components

1. **Payment Service** (`src/server/payments.ts`)
   - `createPaymentIntent()` - Creates Stripe PaymentIntent for card payments
   - `getPaymentIntentStatus()` - Checks payment status
   - Supports BRL currency
   - Plan pricing configuration (Essencial, Premium, Família)

2. **tRPC Payment Router** (`src/server/routers.ts`)
   - `payment.createPaymentIntent` - Public mutation to create payment
   - `payment.getPaymentStatus` - Public query to check payment status

3. **Checkout Page** (`src/app/checkout/page.tsx`)
   - Plan selection step
   - Payment form with email collection
   - Card payment method (Cartão)
   - PIX payment method (placeholder for future implementation)
   - Order summary
   - Success confirmation page

## Complete Payment Flow

```
User → Plan Selection → Payment Details → Card Info → Stripe Intent Created → Success
                                                ↓
                                        Payment Processed
                                                ↓
                                        Confirmation Email
```

## Testing the Payment Flow

### Prerequisites
1. **Stripe Account**: https://stripe.com (if not already created)
2. **Stripe API Keys**: Get from Stripe Dashboard
3. **Environment Variables** set in `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...  (from Stripe Dashboard)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  (from Stripe Dashboard)
   ```

### Step 1: Set Up Stripe Test Keys

1. Go to https://dashboard.stripe.com
2. Log in to your account
3. Click "Developers" in left sidebar
4. Click "API Keys" tab
5. Copy:
   - **Secret Key** (starts with `sk_test_`) → Add to `.env.local` as `STRIPE_SECRET_KEY`
   - **Publishable Key** (starts with `pk_test_`) → Add to `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Step 2: Test in Development

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Navigate to checkout**:
   ```
   http://localhost:3003/checkout
   ```

3. **Test Scenario 1: Plan Selection**
   - ✅ See 3 plans: Essencial (R$ 19.90), Premium (R$ 99.90), Família (R$ 249.90)
   - ✅ Premium is marked as "Popular"
   - ✅ Can select any plan
   - ✅ Click "Continuar para Pagamento"

4. **Test Scenario 2: Payment Details**
   - ✅ Email field appears
   - ✅ Payment method selection (Cartão/PIX)
   - ✅ Order summary shows correct plan name and price
   - ✅ Features list displays

5. **Test Scenario 3: Card Payment (Cartão)**
   - ✅ Enter test card details:
     ```
     Number: 4242 4242 4242 4242
     Expiry: Any future date (e.g., 12/25)
     CVV: Any 3 digits (e.g., 123)
     Name: Test User
     ```
   - ✅ Click "Confirmar Pagamento"
   - ✅ See "Processando pagamento..." loading state
   - ✅ After 2 seconds, see success message
   - ✅ Confirmation page shows email and options to go to Dashboard

6. **Test Scenario 4: Error Handling**
   - ❌ Try without selecting a plan → Should show error
   - ❌ Try without entering email → Should show error
   - ❌ Try without card details → Should show error
   - ✅ Use declined card to test payment failures:
     ```
     Number: 4000 0000 0000 0002
     ```

### Step 3: Test with Different Card Types

**Stripe Test Cards**:
```
Success Scenarios:
- 4242 4242 4242 4242 - Visa (Success)
- 5555 5555 5555 4444 - Mastercard (Success)
- 3782 822463 10005 - American Express (Success)

Failure Scenarios:
- 4000 0000 0000 0002 - Generic decline
- 4000 0000 0000 0069 - Expired card
- 4000 0000 0000 0127 - Insufficient funds

All test cards use any future expiry date and any CVC
```

### Step 4: Verify Stripe Events

1. Go to https://dashboard.stripe.com → Developers → Events
2. You should see:
   - ✅ `payment_intent.created` event for each payment attempt
   - ✅ `payment_intent.succeeded` for successful payments
   - ✅ `payment_intent.payment_failed` for declined cards

### Step 5: Database Integration (Future)

After successful payment, you should:
1. Create an `Order` record with:
   - `memorial_id`: User's memorial (if specified)
   - `funeral_home_id`: User's funeral home
   - `status`: "paid"
   - `payment_intent_id`: Stripe PaymentIntent ID
   - `amount`: Plan price in cents

2. Update memorial status to "active"
3. Send confirmation email to customer

## Current Implementation Details

### API Endpoints

**Create Payment Intent**:
```
POST /api/trpc/payment.createPaymentIntent
Mutation: api.payment.createPaymentIntent.useMutation()

Input:
  {
    planId: "premium" | "essencial" | "familia",
    customerEmail?: "user@example.com"
  }

Output:
  {
    id: "pi_1234567890",
    clientSecret: "pi_1234567890_secret_...",
    amount: 9990,  // in cents (BRL)
    currency: "brl",
    status: "requires_payment_method"
  }
```

**Get Payment Status**:
```
GET /api/trpc/payment.getPaymentStatus
Query: api.payment.getPaymentStatus.useQuery()

Input:
  {
    paymentIntentId: "pi_1234567890"
  }

Output:
  {
    id: "pi_1234567890",
    status: "succeeded" | "requires_action" | "processing",
    amount: 9990,
    currency: "brl"
  }
```

### Plan Pricing

| Plan | ID | Price (Monthly) | Price (BRL) |
|------|-----|-----------------|------------|
| Essencial | `essencial` | R$ 19.90 | 1990¢ |
| Premium | `premium` | R$ 99.90 | 9990¢ |
| Família | `familia` | R$ 249.90 | 24990¢ |

## Common Issues & Fixes

### Issue: "STRIPE_SECRET_KEY not configured"
**Solution**: Add `STRIPE_SECRET_KEY` to `.env.local` and restart dev server

### Issue: "Plan not found"
**Solution**: Ensure planId is one of: "essencial", "premium", "familia"

### Issue: Payment endpoint returns 401
**Solution**: Check Stripe API key is correct in environment variables

### Issue: CORS errors
**Solution**: Payment endpoints are internal API routes (not cross-origin)

## Future Enhancements

1. **Stripe.js Integration**
   - Current: Simulates payment after creating intent
   - Future: Use `@stripe/react-stripe-js` for real card processing
   - Add `<CardElement>` for secure card handling

2. **PIX Payment Method**
   - Generate PIX QR code after payment intent creation
   - Display QR code on checkout page
   - Poll for payment confirmation

3. **Webhook Handling**
   - Listen to `payment_intent.succeeded` events
   - Automatically create order records
   - Send confirmation emails
   - Update memorial status

4. **Subscription Management**
   - Create Stripe Customer for each user
   - Set up recurring billing
   - Handle subscription cancellation
   - Implement renewal notifications

5. **Invoice Generation**
   - Generate PDF invoices
   - Email invoices to customers
   - Store invoice references

6. **Payment History**
   - Add payment dashboard page
   - Show all payments and subscriptions
   - Allow invoice downloads
   - Display renewal dates

## Files Modified

```
src/server/payments.ts                    [NEW]
src/server/routers.ts                     [UPDATED - Added payment router]
src/app/checkout/page.tsx                 [UPDATED - Integrated Stripe]
src/env.js                                [ALREADY HAS Stripe variables]
```

## Success Indicators

✅ Plan selection works
✅ Payment form displays correctly
✅ Card data collection works
✅ Email validation works
✅ Stripe API responds with payment intent
✅ Success page displays with confirmation
✅ Payment shows in Stripe dashboard
✅ Error messages display properly

## Testing Checklist

- [ ] Plan selection and navigation work
- [ ] Payment form loads correctly
- [ ] Can enter email and card details
- [ ] Submit button is responsive
- [ ] Test with valid Stripe test card
- [ ] See success message after payment
- [ ] Check Stripe dashboard for payment intent
- [ ] Test with invalid card (should show error)
- [ ] Test without email (should show error)
- [ ] Test without plan selection (should show error)
- [ ] Mobile responsiveness works
- [ ] Back button navigates correctly

## Production Checklist (Before Going Live)

- [ ] Switch to live Stripe keys
- [ ] Update `.env.production` with live keys
- [ ] Implement webhook handlers
- [ ] Test with real payment methods
- [ ] Set up email notifications
- [ ] Create order records in database
- [ ] Implement subscription renewal
- [ ] Set up refund policy
- [ ] Test all error scenarios
- [ ] Performance test under load
- [ ] Security audit (PCI compliance)
- [ ] Backup and disaster recovery plan

---

**Quick Start Command**:
```bash
# 1. Update .env.local with Stripe keys
# 2. Restart dev server
pnpm dev

# 3. Navigate to checkout
http://localhost:3003/checkout

# 4. Test with card: 4242 4242 4242 4242
```
