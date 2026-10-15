import { classifyCall, normalisePhone, type OfficialCategory, type OfficialEntry, type ReputationEntry } from '@alt/core';
import { callEventIdFor } from './callShield';
import { useAppStore } from './store';
import { supabase } from './supabase';

export type CallInfo = { callEventId: string; numberKey: string | null };

export type DirectoryRow = {
  id: string;
  organisation_el: string;
  organisation_en: string;
  category: OfficialCategory;
  number_key: string;
  display_number: string;
  article_el: string;
};

/** A call the phone screened (from the check-in notification). */
export async function screenedCall(localId: string): Promise<CallInfo | null> {
  const id = await callEventIdFor(localId);
  if (!id) return null;
  const { data } = await supabase.from('call_events').select('id, number_key').eq('id', id).single();
  return data ? { callEventId: (data as { id: string }).id, numberKey: (data as { number_key: string | null }).number_key } : null;
}

/** "Μόλις μου τηλεφώνησαν" pressed by hand (iOS, or any call the phone didn't screen). */
export async function manualCall(rawNumber: string): Promise<CallInfo> {
  const { circleId } = useAppStore.getState();
  const { data: user } = await supabase.auth.getUser();
  const n = normalisePhone(rawNumber.trim() || null);
  const [{ data: fam }, { data: off }, { data: rep }] = await Promise.all([
    supabase.from('family_contacts').select('phone').eq('circle_id', circleId!),
    n.key ? supabase.from('official_numbers').select('id, organisation_el, organisation_en, category, display_number').eq('number_key', n.key).eq('active', true) : Promise.resolve({ data: [] }),
    n.key ? supabase.from('number_reputation').select('approved_reports, flagged').eq('number_key', n.key) : Promise.resolve({ data: [] }),
  ]);
  const official = new Map<string, OfficialEntry>();
  const o = (off as Array<Record<string, string>> | null)?.[0];
  if (o && n.key) official.set(n.key, { id: o.id!, organisation: { el: o.organisation_el!, en: o.organisation_en! }, category: o.category as OfficialCategory, displayNumber: o.display_number!, verified: true });
  const reputation = new Map<string, ReputationEntry>();
  const r = (rep as Array<{ approved_reports: number; flagged: boolean }> | null)?.[0];
  if (r && n.key) reputation.set(n.key, { approvedReports: r.approved_reports, flagged: r.flagged });
  const verdict = classifyCall(n, { family: new Set(((fam ?? []) as Array<{ phone: string }>).map((f) => f.phone)), official, reputation });

  const { data, error } = await supabase
    .from('call_events')
    .insert({
      circle_id: circleId,
      user_id: user.user!.id,
      number_key: n.key && /^(\+[1-9]\d{6,14}|1\d{2,4})$/.test(n.key) ? n.key : null,
      number_kind: n.kind,
      classification: verdict.classification,
      official_number_id: verdict.official?.id ?? null,
    })
    .select('id, number_key')
    .single();
  if (error || !data) throw error ?? new Error('insert_failed');
  return { callEventId: (data as { id: string }).id, numberKey: (data as { number_key: string | null }).number_key };
}

export async function recordAnswer(callEventId: string, patch: { checkin_answer?: 'yes' | 'no' | 'unsure'; claimed_category?: OfficialCategory | null; claimed_relative?: boolean; official_match?: boolean | null }) {
  await supabase.from('call_events').update(patch).eq('id', callEventId);
}

export async function directory(categories: OfficialCategory[]): Promise<DirectoryRow[]> {
  const { data } = await supabase
    .from('official_numbers')
    .select('id, organisation_el, organisation_en, category, number_key, display_number, article_el')
    .in('category', categories)
    .eq('active', true);
  return (data ?? []) as DirectoryRow[];
}

/** The parent picks "Εφορία / ΕΦΚΑ": that's both tax and social security; "Αστυνομία" includes emergency numbers. */
export const CATEGORY_GROUPS: Record<string, OfficialCategory[]> = {
  police: ['police', 'emergency'],
  health: ['health'],
  bank: ['bank'],
  tax_social: ['tax_social'],
  post_courier: ['post_courier'],
};
