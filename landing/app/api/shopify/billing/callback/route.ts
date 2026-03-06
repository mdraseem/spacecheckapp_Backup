import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getActiveShopifySubscription,
  syncShopifySubscriptionToProfile,
} from '@/utils/shopify-billing'

/**
 * GET /api/shopify/billing/callback
 *
 * Shopify redirects here after the merchant approves/declines the charge.
 * Query params from Shopify: charge_id (for one-time) or subscription_id
 * We also pass user_id in the returnUrl we set when creating the subscription.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?billing=error&reason=missing_user`
    )
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check the actual subscription status from Shopify
    const subscription = await getActiveShopifySubscription(userId)

    if (subscription && (subscription.status === 'ACTIVE' || subscription.status === 'active')) {
      // Merchant approved — sync to profile
      await syncShopifySubscriptionToProfile(userId, {
        id: subscription.id,
        status: subscription.status,
      })

      // Track the upgrade event
      try {
        await serviceSupabase.from('analytics').insert({
          event_type: 'shopify_subscription_activated',
          user_id: userId,
          metadata: {
            subscription_id: subscription.id,
            plan: 'growth',
            billing_source: 'shopify',
          },
        })
      } catch {
        // Analytics tracking is non-critical
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&billing=shopify`
      )
    } else {
      // Merchant declined or subscription not found
      // Keep them on starter plan
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?billing=declined`
      )
    }
  } catch (error: any) {
    console.error('Shopify billing callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?billing=error&reason=callback_failed`
    )
  }
}
