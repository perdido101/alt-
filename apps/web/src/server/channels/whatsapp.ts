import { env } from '../env';
import { hmacHex, safeEqual } from './crypto';
import type { ChannelAdapter, InboundMessage } from './types';

type WaMessage = {
  from: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type?: string; caption?: string };
  audio?: { id: string; mime_type?: string };
};
type WaPayload = { entry?: Array<{ changes?: Array<{ value?: { messages?: WaMessage[] } }> }> };

const graph = (path: string) => `https://graph.facebook.com/${env().WHATSAPP_GRAPH_VERSION}/${path}`;

/** WhatsApp Business Cloud API. Webhook: GET/POST /api/channels/whatsapp. Disabled unless FEATURE_WHATSAPP=on. */
export const whatsappAdapter: ChannelAdapter = {
  channel: 'whatsapp',
  enabled: () => env().FEATURE_WHATSAPP === 'on' && !!env().WHATSAPP_ACCESS_TOKEN && !!env().WHATSAPP_APP_SECRET,

  verify(req, rawBody) {
    const secret = env().WHATSAPP_APP_SECRET;
    const header = req.headers.get('x-hub-signature-256');
    return !!secret && !!header && safeEqual(`sha256=${hmacHex(secret, rawBody)}`, header.toLowerCase());
  },

  parse(rawBody) {
    const body = JSON.parse(rawBody) as WaPayload;
    const out: InboundMessage[] = [];
    for (const entry of body.entry ?? [])
      for (const change of entry.changes ?? [])
        for (const m of change.value?.messages ?? []) {
          const base = { channel: 'whatsapp' as const, externalId: m.from };
          if (m.type === 'text') out.push({ ...base, kind: 'text', text: m.text?.body ?? '' });
          else if (m.type === 'image' && m.image) out.push({ ...base, kind: 'image', media: m.image.id, mimeType: m.image.mime_type, text: m.image.caption });
          else if (m.type === 'audio' && m.audio) out.push({ ...base, kind: 'voice', media: m.audio.id, mimeType: m.audio.mime_type });
          else out.push({ ...base, kind: 'unsupported' });
        }
    return out;
  },

  async fetchMedia(message) {
    if (!message.media) throw new Error('no_media');
    const auth = { Authorization: `Bearer ${env().WHATSAPP_ACCESS_TOKEN}` };
    const meta = await fetch(graph(message.media), { headers: auth });
    if (!meta.ok) throw new Error(`media_meta_${meta.status}`);
    const { url, mime_type } = (await meta.json()) as { url: string; mime_type?: string };
    const file = await fetch(url, { headers: auth });
    if (!file.ok) throw new Error(`media_${file.status}`);
    return { data: new Uint8Array(await file.arrayBuffer()), mimeType: mime_type ?? message.mimeType ?? 'application/octet-stream' };
  },

  async send(externalId, text) {
    const res = await fetch(graph(`${env().WHATSAPP_PHONE_NUMBER_ID}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env().WHATSAPP_ACCESS_TOKEN}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: externalId, type: 'text', text: { body: text } }),
    });
    if (!res.ok) throw new Error(`whatsapp_send_${res.status}`);
  },
};
