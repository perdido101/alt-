import 'server-only';
import { stripe } from './billing/stripe';
import { env } from './env';
import { supabaseAdmin } from './supabase';

/**
 * GDPR erasure. Circles where the person is the only guardian are deleted entirely (with their parents'
 * anonymous device accounts and the Stripe subscription); in shared circles they simply leave.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const db = supabaseAdmin();
  const { data: memberships } = await db.from('circle_members').select('circle_id, role').eq('user_id', userId);
  for (const m of (memberships ?? []) as Array<{ circle_id: string; role: string }>) {
    if (m.role !== 'guardian') continue;
    const { data: others } = await db.from('circle_members').select('user_id, role').eq('circle_id', m.circle_id).neq('user_id', userId);
    const rest = (others ?? []) as Array<{ user_id: string; role: string }>;
    if (rest.some((o) => o.role === 'guardian')) continue;

    const { data: sub } = await db.from('subscriptions').select('provider, provider_subscription_id, status').eq('circle_id', m.circle_id).maybeSingle();
    const s = sub as { provider: string; provider_subscription_id: string | null; status: string } | null;
    if (s?.provider === 'stripe' && s.provider_subscription_id && s.status !== 'canceled' && env().STRIPE_SECRET_KEY) {
      await stripe().subscriptions.cancel(s.provider_subscription_id).catch(() => undefined);
    }
    await db.from('circles').delete().eq('id', m.circle_id);
    // Parents' phones only existed for this circle (anonymous accounts): remove them too.
    for (const o of rest.filter((x) => x.role === 'protected')) await db.auth.admin.deleteUser(o.user_id).catch(() => undefined);
  }
  await db.from('audit_log').insert({ actor_id: null, action: 'account.delete', entity: 'user', entity_id: null, meta: {} });
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw error;
}
