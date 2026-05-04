# Shopify Billing — Managed Pricing

This document explains how SpaceCheck satisfies Shopify App Store rule **1.2.1**
("Apps must use Shopify Managed Pricing or the Shopify Billing API for any app
charges; off-platform billing is not allowed for Shopify-distributed apps.").

## Why we have two billing systems

SpaceCheck is sold both ways:

| Channel | Billing | Notes |
|---|---|---|
| Direct sign-up at `spacecheck.app` | **Stripe** | Credit packs ($7 / $29 / $99) and legacy hosting subscription |
| Installed via Shopify App Store | **Shopify Managed Pricing** | Plan(s) configured in the Partner Dashboard |

A user is considered a **Shopify merchant** if they have at least one row in the
`shopify_stores` table (created during the OAuth callback at
`/api/shopify/callback`). That detection lives in
[`utils/billing-source.ts`](utils/billing-source.ts).

## What changed for Shopify rule 1.2.1 compliance

1. **Server-side guards.** Every Stripe checkout endpoint (`create-checkout`,
   `create-checkout-credits`, `create-portal`, `create-special-checkout`) now
   returns HTTP 403 with `code: "shopify_managed_pricing_required"` when called
   by a Shopify merchant. They can never reach Stripe.

2. **Managed Pricing redirect.** `POST /api/shopify/billing` no longer creates
   an `appSubscriptionCreate` mutation. It returns the merchant's Managed
   Pricing URL:
   ```
   https://admin.shopify.com/store/{store-handle}/charges/{app-handle}/pricing_plans
   ```
   Plans are configured in **Partner Dashboard → SpaceCheck → Distribution →
   Managed Pricing**.

3. **UI segmentation.** The dashboard settings page (`/dashboard/settings`)
   detects Shopify merchants and replaces the credit-pack UI with a single
   *"Manage subscription on Shopify"* CTA.

4. **Usage gating.** Shopify-subscribed users skip the credit-deduction code
   path in `utils/usage-limits.ts:canUnlockModel`. Their plan (configured in
   Shopify) covers usage; we don't bill them per unlock.

5. **Webhook sync (unchanged).** `POST /api/shopify/webhook` still receives
   `app_subscriptions/update` events from Shopify and writes
   `billing_source = 'shopify'`, `shopify_subscription_status`, and
   `plan_type` into `profiles`. This works identically for Managed Pricing
   and the Billing API.

## Setup checklist (manual — done in the Shopify Partner Dashboard)

- [ ] Partner Dashboard → SpaceCheck → **Distribution** → **Managed Pricing** →
      enable.
- [ ] Add plan: e.g. "Growth", $49/mo, 14-day trial, recurring (EVERY_30_DAYS).
- [ ] Note the **App URL handle** shown on the Distribution page.
- [ ] Set `SHOPIFY_APP_HANDLE` in `.env.local` to that handle (default
      assumed: `spacecheck`).
- [ ] Verify webhook subscription `app_subscriptions/update` is in
      `meshify/shopify.app.toml` (it is) and pointing at
      `/api/shopify/webhook` (it is).

## Resubmission notes for Shopify App Review

- App charges for Shopify merchants are now **exclusively** routed through
  Shopify Managed Pricing.
- Stripe is preserved only for users who sign up directly through the public
  website and never installed the Shopify app — those users cannot reach the
  Shopify install flow without first creating a `shopify_stores` row, after
  which all their Stripe paths are blocked.
- All four Stripe endpoints (`create-checkout`, `create-checkout-credits`,
  `create-portal`, `create-special-checkout`) reject Shopify merchants with
  HTTP 403.
- The Managed Pricing URL is exposed via `POST /api/shopify/billing` and a
  convenience `GET /api/shopify/billing` redirect.

## Files involved

- `utils/billing-source.ts` — detection helper, Managed Pricing URL builder
- `app/api/shopify/billing/route.ts` — Managed Pricing entry point
- `app/api/create-checkout/route.ts` — Stripe blocker
- `app/api/create-checkout-credits/route.ts` — Stripe blocker
- `app/api/create-portal/route.ts` — Stripe blocker
- `app/api/create-special-checkout/route.ts` — Stripe blocker
- `app/api/shopify/webhook/route.ts` — `app_subscriptions/update` sync
- `app/dashboard/settings/page.tsx` — segmented billing UI
- `utils/usage-limits.ts` — credit-bypass for Shopify subscribers
- `meshify/shopify.app.toml` — Shopify app config

## Legacy code

`utils/shopify-billing.ts` still contains the older `appSubscriptionCreate`
helper. It is no longer called by any route in this codebase. Keep it for now
as a fallback in case Managed Pricing has to be temporarily disabled, but the
production path is Managed Pricing.
