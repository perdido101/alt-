import 'server-only';
import { isLocale } from '@alt/i18n';
import { sendDigestEmail } from '../email/send';
import { supabaseAdmin } from '../supabase';

/** Monday-morning email to guardians: the scam of the week from Scam Radar plus the family's week in numbers. */
export async function runDigestJob(now = new Date()) {
  const db = supabaseAdmin();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const { data: items } = await db
    .from('scam_radar_items')
    .select('slug, title_el, title_en, summary_el, summary_en, featured_week, published_at')
    .eq('published', true)
    .order('featured_week', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(1);
  const item = (items as Array<Record<string, string>> | null)?.[0] ?? null;

  const { data: guardians } = await db.from('circle_members').select('circle_id, user_id, profiles(email, locale, notify_digest_email)').eq('role', 'guardian');
  let sent = 0;
  for (const g of (guardians ?? []) as unknown as Array<{ circle_id: string; profiles: { email: string | null; locale: string; notify_digest_email: boolean } | null }>) {
    if (!g.profiles?.email || !g.profiles.notify_digest_email) continue;
    const locale = isLocale(g.profiles.locale) ? g.profiles.locale : 'el';
    const count = async (table: string, column: string, extra?: (q: any) => any) => {
      let q = db.from(table).select('id', { count: 'exact', head: true }).eq('circle_id', g.circle_id).gte(column, weekAgo);
      if (extra) q = extra(q);
      return (await q).count ?? 0;
    };
    const stats = {
      checks: await count('checks', 'created_at'),
      alerts: await count('alerts', 'created_at'),
      calls: await count('call_events', 'started_at', (q) => q.in('classification', ['reported_scam', 'risky'])),
    };
    await sendDigestEmail({
      to: g.profiles.email,
      locale,
      item: item ? { slug: item.slug!, title: item[`title_${locale}`]!, summary: item[`summary_${locale}`]! } : null,
      stats,
    });
    sent++;
  }
  return { sent };
}
