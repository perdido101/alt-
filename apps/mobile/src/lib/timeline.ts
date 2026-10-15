import type { AlertSource, CallClassification, CheckChannel, QuizResultValue, ScamCategory, Verdict } from './timelineTypes';
import { supabase } from './supabase';

export type TimelineItem =
  | { kind: 'check'; id: string; at: string; userId: string; verdict: Verdict; category: ScamCategory; reason: string; channel: CheckChannel }
  | { kind: 'alert'; id: string; at: string; userId: string; source: AlertSource; status: 'open' | 'resolved'; callerNumber: string | null }
  | { kind: 'call'; id: string; at: string; userId: string; classification: CallClassification; numberKey: string | null; answer: string | null; officialMatch: boolean | null }
  | { kind: 'quiz'; id: string; at: string; userId: string; result: QuizResultValue | null };

/** Everything that happened in the circle, newest first (RLS limits it to what the viewer may see). */
export async function circleTimeline(circleId: string, limit = 50): Promise<TimelineItem[]> {
  const [checks, alerts, calls, quizzes] = await Promise.all([
    supabase.from('checks').select('id, created_at, user_id, verdict, category, reason, channel').eq('circle_id', circleId).order('created_at', { ascending: false }).limit(limit),
    supabase.from('alerts').select('id, created_at, protected_user_id, source, status, caller_number').eq('circle_id', circleId).order('created_at', { ascending: false }).limit(limit),
    supabase.from('call_events').select('id, started_at, user_id, classification, number_key, checkin_answer, official_match').eq('circle_id', circleId).neq('classification', 'family').order('started_at', { ascending: false }).limit(limit),
    supabase.from('safe_word_quizzes').select('id, scheduled_for, answered_at, user_id, result').eq('circle_id', circleId).order('scheduled_for', { ascending: false }).limit(limit),
  ]);
  type R = Record<string, unknown>;
  const rows = (r: { data: unknown }) => (r.data ?? []) as R[];
  const items: TimelineItem[] = [
    ...rows(checks).map((r) => ({ kind: 'check' as const, id: r.id as string, at: r.created_at as string, userId: r.user_id as string, verdict: r.verdict as Verdict, category: r.category as ScamCategory, reason: r.reason as string, channel: r.channel as CheckChannel })),
    ...rows(alerts).map((r) => ({ kind: 'alert' as const, id: r.id as string, at: r.created_at as string, userId: r.protected_user_id as string, source: r.source as AlertSource, status: r.status as 'open' | 'resolved', callerNumber: (r.caller_number as string | null) ?? null })),
    ...rows(calls).map((r) => ({ kind: 'call' as const, id: r.id as string, at: r.started_at as string, userId: r.user_id as string, classification: r.classification as CallClassification, numberKey: (r.number_key as string | null) ?? null, answer: (r.checkin_answer as string | null) ?? null, officialMatch: (r.official_match as boolean | null) ?? null })),
    ...rows(quizzes).filter((r) => r.answered_at || r.result).map((r) => ({ kind: 'quiz' as const, id: r.id as string, at: ((r.answered_at ?? r.scheduled_for) as string), userId: r.user_id as string, result: (r.result as QuizResultValue | null) ?? null })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
