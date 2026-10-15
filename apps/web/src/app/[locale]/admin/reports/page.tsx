import { normalisePhone } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { moderateReport } from '../actions';
import { asLocale } from '@/i18n/locale';

/** Moderation queue. Approved reports feed number_reputation (via trigger) and then every device's cache. */
export default async function AdminReports({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const { db } = await requireAdmin();
  const [{ data: pending }, { data: reputation }] = await Promise.all([
    db.from('number_reports').select('id, number_key, claimed_category, note, created_at').eq('status', 'pending').order('created_at').limit(200),
    db.from('number_reputation').select('number_key, approved_reports, flagged'),
  ]);
  const rep = new Map(((reputation ?? []) as Array<{ number_key: string; approved_reports: number; flagged: boolean }>).map((r) => [r.number_key, r]));
  const rows = (pending ?? []) as Array<{ id: string; number_key: string; claimed_category: string | null; note: string | null; created_at: string }>;
  return (
    <>
      <h1>{t('reports')}</h1>
      {rows.length === 0 ? (
        <p className="card card-calm">{t('pendingNone')}</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('number')}</th>
                <th>{t('category')}</th>
                <th>{t('notes')}</th>
                <th>{t('reportCount')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {normalisePhone(r.number_key).display}
                    <div className="muted">{new Date(r.created_at).toLocaleString(localeTags[locale])}</div>
                  </td>
                  <td>{r.claimed_category ?? '—'}</td>
                  <td>{r.note ?? ''}</td>
                  <td>
                    {rep.get(r.number_key)?.approved_reports ?? 0}
                    {rep.get(r.number_key)?.flagged ? ' ⚑' : ''}
                  </td>
                  <td>
                    <div className="row">
                      {(['approved', 'rejected'] as const).map((status) => (
                        <form key={status} action={moderateReport}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value={status} />
                          <button className="btn btn-outline btn-small">{status === 'approved' ? t('approve') : t('reject')}</button>
                        </form>
                      ))}
                    </div>
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
