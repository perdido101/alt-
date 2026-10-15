import { NextResponse } from 'next/server';
import { supabaseServer } from '@/server/auth';

export async function POST(req: Request) {
  await (await supabaseServer()).auth.signOut().catch(() => undefined);
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
