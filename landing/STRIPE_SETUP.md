# Stripe Payment Integration Setup Guide

## Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete your business profile
3. Use **Test Mode** for development (toggle in top right)

---

## Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

3. Add to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your Vercel URL
```

---

## Step 3: Create Products in Stripe

### Create Starter Plan (Free):
1. Go to **Products** → **Add Product**
2. Name: `Starter`
3. Description: `Free tier with 3 model uploads per month`
4. Pricing: **$0.00 / month** (recurring)
5. Click **Save product**
6. Copy the **Price ID** (starts with `price_`)

### Create Growth Plan:
1. **Add Product** again
2. Name: `Growth`
3. Description: `Growth tier with 50 model uploads per month`
4. Pricing: **$49.00 / month** (recurring)
5. Click **Save product**
6. Copy the **Price ID**

**Note:** The 14-day free trial is configured in the checkout code, not on the product itself. Customers will not be charged for 14 days after signup.

### Add metadata to each price (optional but recommended):
- Click on the price → **More** → **Edit**
- Add metadata:
  - `upload_limit`: `3` (for Starter) or `50` (for Growth)
  - `features`: `standard` or `premium`

7. Add Price IDs to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_GROWTH=price_xxxxx
```

---

## Step 4: Set Up Webhooks

### For Local Development:

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or download from https://stripe.com/docs/stripe-cli
```

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### For Production (Vercel):

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://your-domain.vercel.app/api/webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.finalized`

4. Copy the **Signing secret** and add to Vercel environment variables

---

## Step 5: Create Database Tables

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive',
  plan_type text DEFAULT 'starter',
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(stripe_subscription_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Step 6: Install Stripe Package

```bash
npm install stripe @stripe/stripe-js
```

---

## Step 7: Test the Integration

### Test Checkout Flow with Invoices and Free Trial:

1. Start your dev server: `npm run dev`
2. Start Stripe webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhook`
3. Go to landing page → Click "Start Free Trial" on Growth plan
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
   - **Billing address**: Add a test address
   - **Tax ID** (optional): Test with EU VAT format (e.g., PL1234567890)

5. Complete checkout
6. Check:
   - Supabase `profiles` table - subscription data should be updated
   - Stripe dashboard → **Subscriptions** - verify status shows "trialing" with trial end date 14 days from now
   - Stripe dashboard → **Customers** - customer created
   - **No invoice yet** - invoice will be created when trial ends (after 14 days)
   - Webhook logs - should see `customer.subscription.created` event

**To test trial ending (optional):**
- In Stripe Dashboard → Find the subscription
- Click **Actions** → **End trial now**
- This will immediately charge the customer and create an invoice

### Test Cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

---

## Step 8: Configure Invoices and Tax (Important for Polish Company)

### Set Up Company Information:

1. Go to **Settings** → **Business settings** → **Public business information**
2. Add:
   - **Company name:** People Can Dream Sebastian Kotarski
   - **Address:** Złotnicka 9 lok. 2, 54-029 Wrocław, Poland
   - **Tax ID / VAT number (NIP):** 8943142663
   - **REGON:** 383688258
   - **Support email:** spacecheck@sebastiankotarski.com
   - **Website URL:** Your production domain

### Configure Stripe Tax (Recommended):

1. Go to **Settings** → **Tax**
2. Click **Enable Stripe Tax**
3. Select your business location (Poland)
4. Configure tax behavior:
   - Enable automatic tax calculation
   - Set up EU VAT compliance
   - Enable reverse charge for B2B transactions
5. Note: Stripe Tax costs 0.5% per transaction but handles all EU VAT rules automatically

### Customize Invoices:

1. Go to **Settings** → **Invoices, quotes, and receipts**
2. Customize:
   - Upload company logo
   - Set brand colors
   - Add footer text (e.g., payment terms, bank details)
   - Set invoice numbering format
   - Add custom fields if needed

### Test Invoice Flow:

1. Complete a test checkout
2. Check **Payments** → **Invoices** in Stripe Dashboard
3. Verify:
   - Company details appear correctly
   - VAT is calculated (if applicable)
   - Invoice PDF looks professional
   - Customer can download invoice from Customer Portal

---

## Step 9: Enable Customer Portal

In Stripe Dashboard:
1. Go to **Settings** → **Billing** → **Customer portal**
2. Configure branding, features (cancel subscription, update payment method, **view invoices**)
3. Enable invoice history so customers can download past invoices
4. Save

Users can then manage subscriptions and view invoices from Settings page.

---

## Step 10: Deploy to Production

### Add to Vercel Environment Variables:

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add all Stripe keys (use Production keys, not Test):
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (from production webhook)
   - `NEXT_PUBLIC_STRIPE_PRICE_STARTER`
   - `NEXT_PUBLIC_STRIPE_PRICE_GROWTH`

3. Redeploy

---

## Monitoring

### View in Stripe Dashboard:
- **Customers** - See all subscribers
- **Subscriptions** - Active/canceled subscriptions
- **Payments** - Transaction history
- **Invoices** - All generated invoices (with download links)
- **Logs** - Webhook events and API calls
- **Tax** - Tax reports and calculations (if using Stripe Tax)

### View in Supabase:
- **profiles** table - User subscription status
- **contact_submissions** - Support requests

---

## Troubleshooting

**Webhook not working?**
- Check webhook secret is correct
- Verify endpoint URL is accessible
- Check Stripe logs for errors

**Checkout failing?**
- Verify API keys are correct
- Check browser console for errors
- Ensure user is authenticated

**Subscription not updating?**
- Check webhook is receiving events
- Verify Supabase RLS policies allow updates
- Check server logs for errors

---

## Going Live Checklist

- [ ] Switch Stripe to **Live Mode**
- [ ] Update all API keys to production keys
- [ ] Create production products/prices
- [ ] Set up production webhook endpoint (include invoice events)
- [ ] **Configure company details** (name, address, NIP/VAT number)
- [ ] **Enable Stripe Tax** for EU VAT compliance
- [ ] **Customize invoice template** (logo, colors, footer)
- [ ] Test invoice generation with test transaction
- [ ] Test complete flow with real card
- [ ] Set up email notifications for failed payments
- [ ] Set up billing portal with invoice history enabled
- [ ] Verify invoices are compliant with Polish/EU regulations

---

## Need Help?

- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Mode: Always test thoroughly before going live!
