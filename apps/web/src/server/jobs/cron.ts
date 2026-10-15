import 'server-only';
import { errorResponse } from '../supabase';
import { verifyJobRequest } from './schedule';

/** Wraps a scheduled job: Vercel Cron calls it with `Authorization: Bearer $CRON_SECRET`. */
export function cronRoute(job: () => Promise<Record<string, unknown>>) {
  return async (req: Request) => {
    if (!(await verifyJobRequest(req, ''))) return new Response('unauthorized', { status: 401 });
    try {
      return Response.json(await job());
    } catch (error) {
      return errorResponse(error);
    }
  };
}
