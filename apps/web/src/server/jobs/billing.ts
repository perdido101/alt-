import 'server-only';
import { entitlements } from '@alt/core';
import { isLocale } from '@alt/i18n';
import { sendDowngradedEmail } from '../email/send';
import { supabaseAdmin } from '../supabase';

/**
 * Daily downgrade at a safe moment: subscriptions past their grace period, canceled and ended, or expired
 * gifts/licences move the circle to Free. Never while an alert is open (we retry the next day).
 * Free keeps every safety basic; only paid extras (silence/block, SMS escalation, unlimited AI checks) go.
 */
export async function runBillingJob(now = new Date()) {
  const db = supabaseAdmin();
  const nowIso = now.toISOString();
  const { data } = await db
    .from('subscriptions')
    .select('circle_id, status, provider, current_period_end, grace_until')
    .or(`and(status.eq.past_due,grace_until.lt.${nowIso}),and(status.eq.canceled,current_period_end.lt.${nowIso}),and(provider.in.(gift,org_licence),current_period_end.lt.${nowIso}),status.eq.incomplete`);
  let downgraded = 0;
  let deferred = 0;
  for (const s of (data ?? []) as Array<{ circle_id: string }>) {
    const { data: circle } = await db.from('circles').select('plan, protection_level').eq('id', s.circle_id).single();
    if (!circle || (circle as { plan: string }).plan === 'free') continue;
    const { count } = await db.from('alerts').select('id', { count: 'exact', head: true }).eq('circle_id', s.circle_id).eq('status', 'open');
    if ((count ?? 0) > 0) {
      deferred++;
      continue;
    }
    const level = (circle as { protection_level: 'warn' | 'silence' | 'block' }).protection_level;
    await db
      .from('circles')
      .update({ plan: 'free', protection_level: entitlements.free.protectionLevels.includes(level) ? level : 'warn' })
      .eq('id', s.circle_id);
    await db.from('subscriptions').update({ status: 'canceled', grace_until: null, updated_at: nowIso }).eq('circle_id', s.circle_id);
    const { data: gs } = await db.from('circle_members').select('profiles(email, locale)').eq('circle_id', s.circle_id).eq('role', 'guardian');
    for (const g of (gs ?? []) as unknown as Array<{ profiles: { email: string | null; locale: string } | null }>) {
      if (g.profiles?.email) await sendDowngradedEmail({ to: g.profiles.email, locale: isLocale(g.profiles.locale) ? g.profiles.locale : 'el' });
    }
    downgraded++;
  }
  return { downgraded, deferred };
}
