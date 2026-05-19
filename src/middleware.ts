import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, type NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { locales, defaultLocale } from '@/i18n';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // Skip i18n for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return updateSession(request);
  }

  // 1. i18n routing — may redirect to add the locale prefix.
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  // 2. Auth/session refresh — may redirect (e.g. unauthenticated → login).
  const authResponse = await updateSession(request);
  if (authResponse.headers.get('location')) {
    return authResponse;
  }

  // 3. Neither redirected. Return the auth response, but carry over the
  //    request-header rewrites next-intl uses to expose the resolved locale
  //    to getRequestConfig. Without this, useTranslations/getMessages fall
  //    back to the default locale even when the URL says otherwise.
  return mergeRequestHeaderRewrites(intlResponse, authResponse);
}

function headerList(res: NextResponse, name: string): string[] {
  return (res.headers.get(name) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeRequestHeaderRewrites(from: NextResponse, into: NextResponse): NextResponse {
  const rewrites = headerList(from, 'x-middleware-override-headers');
  if (rewrites.length === 0) return into;

  const merged = new Set(headerList(into, 'x-middleware-override-headers'));
  for (const name of rewrites) {
    merged.add(name);
    const value = from.headers.get(`x-middleware-request-${name}`);
    if (value !== null) {
      into.headers.set(`x-middleware-request-${name}`, value);
    }
  }
  into.headers.set('x-middleware-override-headers', [...merged].join(','));
  return into;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
