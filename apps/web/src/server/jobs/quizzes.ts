import 'server-only';
import { isLocale, translate, type Locale } from '@alt/i18n';
import { notifier } from '../notify/notifier';
import { supabaseAdmin } from '../supabase';

const ANSWER_WINDOW_HOURS = 48;

async function tokensFor(userIds: string[]) {
  if (!userIds.length) return new Map<string, string[]>();
  const { data } = await supabaseAdmin().from('devices').select('user_id, push_token').in('user_id', userIds).not('push_token', 'is', null);
  const map = new Map<string, string[]>();
  for (const d of (data ?? []) as Array<{ user_id: string; push_token: string }>) map.set(d.user_id, [...(map.get(d.user_id) ?? []), d.push_token]);
  return map;
}

async function localeOf(userId: string): Promise<Locale> {
  const { data } = await supabaseAdmin().from('profiles').select('locale').eq('id', userId).maybeSingle();
  const l = (data as { locale?: string } | null)?.locale;
  return isLocale(l) ? l : 'el';
}

/**
 * Daily: (1) unanswered quizzes older than 48 h become "skipped"; (2) a new quiz is sent to each parent whose
 * last quiz is older than the circle's interval (default 14 days); (3) after two misses in a row, one guardian
 * is nudged quietly ("Θύμισε … τη λέξη σας"). The parent is never told they failed.
 */
export async function runQuizJob(now = new Date()) {
  const db = supabaseAdmin();
  const stale = new Date(now.getTime() - ANSWER_WINDOW_HOURS * 3_600_000).toISOString();
  await db.from('safe_word_quizzes').update({ result: 'skipped' }).is('result', null).lt('scheduled_for', stale);

  const { data: parents } = await db
    .from('circle_members')
    .select('circle_id, user_id, display_name, consented_at, circles(quiz_interval_days)')
    .eq('role', 'protected')
    .not('consented_at', 'is', null);
  const { data: words } = await db.from('safe_words').select('circle_id, updated_at');
  const wordSet = new Map(((words ?? []) as Array<{ circle_id: string; updated_at: string }>).map((w) => [w.circle_id, w.updated_at]));

  let sent = 0;
  let nudged = 0;
  for (const p of (parents ?? []) as unknown as Array<{ circle_id: string; user_id: string; display_name: string; circles: { quiz_interval_days: number } | null }>) {
    const wordAt = wordSet.get(p.circle_id);
    if (!wordAt) continue;
    const interval = (p.circles?.quiz_interval_days ?? 14) * 86_400_000;
    const { data: recent } = await db
      .from('safe_word_quizzes')
      .select('id, scheduled_for, result, guardian_notified_at')
      .eq('user_id', p.user_id)
      .order('scheduled_for', { ascending: false })
      .limit(2);
    const quizzes = (recent ?? []) as Array<{ id: string; scheduled_for: string; result: string | null; guardian_notified_at: string | null }>;
    const last = quizzes[0];
    const lastAt = new Date(last?.scheduled_for ?? wordAt).getTime();

    if (now.getTime() - lastAt >= interval && (!last || last.result !== null)) {
      const { data: quiz } = await db.from('safe_word_quizzes').insert({ circle_id: p.circle_id, user_id: p.user_id, scheduled_for: now.toISOString() }).select('id').single();
      const locale = await localeOf(p.user_id);
      const tokens = (await tokensFor([p.user_id])).get(p.user_id) ?? [];
      await notifier().send(tokens, {
        title: translate(locale, 'quiz.pushTitle'),
        body: translate(locale, 'quiz.pushBody'),
        data: { type: 'quiz', quizId: (quiz as { id: string }).id },
      });
      sent++;
    }

    const missedTwice = quizzes.length === 2 && quizzes.every((q) => q.result === 'wrong' || q.result === 'skipped');
    if (missedTwice && last && !last.guardian_notified_at) {
      const { data: gs } = await db.from('circle_members').select('user_id, profiles(notify_quiz_nudges)').eq('circle_id', p.circle_id).eq('role', 'guardian');
      const guardians = ((gs ?? []) as unknown as Array<{ user_id: string; profiles: { notify_quiz_nudges: boolean } | null }>).filter((g) => g.profiles?.notify_quiz_nudges !== false);
      const tokens = await tokensFor(guardians.map((g) => g.user_id));
      // Quietly nudge the first guardian who can receive it.
      const target = guardians.find((g) => (tokens.get(g.user_id) ?? []).length > 0);
      if (target) {
        const locale = await localeOf(target.user_id);
        await notifier().send(tokens.get(target.user_id)!, {
          title: translate(locale, 'quiz.nudgeTitle', { name: p.display_name }),
          body: translate(locale, 'quiz.nudgeBody'),
          data: { type: 'quiz_nudge' },
        });
      }
      await db.from('safe_word_quizzes').update({ guardian_notified_at: now.toISOString() }).eq('id', last.id);
      nudged++;
    }
  }
  return { sent, nudged };
}
