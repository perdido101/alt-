import 'server-only';
import { evaluateHealth, type DeviceHealth, type HealthReport, type Plan, type ProtectionLevel } from '@alt/core';
import { supabaseServer } from './auth';

export type DashCircle = {
  id: string;
  name: string;
  plan: Plan;
  protectionLevel: ProtectionLevel;
  quizIntervalDays: number;
  stripeCustomerId: string | null;
};
export type DashMember = { userId: string; role: 'guardian' | 'protected'; displayName: string; consentedAt: string | null; phone: string | null };
export type DashParent = DashMember & { health: HealthReport; lastSeenAt: string | null; platform: string | null };

/** The signed-in guardian's first circle (the web dashboard shows one family at a time; ?circle= switches). */
export async function guardianCircle(circleId?: string): Promise<{ circle: DashCircle; members: DashMember[]; circles: Array<{ id: string; name: string }> } | null> {
  const db = await supabaseServer();
  const { data: user } = await db.auth.getUser();
  if (!user.user) return null;
  const { data: mine } = await db.from('circle_members').select('circle_id, role, circles(id, name)').eq('user_id', user.user.id).eq('role', 'guardian');
  const list = ((mine ?? []) as unknown as Array<{ circle_id: string; circles: { id: string; name: string } }>).map((m) => m.circles);
  const id = circleId && list.some((c) => c.id === circleId) ? circleId : list[0]?.id;
  if (!id) return null;
  const [{ data: c }, { data: members }] = await Promise.all([
    db.from('circles').select('id, name, plan, protection_level, quiz_interval_days, stripe_customer_id').eq('id', id).single(),
    db.from('circle_members').select('user_id, role, display_name, consented_at, phone').eq('circle_id', id).order('joined_at'),
  ]);
  const row = c as { id: string; name: string; plan: Plan; protection_level: ProtectionLevel; quiz_interval_days: number; stripe_customer_id: string | null };
  return {
    circles: list,
    circle: { id: row.id, name: row.name, plan: row.plan, protectionLevel: row.protection_level, quizIntervalDays: row.quiz_interval_days, stripeCustomerId: row.stripe_customer_id },
    members: ((members ?? []) as Array<{ user_id: string; role: 'guardian' | 'protected'; display_name: string; consented_at: string | null; phone: string | null }>).map((m) => ({
      userId: m.user_id,
      role: m.role,
      displayName: m.display_name,
      consentedAt: m.consented_at,
      phone: m.phone,
    })),
  };
}

export async function parentsWithHealth(members: DashMember[]): Promise<DashParent[]> {
  const parents = members.filter((m) => m.role === 'protected');
  if (!parents.length) return [];
  const db = await supabaseServer();
  const { data } = await db.from('devices').select('user_id, platform, health, last_seen_at').in('user_id', parents.map((p) => p.userId)).order('last_seen_at', { ascending: false });
  return parents.map((p) => {
    const d = ((data ?? []) as Array<{ user_id: string; platform: string; health: DeviceHealth; last_seen_at: string }>).find((x) => x.user_id === p.userId);
    return { ...p, platform: d?.platform ?? null, lastSeenAt: d?.last_seen_at ?? null, health: evaluateHealth(d?.platform ?? 'unknown', d?.health ?? {}, d?.last_seen_at ?? null) };
  });
}

export type TimelineEntry = { kind: 'check' | 'alert' | 'call'; id: string; at: string; userId: string; title: string; detail: string; tone: 'safe' | 'caution' | 'danger' | 'neutral' };

export async function openAlerts(circleId: string) {
  const db = await supabaseServer();
  const { data } = await db.from('alerts').select('id, protected_user_id, source, caller_number, created_at').eq('circle_id', circleId).eq('status', 'open').order('created_at', { ascending: false });
  return (data ?? []) as Array<{ id: string; protected_user_id: string; source: string; caller_number: string | null; created_at: string }>;
}

export async function subscription(circleId: string) {
  const db = await supabaseServer();
  const { data } = await db.from('subscriptions').select('plan, status, provider, current_period_end, trial_end, grace_until, cancel_at_period_end').eq('circle_id', circleId).maybeSingle();
  return data as { plan: Plan; status: string; provider: string; current_period_end: string | null; trial_end: string | null; grace_until: string | null; cancel_at_period_end: boolean } | null;
}
