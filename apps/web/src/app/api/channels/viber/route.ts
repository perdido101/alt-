import { handleInbound } from '@/server/channels/handle';
import { viberAdapter } from '@/server/channels/viber';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!viberAdapter.enabled()) return new Response('disabled', { status: 404 });
  const raw = await req.text();
  if (!viberAdapter.verify(req, raw)) return new Response('invalid signature', { status: 401 });
  for (const msg of viberAdapter.parse(raw)) await handleInbound(viberAdapter, msg);
  return new Response('ok');
}
