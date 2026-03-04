import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { updateSession } from "@/utils/supabase/middleware";

let locales = ["en", "pl"];
let defaultLocale = "en";

function getLocale(request: NextRequest): string {
  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle Supabase Auth & Session Refresh
  // This will handle protection of /dashboard and redirection from /login if authenticated
  // It returns a generic response with cookies set if no redirect happens.
  const supabaseResponse = await updateSession(request);

  // If Supabase redirected (e.g. to /login), return that immediately
  if (supabaseResponse.headers.get('location')) {
    return supabaseResponse;
  }

  // 2. Exclusions
  // Exclude static files, images, icons, api, and protected routes from localization
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/connect') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/contact')
  ) {
    return supabaseResponse;
  }

  // 3. Localization Logic for Public Pages
  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // Redirect if there is no locale
    const redirectUrl = new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next|favicon.ico|api|.*\\..*).*)',
  ],
};

