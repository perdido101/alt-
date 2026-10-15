import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);
const SIGNED_IN_AREAS = /^\/(el|en)\/(app|admin|org)(\/|$)/;

/** Locale routing for every page; Supabase session refresh for the signed-in areas. */
export default async function proxy(request: NextRequest) {
  const response = intl(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !SIGNED_IN_AREAS.test(request.nextUrl.pathname)) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|\\.well-known|.*\\..*).*)'],
};
