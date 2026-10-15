import { NextResponse } from 'next/server';
import { supabaseServer } from '@/server/auth';

/** Magic-link return for the website (PKCE). Sets the session cookie and continues to the dashboard. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/el/app';
  if (code) await (await supabaseServer()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/el/app', url.origin));
}
