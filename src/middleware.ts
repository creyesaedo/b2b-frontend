import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Public routes reachable without a session: the landing (`/`, `/es`, `/en`) and
// the auth screens (login/signup). EVERYTHING else is protected by default, so a
// new route under `(app)` is gated automatically without touching this list.
const PUBLIC_ROUTE = /^\/(es|en)?(\/(login|signup))?\/?$/;

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // The BFF sets the httpOnly `sid` cookie on localhost (port-agnostic), so the
  // browser sends it here too. We only check presence — real validation is the
  // BFF's job (the AuthProvider calls /auth/me, AuthGuard enforces it).
  if (!PUBLIC_ROUTE.test(pathname) && !request.cookies.has('sid')) {
    const segment = pathname.split('/')[1];
    const locale = routing.locales.includes(segment as (typeof routing.locales)[number])
      ? segment
      : routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Run on everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
