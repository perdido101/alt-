import type { CheckChannel } from '@alt/core';

export type InboundMessage = {
  channel: CheckChannel;
  /** Sender id on the channel (Viber user id, WhatsApp phone number). */
  externalId: string;
  kind: 'text' | 'image' | 'voice' | 'unsupported';
  text?: string;
  /** Channel-specific media reference (Viber: URL, WhatsApp: media id). */
  media?: string;
  mimeType?: string;
};

/**
 * One adapter per chat channel. The scam-check core is channel-agnostic: adapters only verify
 * webhooks, map payloads to InboundMessage, fetch media and send replies.
 */
export interface ChannelAdapter {
  readonly channel: CheckChannel;
  enabled(): boolean;
  verify(req: Request, rawBody: string): boolean;
  parse(rawBody: string): InboundMessage[];
  fetchMedia(message: InboundMessage): Promise<{ data: Uint8Array; mimeType: string }>;
  send(externalId: string, text: string): Promise<void>;
}
