import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createShopifySubscription } from '@/utils/shopify-billing'

/**
 * POST /api/shopify/billing
 *
 * Creates a Shopify app subscription (Growth plan) for the authenticated user.
 * Returns a confirmation URL that the merchant must visit to approve the charge.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a connected Shopify store
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('shop_domain')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json(
        { error: 'No Shopify store connected. Connect your store first.' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spacecheck.app'
    const returnUrl = `${siteUrl}/api/shopify/billing/callback?user_id=${user.id}`

    const result = await createShopifySubscription(user.id, returnUrl)

    return NextResponse.json({
      confirmationUrl: result.confirmationUrl,
      subscriptionId: result.subscriptionId,
    })
  } catch (error: any) {
    console.error('Shopify billing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Shopify subscription' },
      { status: 500 }
    )
  }
}
