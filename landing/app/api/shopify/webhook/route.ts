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
