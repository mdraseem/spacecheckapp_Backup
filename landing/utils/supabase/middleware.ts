import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run Supabase auth logic on static files, images, etc.
  // This logic is also handled in the matcher of the main middleware,
  // but good to be safe.
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Debug logging for auth flow
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/auth')) {
    const authCookies = request.cookies.getAll().filter(c => c.name.includes('sb-'))
    console.log(`[middleware] path: ${request.nextUrl.pathname}`)
    console.log(`[middleware] user: ${user?.email || 'null'}`)
    console.log(`[middleware] auth cookies: ${authCookies.map(c => c.name).join(', ') || 'none'}`)
  }

  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    // Redirect to login if accessing dashboard without user
    console.log('[middleware] No user on /dashboard - redirecting to /login')
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is logged in and tries to access login, redirect to dashboard
  if (request.nextUrl.pathname.startsWith('/login') && user) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
