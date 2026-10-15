import { localeTags } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/i18n/locale';
import { orgRepo } from '@/server/org';

/** Anonymised weekly aggregates only; exportable as CSV for the council. */
export default async function OrgStats({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('org');
  const org = (await orgRepo().current())!;
  const stats = await orgRepo().stats(org.id);
  return (
    <>
      <h1>{t('stats')}</h1>
      <p className="lead">{t('statsIntro')}</p>
      <a className="btn btn-outline" href={`/api/org/stats?locale=${locale}`} download>
        {t('downloadCsv')}
      </a>
      {stats.length === 0 ? (
        <p className="card card-calm">{t('noStats')}</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('week')}</th>
                <th>{t('protectedPeople')}</th>
                <th>{t('checks')}</th>
                <th>{t('checksScam')}</th>
                <th>{t('alerts')}</th>
                <th>{t('flaggedCalls')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.weekStart}>
                  <td>{new Date(s.weekStart).toLocaleDateString(localeTags[locale])}</td>
                  <td>{s.protectedPeople}</td>
                  <td>{s.checks}</td>
                  <td>{s.checksScam}</td>
                  <td>{s.alerts}</td>
                  <td>{s.flaggedCalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
