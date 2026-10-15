import 'server-only';
import { notFound } from 'next/navigation';
import { supabaseServer } from './auth';

/** Admin pages use the admin's own session: RLS (is_admin) enforces every read and write. */
export async function requireAdmin() {
  const db = await supabaseServer();
  const { data: user } = await db.auth.getUser();
  if (!user.user) notFound();
  const { data } = await db.from('profiles').select('is_admin').eq('id', user.user.id).single();
  if (!(data as { is_admin?: boolean } | null)?.is_admin) notFound();
  return { db, userId: user.user.id };
}
