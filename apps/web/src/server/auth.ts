import 'server-only';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from './env';
import { HttpError, supabaseAdmin } from './supabase';

/** User-scoped Supabase client from the session cookie: RLS applies (dashboard, admin, org portal). */
export async function supabaseServer(): Promise<SupabaseClient> {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new HttpError(503, 'backend_not_configured');
  const store = await cookies();
  return createServerClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

export async function currentUser(): Promise<User | null> {
  try {
    const { data } = await (await supabaseServer()).auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/** Bearer token (mobile app) or session cookie (website). */
export async function requestUser(req: Request): Promise<User> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data.user) throw new HttpError(401, 'unauthorized');
    return data.user;
  }
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'unauthorized');
  return user;
}

export async function assertGuardian(userId: string, circleId: string): Promise<void> {
  const { data } = await supabaseAdmin().from('circle_members').select('role').eq('circle_id', circleId).eq('user_id', userId).maybeSingle();
  if ((data as { role?: string } | null)?.role !== 'guardian') throw new HttpError(403, 'forbidden');
}
