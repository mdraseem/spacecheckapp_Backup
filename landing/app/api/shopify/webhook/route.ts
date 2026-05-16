import { NextResponse } from 'next/server'
import { verifyWebhookHmac } from '@/utils/shopify'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const body = await request.text()
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256')

  if (!hmacHeader) {
    return NextResponse.json({ error: 'Missing HMAC' }, { status: 401 })
  }

  // Verify the webhook came from Shopify
  if (!verifyWebhookHmac(body, hmacHeader)) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
  }

  const topic = request.headers.get('x-shopify-topic')
  const shopDomain = request.headers.get('x-shopify-shop-domain')

  if (!shopDomain) {
    return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 })
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (topic) {
      case 'app/uninstalled': {
        // Clean up: remove shop connection
        const { error } = await serviceSupabase
          .from('shopify_stores')
          .delete()
          .eq('shop_domain', shopDomain)

        if (error) {
          console.error('Failed to clean up uninstalled shop:', error)
        }

        console.log(`Shopify app uninstalled from ${shopDomain}`)
        break
      }

      case 'shop/redact': {
        // GDPR: shop data erasure request
        // Remove all data associated with this shop
        const { error } = await serviceSupabase
          .from('shopify_stores')
          .delete()
          .eq('shop_domain', shopDomain)

        if (error) {
          console.error('Failed to handle shop redact:', error)
        }

        // Also clean up sync records
        await serviceSupabase
          .from('shopify_syncs')
          .delete()
          .eq('shop_domain', shopDomain)

        console.log(`Shop data redacted for ${shopDomain}`)
        break
      }

      case 'customers/redact': {
        // GDPR: customer data erasure - we don't store customer data
        console.log(`Customer redact request from ${shopDomain} - no customer data stored`)
        break
      }

      case 'customers/data_request': {
        // GDPR: customer data request - we don't store customer data
        console.log(`Customer data request from ${shopDomain} - no customer data stored`)
        break
      }

      case 'app_subscriptions/update': {
        // Shopify billing: subscription status changed
        const payload = JSON.parse(body)
        const subscriptionId = payload?.app_subscription?.admin_graphql_api_id
        const status = payload?.app_subscription?.status

        if (subscriptionId && status) {
          // Find the user associated with this shop (most recent install)
          const { data: store } = await serviceSupabase
            .from('shopify_stores')
            .select('user_id')
            .eq('shop_domain', shopDomain)
            .order('installed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (store?.user_id) {
            const isActive = status === 'active' || status === 'ACTIVE'
            const planType = isActive ? 'growth' : 'starter'

            await serviceSupabase.from('profiles').upsert({
              id: store.user_id,
              billing_source: 'shopify',
              shopify_subscription_id: subscriptionId,
              shopify_subscription_status: status.toLowerCase(),
              plan_type: planType,
              subscription_status: status.toLowerCase(),
              updated_at: new Date().toISOString(),
            })

            console.log(
              `Shopify subscription ${status} for ${shopDomain} (user: ${store.user_id})`
            )
          }
        }
        break
      }

      default:
        console.log(`Unhandled webhook topic: ${topic} from ${shopDomain}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
