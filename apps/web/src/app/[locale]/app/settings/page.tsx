import { entitlements } from '@alt/core';
import type { Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { supabaseServer } from '@/server/auth';
import { guardianCircle } from '@/server/dashboard';
import { updateCircleSettings, updateNotificationPrefs } from '../actions';
import { asLocale } from '@/i18n/locale';

export default async function Settings({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ circle?: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await guardianCircle((await searchParams).circle);
  if (!data) return <p className="card card-calm">{t('dashboard.noCircle')}</p>;
  const db = await supabaseServer();
  const { data: user } = await db.auth.getUser();
  const { data: profile } = await db.from('profiles').select('notify_digest_email, notify_quiz_nudges').eq('id', user.user!.id).single();
  const prefs = profile as { notify_digest_email: boolean; notify_quiz_nudges: boolean };
  const allowed = entitlements[data.circle.plan].protectionLevels;

  return (
    <>
      <h1>{t('dashboard.settings')}</h1>
      <form action={updateCircleSettings} className="card stack">
        <input type="hidden" name="circleId" value={data.circle.id} />
        <fieldset style={{ border: 0, padding: 0 }}>
          <legend>
            <h2>{t('protection.title')}</h2>
          </legend>
          {(['warn', 'silence', 'block'] as const).map((level) => (
            <label key={level} className="radio-card" style={{ marginBottom: 8, opacity: allowed.includes(level) ? 1 : 0.5 }}>
              <input type="radio" name="protectionLevel" value={level} defaultChecked={data.circle.protectionLevel === level} disabled={!allowed.includes(level)} />
              <strong>{t(`protection.${level}`)}</strong>
              <div className="muted">{t(`protection.${level}Sub`)}</div>
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="quiz">{t('dashboard.quizFrequency')}</label>
          <select id="quiz" name="quizIntervalDays" defaultValue={String(data.circle.quizIntervalDays)}>
            {[7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {t('dashboard.every', { days: d })}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          {t('common.save')}
        </button>
      </form>

      <form action={updateNotificationPrefs} className="card stack">
        <h2>{t('dashboard.notifications')}</h2>
        <label>
          <input type="checkbox" name="digest" defaultChecked={prefs.notify_digest_email} style={{ width: 'auto', minHeight: 0, marginRight: 8 }} />
          {t('dashboard.digestEmail')}
        </label>
        <label>
          <input type="checkbox" name="nudges" defaultChecked={prefs.notify_quiz_nudges} style={{ width: 'auto', minHeight: 0, marginRight: 8 }} />
          {t('dashboard.quizNudges')}
        </label>
        <button className="btn btn-primary" type="submit">
          {t('common.save')}
        </button>
      </form>

      <div className="card stack">
        <h2>{t('circle.members')}</h2>
        <ul>
          {data.members.map((m) => (
            <li key={m.userId}>
              {m.displayName} · {m.role === 'guardian' ? t('circle.guardian') : t('circle.protected')}
            </li>
          ))}
        </ul>
        <p className="muted">{t('guardian.settings.safeWordHashedNote')}</p>
      </div>
    </>
  );
}
