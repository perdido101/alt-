import { evaluateHealth, type DeviceHealth, type HealthReport } from '@alt/core';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from './store';
import { supabase } from './supabase';

export type ParentStatus = {
  userId: string;
  platform: string | null;
  lastSeenAt: string | null;
  health: HealthReport;
  lastQuiz: 'correct' | 'wrong' | 'skipped' | null;
};

/** Device health and last activity for each protected person in the circle (guardian view). */
export async function parentStatuses(circleId: string, parentIds: string[]): Promise<ParentStatus[]> {
  if (parentIds.length === 0) return [];
  const [{ data: devices }, { data: quizzes }] = await Promise.all([
    supabase.from('devices').select('user_id, platform, health, last_seen_at').in('user_id', parentIds).order('last_seen_at', { ascending: false }),
    supabase.from('safe_word_quizzes').select('user_id, result, answered_at').eq('circle_id', circleId).not('result', 'is', null).order('scheduled_for', { ascending: false }),
  ]);
  return parentIds.map((id) => {
    const d = ((devices ?? []) as Array<{ user_id: string; platform: string; health: DeviceHealth; last_seen_at: string }>).find((x) => x.user_id === id);
    const q = ((quizzes ?? []) as Array<{ user_id: string; result: ParentStatus['lastQuiz'] }>).find((x) => x.user_id === id);
    return {
      userId: id,
      platform: d?.platform ?? null,
      lastSeenAt: d?.last_seen_at ?? null,
      health: evaluateHealth(d?.platform ?? 'unknown', d?.health ?? {}, d?.last_seen_at ?? null),
      lastQuiz: q?.result ?? null,
    };
  });
}

export function useParentStatuses(parentIds: string[]) {
  const circleId = useAppStore((s) => s.circleId);
  return useQuery({
    queryKey: ['parentStatus', circleId, parentIds.join(',')],
    queryFn: () => parentStatuses(circleId!, parentIds),
    enabled: !!circleId && parentIds.length > 0,
    refetchInterval: 60_000,
  });
}
