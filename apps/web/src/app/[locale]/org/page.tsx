import { localeTags } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GenerateCodesForm } from '@/components/GenerateCodesForm';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { orgRepo } from '@/server/org';
import { generateCodes, revokeCode } from './actions';

export default async function OrgCodes({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('org');
  const org = (await orgRepo().current())!;
  const codes = await orgRepo().codes(org.id);
  const used = codes.filter((c) => c.status !== 'revoked').length;
  return (
    <>
      <h1>{locale === 'el' ? org.nameEl : org.nameEn}</h1>
      <div className="row">
        <span className="card" data-testid="seats">{t('seats', { used, total: org.seatsTotal })}</span>
        <span className="card">{t('redeemed', { count: codes.filter((c) => c.status === 'redeemed').length })}</span>
      </div>
      <GenerateCodesForm
        action={generateCodes}
        labels={{ title: t('generateTitle'), count: t('count'), generate: t('generate'), notEnough: t('notEnoughSeats'), error: (await getTranslations('errors'))('generic') }}
      />
      <div className="row">
        <Link href="/org/print" className="btn btn-outline">
          {t('print')}
        </Link>
      </div>
      <div className="card table-wrap">
        <table data-testid="codes">
          <thead>
            <tr>
              <th>{t('code')}</th>
              <th>{t('status')}</th>
              <th>{t('expires')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code}>
                <td style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>{c.code}</td>
                <td className={c.status === 'redeemed' ? 'pill-safe' : c.status === 'revoked' ? 'muted' : ''}>{t(`status_${c.status}`)}</td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(localeTags[locale]) : '—'}</td>
                <td>
                  {c.status === 'available' ? (
                    <form action={revokeCode}>
                      <input type="hidden" name="code" value={c.code} />
                      <button className="btn btn-outline btn-small">{t('revoke')}</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
