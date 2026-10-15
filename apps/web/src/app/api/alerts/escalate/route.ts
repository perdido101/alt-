import { z } from 'zod';
import { escalateAlert } from '@/server/alerts';
import { verifyJobRequest } from '@/server/jobs/schedule';
import { errorResponse } from '@/server/supabase';

export const runtime = 'nodejs';

/** Delayed job (QStash, +5 minutes per alert). Safe to deliver more than once. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyJobRequest(req, raw))) return new Response('unauthorized', { status: 401 });
  const parsed = z.object({ alertId: z.string().uuid() }).safeParse(JSON.parse(raw || '{}'));
  if (!parsed.success) return new Response('bad request', { status: 400 });
  try {
    return Response.json(await escalateAlert(parsed.data.alertId));
  } catch (error) {
    return errorResponse(error);
  }
}
