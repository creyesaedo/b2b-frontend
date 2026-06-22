import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Protected app sections (gated client-side too; this is a cheap presence gate).
const PROTECTED = /^\/(es|en)\/(dashboard|products|categories|sellers|admin)(\/|$)/;

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // The BFF sets the httpOnly `sid` cookie on localhost (port-agnostic), so the
  // browser sends it here too. We only check presence — real validation is the
  // BFF's job (the AuthProvider calls /auth/me).
  if (PROTECTED.test(pathname) && !request.cookies.has('sid')) {
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Run on everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
