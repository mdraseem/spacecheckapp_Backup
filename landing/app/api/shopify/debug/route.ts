import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/shopify/debug
 *
 * Diagnostic endpoint for Shopify connection issues. Returns:
 *  - The currently authenticated user (from Supabase session cookies)
 *  - All Shopify stores in the DB (user_id + shop_domain + installed_at)
 *  - Pending OAuth cookies (if any)
 *  - A diagnosis hint
 *
 * Use this when "No Shopify store connected" persists despite a successful
 * OAuth callback. Compare auth user_id with what's in shopify_stores.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const pendingShop = cookieStore.get('shopify_pending_shop')?.value
  const pendingToken = !!cookieStore.get('shopify_pending_token')?.value
  const pendingScopes = cookieStore.get('shopify_pending_scopes')?.value

  // Service-role client to bypass RLS for full visibility
  const { createClient: createServiceClient } = await import(
    '@supabase/supabase-js'
  )
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: allStores, error: allStoresError } = await serviceSupabase
    .from('shopify_stores')
    .select('id, user_id, shop_domain, installed_at, scopes')
    .order('installed_at', { ascending: false })

  let myStore: unknown = null
  let myStoreError: string | undefined
  if (user) {
    const { data, error } = await serviceSupabase
      .from('shopify_stores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    myStore = data
    myStoreError = error?.message
  }

  // Diagnose
  let diagnosis = ''
  if (!user) {
    diagnosis = 'NOT_AUTHENTICATED: No Supabase session cookies. Log in first.'
  } else if (myStore) {
    diagnosis = 'OK: Store found for current user. Products endpoint should work.'
  } else if (allStores && allStores.length > 0) {
    const matchByEmail = allStores.find((s: { user_id: string }) => s.user_id !== user.id)
    if (matchByEmail) {
      diagnosis = `USER_ID_MISMATCH: ${allStores.length} store(s) exist in DB but none for user_id ${user.id}. Store was saved under a different user. Check if you installed under a different account.`
    } else {
      diagnosis = 'NO_STORE_FOR_USER: Stores exist but not for you.'
    }
  } else {
    diagnosis = 'NO_STORES_AT_ALL: shopify_stores table is empty. OAuth callback never persisted anything.'
  }

  return NextResponse.json(
    {
      authUser: user
        ? { id: user.id, email: user.email }
        : null,
      myStore,
      myStoreError,
      allStores,
      allStoresError: allStoresError?.message,
      pendingCookies: {
        hasToken: pendingToken,
        shop: pendingShop,
        scopes: pendingScopes,
      },
      diagnosis,
    },
    { status: 200 }
  )
}
