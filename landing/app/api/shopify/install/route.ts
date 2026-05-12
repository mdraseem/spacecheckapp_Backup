import { NextResponse } from 'next/server'
import { isValidShopDomain, buildInstallUrl } from '@/utils/shopify'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get('shop')?.toLowerCase().trim()

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Invalid or missing shop domain. Expected format: yourstore.myshopify.com' },
      { status: 400 }
    )
  }

  // Generate a nonce for CSRF protection
  const nonce = crypto.randomUUID()

  // Store nonce in a short-lived cookie
  const installUrl = buildInstallUrl(shop, nonce)

  const response = NextResponse.redirect(installUrl)
  // Use SameSite=None so cookies survive the cross-origin redirect from Shopify
  // back to our callback. SameSite=Lax can drop the cookie in some browsers
  // when the redirect originates from a different domain.
  response.cookies.set('shopify_nonce', nonce, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 600, // 10 minutes
    path: '/',
  })
  // Store shop domain so callback can verify
  response.cookies.set('shopify_shop', shop, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 600,
    path: '/',
  })

  return response
}
