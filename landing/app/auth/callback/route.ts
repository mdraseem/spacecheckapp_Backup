import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  let redirectBase: string
  if (isLocalEnv) {
    redirectBase = requestUrl.origin
  } else if (forwardedHost) {
    redirectBase = `https://${forwardedHost}`
  } else {
    redirectBase = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
  }

  if (code) {
    const redirectUrl = `${redirectBase}${next}`
    const response = NextResponse.redirect(redirectUrl)

    // Use a promise to wait for setAll to be called asynchronously
    let resolveSetAll: () => void
    const setAllPromise = new Promise<void>((resolve) => {
      resolveSetAll = resolve
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
            resolveSetAll()
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Wait for setAll to fire (it's called asynchronously by Supabase)
      await setAllPromise
      console.log('[auth/callback] SUCCESS - cookies set, redirecting to:', redirectUrl)
      return response
    }

    console.error('[auth/callback] FAILED:', error.message)
  }

  return NextResponse.redirect(`${redirectBase}/auth/auth-code-error`)
}
