import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/shopify/complete-connection
 *
 * Completes the Shopify OAuth connection for users who were not logged in
 * during the OAuth callback. The callback stores the encrypted token,
 * shop domain and scopes in short-lived cookies and redirects the user to
 * login. After logging in / signing up the user is redirected here so we
 * can persist the connection to the DB.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const cookieStore = await cookies()
  const pendingToken = cookieStore.get('shopify_pending_token')?.value
  const pendingShop = cookieStore.get('shopify_pending_shop')?.value
  const pendingScopes = cookieStore.get('shopify_pending_scopes')?.value

  // If cookies have expired or were never set, send the user to /connect
  if (!pendingToken || !pendingShop) {
    return NextResponse.redirect(
      `${siteUrl}/connect?error=session_expired`
    )
  }

  // Verify the user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Still not logged in — redirect to login with retry
    return NextResponse.redirect(
      `${siteUrl}/login?redirect=/api/shopify/complete-connection`
    )
  }

  try {
    // Use service role client to bypass RLS for upsert
    const { createClient: createServiceClient } = await import(
      '@supabase/supabase-js'
    )
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await serviceSupabase
      .from('shopify_stores')
      .upsert(
        {
          user_id: user.id,
          shop_domain: pendingShop,
          access_token_encrypted: pendingToken,
          scopes: pendingScopes ? pendingScopes.split(',') : [],
          installed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,shop_domain' }
      )

    if (dbError) {
      console.error('Failed to save pending Shopify store:', dbError)
      return NextResponse.redirect(`${siteUrl}/connect?error=db_error`)
    }

    // Clean up pending cookies
    const response = NextResponse.redirect(
      `${siteUrl}/dashboard/shopify?connected=true`
    )
    response.cookies.delete('shopify_pending_token')
    response.cookies.delete('shopify_pending_shop')
    response.cookies.delete('shopify_pending_scopes')
    response.cookies.delete('shopify_nonce')
    response.cookies.delete('shopify_shop')
    return response
  } catch (error) {
    console.error('Complete connection error:', error)
    return NextResponse.redirect(
      `${siteUrl}/connect?error=token_exchange_failed`
    )
  }
}
