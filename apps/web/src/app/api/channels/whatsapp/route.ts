import { env } from '@/server/env';
import { handleInbound } from '@/server/channels/handle';
import { whatsappAdapter } from '@/server/channels/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Meta's webhook verification handshake. */
export async function GET(req: Request) {
  if (!whatsappAdapter.enabled()) return new Response('disabled', { status: 404 });
  const url = new URL(req.url);
  const ok = url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env().WHATSAPP_VERIFY_TOKEN;
  return ok ? new Response(url.searchParams.get('hub.challenge') ?? '') : new Response('forbidden', { status: 403 });
}

export async function POST(req: Request) {
  if (!whatsappAdapter.enabled()) return new Response('disabled', { status: 404 });
  const raw = await req.text();
  if (!whatsappAdapter.verify(req, raw)) return new Response('invalid signature', { status: 401 });
  for (const msg of whatsappAdapter.parse(raw)) await handleInbound(whatsappAdapter, msg);
  return new Response('ok');
}
