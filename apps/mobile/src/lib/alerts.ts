import type { AlertSource } from '@alt/core';
import { apiFetch } from './server';
import { supabase } from './supabase';

export async function triggerAlert(params: { source: AlertSource; checkId?: string; callEventId?: string; callerNumber?: string }) {
  return apiFetch<{ alertId: string; deduplicated: boolean }>('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export type AlertDetail = {
  id: string;
  circleId: string;
  protectedUserId: string;
  source: AlertSource;
  status: 'open' | 'resolved';
  callerNumber: string | null;
  createdAt: string;
  deliveries: Array<{ recipientUserId: string | null; recipientPhone: string | null; channel: string; status: string; seenAt: string | null }>;
};

export async function alertDetail(id: string): Promise<AlertDetail> {
  const [{ data: a, error }, { data: d }] = await Promise.all([
    supabase.from('alerts').select('id, circle_id, protected_user_id, source, status, caller_number, created_at').eq('id', id).single(),
    supabase.from('alert_deliveries').select('recipient_user_id, recipient_phone, channel, status, seen_at').eq('alert_id', id),
  ]);
  if (error || !a) throw new Error('not_found');
  const r = a as Record<string, string | null>;
  return {
    id: r.id!,
    circleId: r.circle_id!,
    protectedUserId: r.protected_user_id!,
    source: r.source as AlertSource,
    status: r.status as 'open' | 'resolved',
    callerNumber: r.caller_number ?? null,
    createdAt: r.created_at!,
    deliveries: ((d ?? []) as Array<Record<string, string | null>>).map((x) => ({
      recipientUserId: x.recipient_user_id ?? null,
      recipientPhone: x.recipient_phone ?? null,
      channel: x.channel!,
      status: x.status!,
      seenAt: x.seen_at ?? null,
    })),
  };
}

export async function openAlerts(circleId: string) {
  const { data } = await supabase.from('alerts').select('id, protected_user_id, created_at').eq('circle_id', circleId).eq('status', 'open').order('created_at', { ascending: false });
  return (data ?? []) as Array<{ id: string; protected_user_id: string; created_at: string }>;
}
