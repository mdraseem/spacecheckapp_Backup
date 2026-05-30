import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createShopifySubscription } from '@/utils/shopify-billing'

/**
 * POST /api/shopify/billing
 *
 * Creates a Shopify app subscription via the Shopify Billing API
 * (appSubscriptionCreate GraphQL mutation) and returns the merchant-facing
 * confirmation URL. The merchant is redirected to that URL where Shopify
 * shows the standard Approve / Decline screen for the recurring charge.
 *
 * After approval/decline Shopify redirects the merchant to the returnUrl,
 * which is /api/shopify/billing/callback (handled separately). The actual
 * subscription state also flows back into our DB via the
 * `app_subscriptions/update` webhook handler in /api/shopify/webhook.
 *
 * This satisfies Shopify rule 1.2.1 (apps must use Managed Pricing or the
 * Shopify Billing API for charges; off-platform billing is not allowed for
 * Shopify-installed merchants).
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Confirm the user actually has a connected Shopify store before
    // attempting to create a subscription. createShopifySubscription will
    // also throw if none is found, but this gives a cleaner error message.
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shop_domain')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!store?.shop_domain) {
      return NextResponse.json(
        { error: 'No Shopify store connected. Connect your store first.' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    // Shopify will redirect the merchant here after they Approve/Decline.
    // We pass user_id so the callback can look up which user just transacted.
    const returnUrl = `${siteUrl}/api/shopify/billing/callback?user_id=${encodeURIComponent(
      user.id
    )}`

    const { confirmationUrl, subscriptionId } = await createShopifySubscription(
      user.id,
      returnUrl
    )

    return NextResponse.json({
      // New canonical field — the URL the front-end should redirect to.
      confirmationUrl,
      // Backwards-compatible alias used elsewhere in the codebase.
      url: confirmationUrl,
      subscriptionId,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create Shopify subscription'
    console.error('Shopify billing error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/shopify/billing
 *
 * Convenience: trigger subscription creation directly from an HTML link and
 * redirect the merchant straight to Shopify's Approve/Decline screen.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const { data: store } = await supabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!store?.shop_domain) {
    return NextResponse.redirect(`${siteUrl}/connect?error=not_connected`)
  }

  try {
    const returnUrl = `${siteUrl}/api/shopify/billing/callback?user_id=${encodeURIComponent(
      user.id
    )}`
    const { confirmationUrl } = await createShopifySubscription(user.id, returnUrl)
    return NextResponse.redirect(confirmationUrl)
  } catch (error: unknown) {
    console.error('Shopify billing GET error:', error)
    return NextResponse.redirect(
      `${siteUrl}/dashboard/settings?billing=error&reason=create_failed`
    )
  }
}
