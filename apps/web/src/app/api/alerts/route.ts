import { AlertSource } from '@alt/core';
import { z } from 'zod';
import { createAlert } from '@/server/alerts';
import { enforceLimit } from '@/server/rateLimit';
import { HttpError, errorResponse, userFromRequest } from '@/server/supabase';

export const runtime = 'nodejs';

const Body = z.object({
  source: AlertSource,
  checkId: z.string().uuid().nullish(),
  callEventId: z.string().uuid().nullish(),
  callerNumber: z.string().max(32).nullish(),
});

/** POST /api/alerts: the parent asks for help. Notifies every guardian at once. */
export async function POST(req: Request) {
  try {
    const user = await userFromRequest(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, 'invalid_request');
    await enforceLimit('alertUser', user.id);
    const result = await createAlert({ userId: user.id, ...parsed.data });
    return Response.json(result, { status: result.deduplicated ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
