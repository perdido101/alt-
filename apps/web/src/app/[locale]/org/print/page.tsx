import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PrintButton } from '@/components/PrintButton';
import { asLocale } from '@/i18n/locale';
import { env } from '@/server/env';
import { orgRepo } from '@/server/org';

/** One A4 sheet per available code, always in Greek (for social workers and families). */
export default async function PrintSheets({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(asLocale((await params).locale));
  const t = await getTranslations({ locale: 'el', namespace: 'org' });
  const brand = await getTranslations({ locale: 'el', namespace: 'brand' });
  const org = (await orgRepo().current())!;
  const codes = (await orgRepo().codes(org.id)).filter((c) => c.status === 'available');
  const orgName = org.kind === 'municipality' ? t('municipality', { name: org.nameEl }) : org.nameEl;
  return (
    <>
      <div className="no-print row">
        <PrintButton label={t('print')} />
      </div>
      {codes.map((c) => (
        <section key={c.code} className="print-sheet card stack" lang="el" data-testid="sheet">
          <div className="wordmark" aria-label="ΑΛΤ!">
            ΑΛΤ<span className="bang">!</span>
          </div>
          <h1 style={{ fontSize: '1.8rem' }}>{t('sheetTitle')}</h1>
          <p>{t('sheetIntro', { org: orgName })}</p>
          <ol style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            <li>{t('sheetStep1')}</li>
            <li>{t('sheetStep2')}</li>
            <li>{t('sheetStep3')}</li>
            <li>{t('sheetStep4')}</li>
          </ol>
          <div className="card card-calm" style={{ textAlign: 'center' }}>
            <div>{t('sheetCode')}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, letterSpacing: 2 }}>{c.code}</div>
            <div className="muted">{t('sheetValid', { date: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('el-GR', { dateStyle: 'long' }) : '—' })}</div>
          </div>
          <p className="never-asks">{brand('neverAsksWeb')}</p>
          <p className="muted">{t('sheetHelp', { email: env().SUPPORT_EMAIL })}</p>
        </section>
      ))}
    </>
  );
}
