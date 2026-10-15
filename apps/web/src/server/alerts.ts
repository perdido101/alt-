import 'server-only';
import { entitlements, normalisePhone, type AlertSource, type Plan } from '@alt/core';
import { isLocale, localeTags, translate, type Locale } from '@alt/i18n';
import { env } from './env';
import { scheduleJob } from './jobs/schedule';
import { notifier } from './notify/notifier';
import { smsProvider } from './notify/sms';
import { HttpError, supabaseAdmin } from './supabase';
import { trackServer } from './analytics';

const DEDUPE_MINUTES = 10;

type Guardian = { userId: string; locale: Locale; tokens: string[] };

function clock(at: Date, locale: Locale) {
  return at.toLocaleTimeString(localeTags[locale], { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' });
}

async function guardiansOf(circleId: string): Promise<Guardian[]> {
  const db = supabaseAdmin();
  const { data: members } = await db.from('circle_members').select('user_id').eq('circle_id', circleId).eq('role', 'guardian');
  const ids = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const [{ data: profiles }, { data: devices }] = await Promise.all([
    db.from('profiles').select('id, locale').in('id', ids),
    db.from('devices').select('user_id, push_token').in('user_id', ids).not('push_token', 'is', null),
  ]);
  return ids.map((id) => {
    const l = ((profiles ?? []) as Array<{ id: string; locale: string }>).find((p) => p.id === id)?.locale;
    return {
      userId: id,
      locale: isLocale(l) ? l : 'el',
      tokens: ((devices ?? []) as Array<{ user_id: string; push_token: string }>).filter((d) => d.user_id === id).map((d) => d.push_token),
    };
  });
}

export type AlertRequest = {
  userId: string;
  source: AlertSource;
  checkId?: string | null;
  callEventId?: string | null;
  callerNumber?: string | null;
};

/** Creates the alert, pushes every guardian at once and schedules the 5-minute SMS escalation. */
export async function createAlert(req: AlertRequest): Promise<{ alertId: string; deduplicated: boolean }> {
  const db = supabaseAdmin();
  const { data: memberRow } = await db
    .from('circle_members')
    .select('circle_id, display_name')
    .eq('user_id', req.userId)
    .eq('role', 'protected')
    .maybeSingle();
  const member = memberRow as { circle_id: string; display_name: string } | null;
  if (!member) throw new HttpError(403, 'not_protected');

  // Pressing the button twice, or a verdict and a call in quick succession, is one incident.
  const since = new Date(Date.now() - DEDUPE_MINUTES * 60_000).toISOString();
  const { data: open } = await db
    .from('alerts')
    .select('id')
    .eq('protected_user_id', req.userId)
    .eq('status', 'open')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);
  const existing = (open as Array<{ id: string }> | null)?.[0];
  if (existing) return { alertId: existing.id, deduplicated: true };

  for (const [table, id] of [['checks', req.checkId], ['call_events', req.callEventId]] as const) {
    if (!id) continue;
    const { data } = await db.from(table).select('circle_id').eq('id', id).maybeSingle();
    if ((data as { circle_id: string } | null)?.circle_id !== member.circle_id) throw new HttpError(400, 'invalid_reference');
  }

  const minutes = env().ALERT_ESCALATION_MINUTES;
  const now = new Date();
  const callerNumber = req.callerNumber ? normalisePhone(req.callerNumber).key : null;
  const { data: alertRow, error } = await db
    .from('alerts')
    .insert({
      circle_id: member.circle_id,
      protected_user_id: req.userId,
      source: req.source,
      check_id: req.checkId ?? null,
      call_event_id: req.callEventId ?? null,
      caller_number: callerNumber,
      escalate_at: new Date(now.getTime() + minutes * 60_000).toISOString(),
    })
    .select('id')
    .single();
  if (error || !alertRow) throw new HttpError(500, 'alert_insert_failed');
  const alertId = (alertRow as { id: string }).id;

  const guardians = await guardiansOf(member.circle_id);
  const deliveries = await Promise.all(
    guardians.map(async (g) => {
      const title = translate(g.locale, 'notify.alertTitle', { name: member.display_name });
      const caller = callerNumber ? (normalisePhone(callerNumber).display ?? callerNumber) : translate(g.locale, 'notify.unknownCaller');
      const body = translate(g.locale, `notify.alertBody_${req.source}`, { time: clock(now, g.locale), caller });
      const results = await notifier().send(g.tokens, { title, body, data: { type: 'alert', alertId } });
      const ok = results.find((r) => r.ok);
      return {
        alert_id: alertId,
        recipient_user_id: g.userId,
        channel: 'push',
        status: ok ? 'sent' : g.tokens.length ? 'failed' : 'queued',
        provider_ref: ok?.ref ?? null,
        error: ok ? null : (results[0]?.error ?? 'no_device'),
        sent_at: ok ? new Date().toISOString() : null,
      };
    }),
  );
  if (deliveries.length) await db.from('alert_deliveries').insert(deliveries);

  await scheduleJob('/api/alerts/escalate', { alertId }, minutes * 60, `escalate-${alertId}`);
  await db.from('audit_log').insert({ actor_id: req.userId, action: 'alert.create', entity: 'alert', entity_id: alertId, circle_id: member.circle_id, meta: { source: req.source } });
  trackServer('family_alert_sent', { userId: req.userId, props: { source: req.source } });
  return { alertId, deduplicated: false };
}

/** Idempotent: sends escalation SMS only once, and only if no guardian has opened the alert. */
export async function escalateAlert(alertId: string): Promise<{ escalated: boolean; sms: number }> {
  const db = supabaseAdmin();
  const { data: claimed } = await db.rpc('claim_alert_escalation', { p_alert: alertId });
  if (claimed !== true) return { escalated: false, sms: 0 };

  const { data: alertRow } = await db.from('alerts').select('circle_id, protected_user_id, source, created_at, circles(plan)').eq('id', alertId).single();
  const alert = alertRow as unknown as { circle_id: string; protected_user_id: string; source: AlertSource; created_at: string; circles: { plan: Plan } | null };
  // Free plans get push alerts only; SMS escalation is a paid extra.
  if (!entitlements[alert.circles?.plan ?? 'free'].smsEscalation) return { escalated: true, sms: 0 };
  const [{ data: memberRow }, { data: contacts }] = await Promise.all([
    db.from('circle_members').select('display_name, phone').eq('circle_id', alert.circle_id).eq('user_id', alert.protected_user_id).single(),
    db.from('family_contacts').select('phone, is_guardian, is_backup').eq('circle_id', alert.circle_id),
  ]);
  const member = memberRow as { display_name: string; phone: string | null };
  const recipients = [...new Set(((contacts ?? []) as Array<{ phone: string; is_guardian: boolean; is_backup: boolean }>).filter((c) => c.is_guardian || c.is_backup).map((c) => c.phone))];

  const locale: Locale = 'el';
  const text = translate(locale, 'notify.smsEscalation', {
    name: member.display_name,
    time: clock(new Date(alert.created_at), locale),
    source: translate(locale, `notify.smsSource_${alert.source}`),
    phone: member.phone ? `: ${member.phone}` : '',
  });
  const rows = await Promise.all(
    recipients.map(async (phone) => {
      const r = await smsProvider().send(phone, text);
      return {
        alert_id: alertId,
        recipient_phone: phone,
        channel: 'sms',
        status: r.ok ? 'sent' : 'failed',
        provider_ref: r.ref ?? null,
        error: r.error ?? null,
        sent_at: r.ok ? new Date().toISOString() : null,
      };
    }),
  );
  if (rows.length) await db.from('alert_deliveries').insert(rows);
  if (rows.length === 0 || rows.every((r) => r.status === 'failed')) console.error('alert_escalation_undelivered', alertId);
  trackServer('family_alert_escalated', { props: { channel: 'sms' } });
  return { escalated: true, sms: rows.filter((r) => r.status === 'sent').length };
}
