import 'server-only';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { env } from './env';

let admin: SupabaseClient | null = null;

/** Service-role client: bypasses RLS. Use only after checking who the caller is. */
export function supabaseAdmin(): SupabaseClient {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) throw new HttpError(503, 'backend_not_configured');
  admin ??= createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

/** Resolves the Supabase user from "Authorization: Bearer <access token>" (mobile app). */
export async function userFromRequest(req: Request): Promise<User> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new HttpError(401, 'unauthorized');
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'unauthorized');
  return data.user;
}

export type Membership = { circleId: string; role: 'guardian' | 'protected'; displayName: string };

/** The caller's circle: the one they are protected in, else the first they guard (or the one requested). */
export async function membershipFor(userId: string, circleId?: string | null): Promise<Membership> {
  let q = supabaseAdmin().from('circle_members').select('circle_id, role, display_name').eq('user_id', userId);
  if (circleId) q = q.eq('circle_id', circleId);
  const { data, error } = await q;
  if (error) throw new HttpError(500, 'db_error');
  const rows = (data ?? []) as Array<{ circle_id: string; role: 'guardian' | 'protected'; display_name: string }>;
  const row = rows.find((r) => r.role === 'protected') ?? rows[0];
  if (!row) throw new HttpError(403, 'no_circle');
  return { circleId: row.circle_id, role: row.role, displayName: row.display_name };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) return Response.json({ error: error.code }, { status: error.status });
  console.error(error);
  return Response.json({ error: 'internal_error' }, { status: 500 });
}
