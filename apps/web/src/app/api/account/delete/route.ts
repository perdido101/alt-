import { deleteAccount } from '@/server/account';
import { requestUser } from '@/server/auth';
import { HttpError, errorResponse } from '@/server/supabase';

/** GDPR erasure. Requires {"confirm": true}. */
export async function POST(req: Request) {
  try {
    const user = await requestUser(req);
    const body = (await req.json().catch(() => null)) as { confirm?: boolean } | null;
    if (body?.confirm !== true) throw new HttpError(400, 'confirmation_required');
    await deleteAccount(user.id);
    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
