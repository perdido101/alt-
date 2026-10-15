import { normalisePhone } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { supabaseServer } from '@/server/auth';
import { guardianCircle } from '@/server/dashboard';
import { asLocale } from '@/i18n/locale';

/** Timeline per circle: checks with verdicts, flagged calls, alerts, quizzes. */
export default async function History({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ circle?: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await guardianCircle((await searchParams).circle);
  if (!data) return <p className="card card-calm">{t('dashboard.noCircle')}</p>;
  const db = await supabaseServer();
  const id = data.circle.id;
  const [checks, alerts, calls, quizzes] = await Promise.all([
    db.from('checks').select('id, created_at, user_id, verdict, category, reason').eq('circle_id', id).order('created_at', { ascending: false }).limit(100),
    db.from('alerts').select('id, created_at, protected_user_id, source, status, caller_number').eq('circle_id', id).order('created_at', { ascending: false }).limit(100),
    db.from('call_events').select('id, started_at, user_id, classification, number_key, checkin_answer, official_match').eq('circle_id', id).neq('classification', 'family').order('started_at', { ascending: false }).limit(100),
    db.from('safe_word_quizzes').select('id, scheduled_for, user_id, result').eq('circle_id', id).not('result', 'is', null).order('scheduled_for', { ascending: false }).limit(50),
  ]);
  type Row = { id: string; at: string; who: string; title: string; detail: string; tone: string };
  const who = (u: string) => data.members.find((m) => m.userId === u)?.displayName ?? '';
  const rows: Row[] = [
    ...((checks.data ?? []) as Array<Record<string, string>>).map((c) => ({
      id: `c${c.id}`,
      at: c.created_at!,
      who: who(c.user_id!),
      title: `${t('history.check')}: ${t(c.verdict === 'scam' ? 'verdict.scamTitle' : c.verdict === 'caution' ? 'verdict.cautionTitle' : 'verdict.safeTitle')}`,
      detail: `${c.verdict === 'safe' ? '' : `${t(`categories.${c.category}` as 'categories.other')} · `}${c.reason}`,
      tone: c.verdict === 'scam' ? 'pill-danger' : c.verdict === 'caution' ? 'pill-caution' : 'pill-safe',
    })),
    ...((alerts.data ?? []) as Array<Record<string, string | null>>).map((a) => ({
      id: `a${a.id}`,
      at: a.created_at!,
      who: who(a.protected_user_id!),
      title: t(`history.alert_${a.source}` as 'history.alert_button'),
      detail: `${t(a.status === 'open' ? 'history.alertOpen' : 'history.alertResolved')}${a.caller_number ? ` · ${normalisePhone(a.caller_number).display}` : ''}`,
      tone: a.status === 'open' ? 'pill-danger' : '',
    })),
    ...((calls.data ?? []) as Array<Record<string, string | boolean | null>>).map((c) => ({
      id: `k${c.id}`,
      at: c.started_at as string,
      who: who(c.user_id as string),
      title: t(`history.call_${c.classification}` as 'history.call_unknown'),
      detail: [c.number_key ? normalisePhone(c.number_key as string).display : t('history.hiddenNumber'), c.checkin_answer ? t(`history.answer_${c.checkin_answer}` as 'history.answer_no') : '', c.official_match === false ? t('history.officialMismatch') : '']
        .filter(Boolean)
        .join(' · '),
      tone: c.classification === 'reported_scam' ? 'pill-danger' : c.classification === 'risky' ? 'pill-caution' : '',
    })),
    ...((quizzes.data ?? []) as Array<Record<string, string>>).map((q) => ({
      id: `q${q.id}`,
      at: q.scheduled_for!,
      who: who(q.user_id!),
      title: t(`history.quiz_${q.result}` as 'history.quiz_correct'),
      detail: '',
      tone: q.result === 'correct' ? 'pill-safe' : 'pill-caution',
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <h1>{t('dashboard.history')}</h1>
      {rows.length === 0 ? (
        <p className="card card-calm">{t('guardian.history.empty')}</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.at).toLocaleString(localeTags[locale], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{r.who}</td>
                  <td>
                    <span className={r.tone}>{r.title}</span>
                    {r.detail ? <div className="muted">{r.detail}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
