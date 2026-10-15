import { env } from '../env';
import { hmacHex, safeEqual } from './crypto';
import type { ChannelAdapter, InboundMessage } from './types';

type ViberEvent = {
  event: string;
  sender?: { id: string };
  user?: { id: string };
  message?: { type: string; text?: string; media?: string; file_name?: string };
};

/** Viber REST Bot API. Webhook: POST /api/channels/viber. Disabled unless FEATURE_VIBER=on. */
export const viberAdapter: ChannelAdapter = {
  channel: 'viber',
  enabled: () => env().FEATURE_VIBER === 'on' && !!env().VIBER_AUTH_TOKEN,

  verify(req, rawBody) {
    const token = env().VIBER_AUTH_TOKEN;
    const signature = req.headers.get('x-viber-content-signature');
    return !!token && !!signature && safeEqual(hmacHex(token, rawBody), signature.toLowerCase());
  },

  parse(rawBody) {
    const e = JSON.parse(rawBody) as ViberEvent;
    if (e.event === 'conversation_started' && e.user) return [{ channel: 'viber', externalId: e.user.id, kind: 'unsupported' }];
    if (e.event !== 'message' || !e.sender || !e.message) return [];
    const base = { channel: 'viber' as const, externalId: e.sender.id };
    switch (e.message.type) {
      case 'text':
        return [{ ...base, kind: 'text', text: e.message.text ?? '' }];
      case 'picture':
        return [{ ...base, kind: 'image', media: e.message.media, text: e.message.text }];
      case 'file':
      case 'video':
        // Viber delivers voice notes as files with an audio name.
        return /\.(m4a|aac|mp3|ogg|opus|wav)$/i.test(e.message.file_name ?? '')
          ? [{ ...base, kind: 'voice', media: e.message.media }]
          : [{ ...base, kind: 'unsupported' }];
      default:
        return [{ ...base, kind: 'unsupported' }];
    }
  },

  async fetchMedia(message: InboundMessage) {
    if (!message.media) throw new Error('no_media');
    const res = await fetch(message.media);
    if (!res.ok) throw new Error(`media_${res.status}`);
    return { data: new Uint8Array(await res.arrayBuffer()), mimeType: res.headers.get('content-type') ?? 'application/octet-stream' };
  },

  async send(externalId, text) {
    const res = await fetch('https://chatapi.viber.com/pa/send_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': env().VIBER_AUTH_TOKEN ?? '' },
      body: JSON.stringify({ receiver: externalId, min_api_version: 1, sender: { name: env().VIBER_BOT_NAME }, type: 'text', text }),
    });
    if (!res.ok) throw new Error(`viber_send_${res.status}`);
  },
};
