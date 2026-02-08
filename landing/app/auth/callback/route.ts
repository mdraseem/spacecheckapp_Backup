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

  console.log('[auth/callback] code present:', !!code)
  console.log('[auth/callback] redirectBase:', redirectBase)
  console.log('[auth/callback] forwardedHost:', forwardedHost)
  console.log('[auth/callback] requestUrl:', requestUrl.toString())
  console.log('[auth/callback] cookies:', request.headers.get('cookie')?.substring(0, 200))

  if (code) {
    // Create the redirect response FIRST so we can attach cookies to it
    const redirectUrl = `${redirectBase}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            console.log('[auth/callback] setAll called with cookies:', cookiesToSet.map(c => c.name).join(', '))
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[auth/callback] exchangeCodeForSession error:', error?.message || 'none')

    if (!error) {
      console.log('[auth/callback] SUCCESS - redirecting to:', redirectUrl)
      return response // Cookies are attached to this redirect response
    }

    console.error('[auth/callback] FAILED:', error.message)
  }

  // return the user to an error page with instructions
  console.log('[auth/callback] redirecting to error page')
  return NextResponse.redirect(`${redirectBase}/auth/auth-code-error`)
}
