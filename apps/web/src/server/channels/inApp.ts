import type { ChannelAdapter, InboundMessage } from './types';

/**
 * The app itself. Requests are authenticated with the Supabase session in /api/analyze, and the
 * verdict is returned in the HTTP response, so there's nothing to verify or send here.
 */
export const inAppAdapter: ChannelAdapter = {
  channel: 'in_app',
  enabled: () => true,
  verify: () => true,
  parse(rawBody) {
    const body = JSON.parse(rawBody) as { kind?: InboundMessage['kind']; text?: string };
    return [{ channel: 'in_app', externalId: 'app', kind: body.kind ?? 'text', text: body.text }];
  },
  async fetchMedia() {
    throw new Error('not_supported');
  },
  async send() {},
};
