import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getManagedPricingUrl } from '@/utils/billing-source'

/**
 * POST /api/shopify/billing
 *
 * Returns the Shopify Managed Pricing URL for the merchant's store. The
 * front-end should open this URL so the merchant picks a plan on Shopify's
 * own pricing page (which Shopify renders from the plans you configured in
 * the Partner Dashboard → Distribution → Managed Pricing).
 *
 * This replaces the previous in-app `appSubscriptionCreate` GraphQL flow.
 * Both Managed Pricing and the Billing API are acceptable per Shopify rule
 * 1.2.1; Managed Pricing is simpler and the recommended path.
 *
 * The actual subscription state still flows back into our DB via the
 * `app_subscriptions/update` webhook handler in /api/shopify/webhook.
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

    // Look up the merchant's connected Shopify store.
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

    const url = getManagedPricingUrl(store.shop_domain)

    return NextResponse.json({
      url,
      // Keep the legacy field name for client compatibility — clients used to
      // open `confirmationUrl` returned by the AppSubscriptionCreate mutation.
      confirmationUrl: url,
      managed: true,
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
 * Convenience: redirect the merchant straight to the Managed Pricing URL.
 * Useful for "Manage subscription on Shopify" buttons that just need an href.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const { data: store } = await supabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!store?.shop_domain) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    return NextResponse.redirect(`${siteUrl}/connect?error=not_connected`)
  }

  return NextResponse.redirect(getManagedPricingUrl(store.shop_domain))
}
