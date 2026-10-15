import { normalisePhone } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RadarCard } from '@/components/RadarCard';
import { scamOfTheWeek } from '@/server/content';
import { guardianCircle, openAlerts, parentsWithHealth } from '@/server/dashboard';
import { asLocale } from '@/i18n/locale';

export default async function Overview({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ circle?: string }> }) {
  const locale = asLocale((await params).locale);
  const { circle: circleParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await guardianCircle(circleParam);
  if (!data) return <p className="card card-calm">{t('dashboard.noCircle')}</p>;
  const [alerts, parents, weekly] = await Promise.all([openAlerts(data.circle.id), parentsWithHealth(data.members), scamOfTheWeek(locale)]);
  const name = (id: string) => data.members.find((m) => m.userId === id)?.displayName ?? '';

  return (
    <>
      <h1>{data.circle.name}</h1>
      {alerts.map((a) => {
        const parent = data.members.find((m) => m.userId === a.protected_user_id);
        return (
          <div key={a.id} className="alert-banner" role="alert">
            <h2>{t('guardianAlert.banner', { name: name(a.protected_user_id) })}</h2>
            <p>
              {t(`history.alert_${a.source}` as 'history.alert_button')} · {new Date(a.created_at).toLocaleString(localeTags[locale], { timeStyle: 'short', dateStyle: 'medium' })}
              {a.caller_number ? ` · ${normalisePhone(a.caller_number).display}` : ''}
            </p>
            {parent?.phone ? (
              <a className="btn btn-ember" href={`tel:${parent.phone}`}>
                {t('guardianAlert.callParent', { name: parent.displayName })}
              </a>
            ) : null}
          </div>
        );
      })}
      <div className="grid grid-2">
        {parents.map((p) => (
          <div key={p.userId} className="card stack" style={{ gap: 8 }}>
            <h2>{p.displayName}</h2>
            <span className={p.consentedAt ? 'pill-safe' : 'muted'}>{p.consentedAt ? t('guardian.home.protected') : t('guardian.home.notJoined')}</span>
            {p.platform ? (
              <span className={p.health.protecting || p.platform === 'ios' ? '' : 'pill-danger'}>
                {p.platform === 'ios' ? t('health.callsIos') : p.health.protecting ? t('health.callsOn') : t('health.callsOff')}
              </span>
            ) : null}
            {p.lastSeenAt ? <span className="muted">{t('health.lastActive', { when: new Date(p.lastSeenAt).toLocaleString(localeTags[locale], { dateStyle: 'medium', timeStyle: 'short' }) })}</span> : null}
            {p.health.problems.length || p.health.staleDays !== null ? (
              <div className="warn-box">
                <strong>{p.health.problems.length ? t('health.title', { name: p.displayName }) : t('health.stale', { name: p.displayName, days: p.health.staleDays ?? 0 })}</strong>
                {p.health.problems.length ? (
                  <>
                    <p>{t('health.fixIntro')}</p>
                    <ul>
                      {p.health.problems.map((x) => (
                        <li key={x}>{t(`health.fix_${x}`)}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {weekly ? (
        <div className="card card-calm">
          <div className="eyebrow">{t('web.radar.weekly')}</div>
          <RadarCard item={weekly} />
        </div>
      ) : null}
    </>
  );
}
