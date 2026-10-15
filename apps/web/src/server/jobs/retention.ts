import 'server-only';
import { env } from '../env';
import { supabaseAdmin } from '../supabase';

const DAY = 86_400_000;
/** Retention periods (docs/ROPA.md). Verdicts and call events are kept long enough for the family timeline and scam statistics. */
export const RETENTION_DAYS = { checks: 730, callEvents: 365, auditLog: 730, expiredInvites: 30, stripeEvents: 90 } as const;

/** Daily data minimisation: raw media past retention, old verdicts and call events, expired invites and link codes, old webhook logs. */
export async function runRetentionJob(now = new Date()) {
  const db = supabaseAdmin();
  const hours = env().RAW_MEDIA_RETENTION_HOURS;
  let mediaDeleted = 0;
  if (hours > 0) {
    const cutoff = now.getTime() - hours * 3_600_000;
    const { data: folders } = await db.storage.from('check-media').list('', { limit: 1000 });
    for (const folder of folders ?? []) {
      const { data: files } = await db.storage.from('check-media').list(folder.name, { limit: 1000 });
      const old = (files ?? []).filter((f) => f.created_at && new Date(f.created_at).getTime() < cutoff).map((f) => `${folder.name}/${f.name}`);
      if (old.length) {
        await db.storage.from('check-media').remove(old);
        mediaDeleted += old.length;
      }
    }
  }
  await db.from('channel_link_codes').delete().lt('expires_at', now.toISOString());
  const before = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
  await db.from('stripe_events').delete().lt('received_at', before(RETENTION_DAYS.stripeEvents));
  await db.from('checks').delete().lt('created_at', before(RETENTION_DAYS.checks));
  await db.from('call_events').delete().lt('created_at', before(RETENTION_DAYS.callEvents));
  await db.from('audit_log').delete().lt('created_at', before(RETENTION_DAYS.auditLog));
  await db.from('invites').delete().is('accepted_at', null).lt('expires_at', before(RETENTION_DAYS.expiredInvites));
  return { mediaDeleted };
}
