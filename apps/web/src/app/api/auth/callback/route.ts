import { NextResponse } from 'next/server';
import { supabaseServer } from '@/server/auth';

/** Only same-site, known destinations: never redirect to a URL taken from the query (open redirect). */
const SAFE_NEXT = /^\/(el|en)\/(app|org|admin)(\/[a-z0-9\-/]*)?$/;

/** Magic-link return for the website (PKCE). Sets the session cookie and continues to the dashboard. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const requested = url.searchParams.get('next') ?? '';
  const next = SAFE_NEXT.test(requested) ? requested : '/el/app';
  if (code) await (await supabaseServer()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, url.origin));
}
