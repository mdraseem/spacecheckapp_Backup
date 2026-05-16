import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { fetchProducts, decryptToken } from '@/utils/shopify'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the user's connected Shopify store
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: store, error: storeError } = await serviceSupabase
    .from('shopify_stores')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (storeError || !store) {
    // Debug: log auth user vs what's in shopify_stores so we can diagnose
    // user_id mismatch issues (e.g. callback saved on a different account).
    const { data: allStores } = await serviceSupabase
      .from('shopify_stores')
      .select('user_id, shop_domain, installed_at')
      .order('installed_at', { ascending: false })
      .limit(5)

    console.log('[shopify/products] No store for user', {
      authUserId: user.id,
      authUserEmail: user.email,
      storeError: storeError?.message,
      recentStores: allStores,
    })

    return NextResponse.json(
      { error: 'No Shopify store connected' },
      { status: 404 }
    )
  }

  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after') || undefined
  const query = searchParams.get('query') || undefined
  const first = parseInt(searchParams.get('first') || '24', 10)

  try {
    const accessToken = decryptToken(store.access_token_encrypted)
    const products = await fetchProducts(store.shop_domain, accessToken, {
      first,
      after,
      query,
    })

    return NextResponse.json({
      products: products.edges.map((edge: any) => edge.node),
      pageInfo: products.pageInfo,
      shopDomain: store.shop_domain,
    })
  } catch (error: any) {
    console.error('Failed to fetch Shopify products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products from Shopify' },
      { status: 500 }
    )
  }
}
