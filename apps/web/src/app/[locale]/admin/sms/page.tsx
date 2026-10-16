import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { sendTestSms } from '../actions';
import { asLocale } from '@/i18n/locale';

export default async function AdminSms({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  await requireAdmin();
  const q = await searchParams;
  return (
    <>
      <h1>{t('smsTest')}</h1>
      <p className="muted">{t('smsTestIntro')}</p>
      {q.ok === '1' ? (
        <p className="form-ok" role="status">{t('smsSent', { from: q.from ?? '' })}</p>
      ) : q.ok === '0' ? (
        <p className="form-error" role="alert">
          {t('smsFailed')} <code>{q.error}</code> ({q.provider}, {q.from})
        </p>
      ) : null}
      <form action={sendTestSms} className="card stack">
        <input type="hidden" name="locale" value={locale} />
        <div className="field">
          <label htmlFor="sms-to">{t('smsTo')}</label>
          <input id="sms-to" name="to" type="tel" required placeholder="+30 69…" />
        </div>
        <button className="btn btn-primary">{t('smsSend')}</button>
      </form>
    </>
  );
}
