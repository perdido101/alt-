import 'server-only';
import { formatVerdictText, type AnalysisInput } from '@alt/core';
import { isLocale, messages, type Locale } from '@alt/i18n';
import { runCheck, transcription } from '../analysis';
import { enforceLimit } from '../rateLimit';
import { supabaseAdmin } from '../supabase';
import type { ChannelAdapter, InboundMessage } from './types';

const CODE = /\bALT-\d{6}\b/i;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

async function linkedUser(msg: InboundMessage) {
  const { data } = await supabaseAdmin()
    .from('channel_links')
    .select('user_id, circle_id')
    .eq('channel', msg.channel)
    .eq('external_id', msg.externalId)
    .maybeSingle();
  return data as { user_id: string; circle_id: string } | null;
}

async function localeOf(userId: string | null): Promise<Locale> {
  if (!userId) return 'el';
  const { data } = await supabaseAdmin().from('profiles').select('locale').eq('id', userId).maybeSingle();
  const l = (data as { locale?: string } | null)?.locale;
  return isLocale(l) ? l : 'el';
}

async function tryLink(adapter: ChannelAdapter, msg: InboundMessage): Promise<boolean> {
  const code = msg.text?.match(CODE)?.[0]?.toUpperCase();
  if (!code) return false;
  const db = supabaseAdmin();
  const { data } = await db.from('channel_link_codes').select('user_id, circle_id, expires_at, used_at').eq('code', code).maybeSingle();
  const row = data as { user_id: string; circle_id: string; expires_at: string; used_at: string | null } | null;
  const locale = await localeOf(row?.user_id ?? null);
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    await adapter.send(msg.externalId, messages[locale].channels.codeInvalid);
    return true;
  }
  await db.from('channel_links').upsert(
    { user_id: row.user_id, circle_id: row.circle_id, channel: msg.channel, external_id: msg.externalId },
    { onConflict: 'channel,external_id' },
  );
  await db.from('channel_link_codes').update({ used_at: new Date().toISOString() }).eq('code', code);
  await adapter.send(msg.externalId, messages[locale].channels.linked);
  return true;
}

/** Handles one inbound chat message end to end. Content is analysed and dropped; only the verdict is stored. */
export async function handleInbound(adapter: ChannelAdapter, msg: InboundMessage): Promise<void> {
  if (await tryLink(adapter, msg)) return;
  const link = await linkedUser(msg);
  const locale = await localeOf(link?.user_id ?? null);
  const t = messages[locale].channels;
  if (!link) return adapter.send(msg.externalId, t.welcome);
  if (msg.kind === 'unsupported') return adapter.send(msg.externalId, t.unsupported);

  try {
    await enforceLimit('analyzeUser', link.user_id);
    await enforceLimit('analyzeCircle', link.circle_id);
    let input: AnalysisInput;
    let media: { data: Uint8Array; mimeType: string } | undefined;
    if (msg.kind === 'image') {
      media = await adapter.fetchMedia(msg);
      const mediaType = (IMAGE_TYPES as readonly string[]).includes(media.mimeType) ? (media.mimeType as (typeof IMAGE_TYPES)[number]) : 'image/jpeg';
      input = { kind: 'image', text: msg.text, image: { mediaType, base64: Buffer.from(media.data).toString('base64') } };
    } else if (msg.kind === 'voice') {
      media = await adapter.fetchMedia(msg);
      input = { kind: 'voice', text: await transcription().transcribe(media, locale) };
    } else {
      input = { kind: 'text', text: msg.text ?? '' };
    }
    const check = await runCheck({ input, locale, circleId: link.circle_id, userId: link.user_id, channel: msg.channel, media });
    await adapter.send(msg.externalId, formatVerdictText(check.result, locale));
  } catch (error) {
    console.error('channel_check_failed', msg.channel, error instanceof Error ? error.message : 'unknown');
    await adapter.send(msg.externalId, t.error);
  }
}
