import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
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
    // Create the redirect response FIRST so we can attach cookies to it
    const redirectUrl = `${redirectBase}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieStore = request.headers.get('cookie') || ''
            return cookieStore.split(';').filter(Boolean).map((cookie) => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response // Cookies are attached to this redirect response
    }

    console.error('Auth callback error:', error.message)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${redirectBase}/auth/auth-code-error`)
}
