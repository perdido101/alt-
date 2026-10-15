import { createClient } from '@supabase/supabase-js';
import { requestUser, supabaseServer } from '@/server/auth';
import { env } from '@/server/env';
import { errorResponse } from '@/server/supabase';

/** GDPR access/portability: everything we hold about the caller, as JSON. */
export async function GET(req: Request) {
  try {
    await requestUser(req);
    const token = req.headers.get('authorization');
    const db = token
      ? createClient(env().NEXT_PUBLIC_SUPABASE_URL!, env().NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: token } }, auth: { persistSession: false } })
      : await supabaseServer();
    const { data, error } = await db.rpc('export_my_data');
    if (error) throw error;
    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="alt-my-data.json"' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
