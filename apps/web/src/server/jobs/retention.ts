import 'server-only';
import { env } from '../env';
import { supabaseAdmin } from '../supabase';

/** Daily data minimisation: raw media past retention, expired link codes, old webhook logs. */
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
  await db.from('stripe_events').delete().lt('received_at', new Date(now.getTime() - 90 * 86_400_000).toISOString());
  return { mediaDeleted };
}
