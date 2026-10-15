import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { markRequestHandled } from '../actions';
import { asLocale } from '@/i18n/locale';

export default async function AdminRequests({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const { db } = await requireAdmin();
  const { data } = await db.from('contact_requests').select('*').is('handled_at', null).order('created_at', { ascending: false });
  const rows = (data ?? []) as Array<Record<string, string | null>>;
  return (
    <>
      <h1>{t('requests')}</h1>
      {rows.map((r) => (
        <div key={r.id} className="card stack" style={{ gap: 6 }}>
          <strong>
            {r.organisation ?? r.name} · {r.org_type ?? r.kind}
          </strong>
          <span>
            {r.name} · <a href={`mailto:${r.email}`}>{r.email}</a> {r.phone ? `· ${r.phone}` : ''}
          </span>
          {r.message ? <p>{r.message}</p> : null}
          <span className="muted">
            {t('received')}: {new Date(r.created_at!).toLocaleString(localeTags[locale])}
          </span>
          <form action={markRequestHandled}>
            <input type="hidden" name="id" value={r.id!} />
            <button className="btn btn-outline btn-small">{t('markHandled')}</button>
          </form>
        </div>
      ))}
    </>
  );
}
