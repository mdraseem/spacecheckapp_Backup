import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  isValidShopDomain,
  verifyHmac,
  exchangeCodeForToken,
  encryptToken,
} from '@/utils/shopify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')
  const hmac = searchParams.get('hmac')
  const timestamp = searchParams.get('timestamp')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Basic parameter validation
  if (!code || !shop || !state || !hmac) {
    return NextResponse.redirect(`${siteUrl}/connect?error=missing_params`)
  }

  if (!isValidShopDomain(shop)) {
    return NextResponse.redirect(`${siteUrl}/connect?error=invalid_shop`)
  }

  // Verify nonce (CSRF protection)
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get('shopify_nonce')?.value

  if (!storedNonce || state !== storedNonce) {
    return NextResponse.redirect(`${siteUrl}/connect?error=invalid_nonce`)
  }

  // Verify HMAC signature
  const queryParams: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  if (!verifyHmac(queryParams)) {
    return NextResponse.redirect(`${siteUrl}/connect?error=invalid_hmac`)
  }

  try {
    // Exchange authorization code for permanent access token
    const { access_token, scope } = await exchangeCodeForToken(shop, code)

    // Get the current authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // User is not logged in — store shop info in cookies and redirect to login.
      // After login the user is sent to /api/shopify/complete-connection which
      // reads these cookies and persists the store to the DB.
      const response = NextResponse.redirect(`${siteUrl}/login?redirect=${encodeURIComponent('/api/shopify/complete-connection')}`)
      response.cookies.set('shopify_pending_token', encryptToken(access_token), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      })
      response.cookies.set('shopify_pending_shop', shop, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      })
      response.cookies.set('shopify_pending_scopes', scope, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600,
        path: '/',
      })
      return response
    }

    // Encrypt token before storing
    const encryptedToken = encryptToken(access_token)

    // Use service role client to bypass RLS for upsert
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert the shop connection
    const { error: dbError } = await serviceSupabase
      .from('shopify_stores')
      .upsert(
        {
          user_id: user.id,
          shop_domain: shop,
          access_token_encrypted: encryptedToken,
          scopes: scope.split(','),
          installed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,shop_domain' }
      )

    if (dbError) {
      console.error('Failed to save Shopify store:', dbError)
      return NextResponse.redirect(`${siteUrl}/connect?error=db_error`)
    }

    // Clean up cookies
    const response = NextResponse.redirect(`${siteUrl}/dashboard/shopify?connected=true`)
    response.cookies.delete('shopify_nonce')
    response.cookies.delete('shopify_shop')
    return response
  } catch (error) {
    console.error('Shopify OAuth callback error:', error)
    return NextResponse.redirect(`${siteUrl}/connect?error=token_exchange_failed`)
  }
}
