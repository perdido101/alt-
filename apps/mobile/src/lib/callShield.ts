import { CallDirectory, CallShield, type QueuedEvent, type ScreenedEvent, type ScreeningCacheFile } from '../../modules/call-shield';
import { DEFAULT_REPORT_THRESHOLD } from '@alt/core';
import { palette } from '@alt/tokens';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { i18n } from './i18n';
import { deviceInfo } from './push';
import { useAppStore } from './store';
import { supabase } from './supabase';

/** Labels for the native warning UI, taken from the shared catalogs in the user's language. */
function nativeStrings(): Record<string, string> {
  const keys = [
    'unknownTitle', 'familyLabel', 'officialReminder', 'reportedTitle', 'riskyTitle', 'riskyHidden',
    'riskyInternational', 'riskyFlagged', 'body', 'checkinBody', 'hiddenWho', 'warnChannel', 'checkinChannel',
  ];
  const out: Record<string, string> = Object.fromEntries(keys.map((k) => [k, i18n.t(`callShield.${k}`)]));
  // Native code fills these placeholders itself.
  out.officialTitle = i18n.t('callShield.officialTitle', { org: '{org}' });
  out.checkinTitle = i18n.t('callShield.checkinTitle', { who: '{who}' });
  return out;
}

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, page = 1000, max = 50_000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += page) {
    const { data } = await build(from, from + page - 1);
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

/** Downloads family numbers, the official directory and reputation into the on-device screening cache. */
export async function syncScreeningCache(): Promise<void> {
  const { circleId, locale } = useAppStore.getState();
  const target = CallShield ?? CallDirectory;
  if (!target || !circleId) return;
  if (i18n.language !== locale) await i18n.changeLanguage(locale);

  const [{ data: circle }, { data: family }, official, reputation] = await Promise.all([
    supabase.from('circles').select('protection_level').eq('id', circleId).single(),
    supabase.from('family_contacts').select('phone').eq('circle_id', circleId),
    fetchAll<{ id: string; number_key: string; organisation_el: string; organisation_en: string; category: string; display_number: string }>((a, b) =>
      supabase.from('official_numbers').select('id, number_key, organisation_el, organisation_en, category, display_number').eq('active', true).range(a, b),
    ),
    fetchAll<{ number_key: string; approved_reports: number; flagged: boolean }>((a, b) =>
      supabase.from('number_reputation').select('number_key, approved_reports, flagged').or('approved_reports.gt.0,flagged.eq.true').range(a, b),
    ),
  ]);

  const cache: ScreeningCacheFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    protectionLevel: ((circle as { protection_level?: ScreeningCacheFile['protectionLevel'] } | null)?.protection_level) ?? 'warn',
    reportThreshold: DEFAULT_REPORT_THRESHOLD,
    family: ((family ?? []) as Array<{ phone: string }>).map((f) => f.phone),
    official: official.map((o) => ({
      id: o.id,
      key: o.number_key,
      organisation: locale === 'el' ? o.organisation_el : o.organisation_en,
      category: o.category,
      displayNumber: o.display_number,
    })),
    reputation: reputation.map((r) => ({ key: r.number_key, approvedReports: r.approved_reports, flagged: r.flagged })),
    strings: nativeStrings(),
    colors: { surface: palette.callSurface, onSurface: palette.white, accent: palette.ember },
  };
  target.writeCache(JSON.stringify(cache));
}

/** Uploads calls the phone screened while offline (or while the app was closed) to call_events. */
export async function uploadCallEvents(): Promise<void> {
  const { circleId } = useAppStore.getState();
  if (!CallShield || !circleId) return;
  const events = JSON.parse(CallShield.drainEvents()) as QueuedEvent[];
  if (events.length === 0) return;
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;
  const screened = events.filter((e): e is ScreenedEvent => e.type === 'screened');
  const ended = new Map(events.filter((e) => e.type === 'ended').map((e) => [e.localId, e]));
  const rows = screened.map((e) => {
    const end = ended.get(e.localId);
    return {
      circle_id: circleId,
      user_id: user.user!.id,
      client_ref: e.localId,
      // Calls from family numbers are recorded without the number: the server never needs it.
      number_key: e.classification === 'family' ? null : e.numberKey,
      number_kind: e.numberKind,
      classification: e.classification,
      protection_action: e.action,
      official_number_id: e.officialId,
      started_at: new Date(e.startedAt).toISOString(),
      ended_at: end ? new Date(end.endedAt).toISOString() : null,
    };
  });
  if (rows.length) await supabase.from('call_events').upsert(rows, { onConflict: 'user_id,client_ref', ignoreDuplicates: true });
  // End events for calls uploaded in an earlier batch.
  for (const [localId, end] of ended) {
    if (screened.some((s) => s.localId === localId)) continue;
    await supabase.from('call_events').update({ ended_at: new Date(end.endedAt).toISOString() }).eq('user_id', user.user.id).eq('client_ref', localId);
  }
}

/** Sends this phone's protection status to the server, for the guardian's setup-health warnings. */
export async function reportHealth(): Promise<void> {
  const info = deviceInfo();
  const health = CallShield
    ? CallShield.getHealth()
    : CallDirectory
      ? { supported: true, platform: 'ios', callDirectory: await CallDirectory.getDirectoryStatus().catch(() => 'unknown') }
      : { supported: false, platform: Platform.OS };
  await supabase.rpc('register_device', { p_platform: info.platform, p_app_version: info.appVersion, p_os_version: info.osVersion, p_health: health });
}

export async function syncCallShield(): Promise<void> {
  await Promise.allSettled([syncScreeningCache(), uploadCallEvents(), reportHealth()]);
}

/** Server id of a screened call, uploading pending events first. */
export async function callEventIdFor(localId: string): Promise<string | null> {
  await uploadCallEvents().catch(() => undefined);
  const { data } = await supabase.from('call_events').select('id').eq('client_ref', localId).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

const TASK = 'alt-callshield-sync';

TaskManager.defineTask(TASK, async () => {
  try {
    await useAppStore.persist.rehydrate();
    if (useAppStore.getState().mode !== 'parent') return BackgroundTask.BackgroundTaskResult.Success;
    await syncCallShield();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Parent mode: keep the screening cache, call events and health fresh (on open, on foreground, every ~6 h). */
export function useCallShieldSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void syncCallShield();
    void BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 6 * 60 }).catch(() => undefined);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncCallShield();
    });
    return () => sub.remove();
  }, [enabled]);
}
