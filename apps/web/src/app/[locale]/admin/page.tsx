import { OfficialCategory } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { saveOfficialNumber, setOfficialActive, verifyOfficialNumber } from './actions';
import { asLocale } from '@/i18n/locale';

type Row = {
  id: string;
  organisation_el: string;
  organisation_en: string;
  category: string;
  number_key: string | null;
  display_number: string | null;
  source_url: string | null;
  article_el: string;
  verified: boolean;
  verified_at: string | null;
  active: boolean;
  notes: string | null;
};

function NumberForm({ row, t }: { row?: Row; t: (k: string) => string }) {
  return (
    <form action={saveOfficialNumber} className="grid grid-3" style={{ alignItems: 'end' }}>
      {row ? <input type="hidden" name="id" value={row.id} /> : null}
      <div>
        <label>{t('admin.organisation')} (EL)</label>
        <input name="organisation_el" defaultValue={row?.organisation_el} required />
      </div>
      <div>
        <label>{t('admin.organisation')} (EN)</label>
        <input name="organisation_en" defaultValue={row?.organisation_en} required />
      </div>
      <div>
        <label>{t('admin.category')}</label>
        <select name="category" defaultValue={row?.category ?? 'police'}>
          {OfficialCategory.options.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label>{t('admin.number')}</label>
        <input name="number" defaultValue={row?.number_key ?? ''} />
      </div>
      <div>
        <label>{t('admin.display')}</label>
        <input name="display_number" defaultValue={row?.display_number ?? ''} />
      </div>
      <div>
        <label>{t('admin.source')}</label>
        <input name="source_url" type="url" defaultValue={row?.source_url ?? ''} />
      </div>
      <div>
        <label>{t('admin.article')}</label>
        <select name="article_el" defaultValue={row?.article_el ?? 'i'}>
          {['o', 'i', 'to', 'oi', 'ta'].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>
      <div>
        <label>{t('admin.notes')}</label>
        <input name="notes" defaultValue={row?.notes ?? ''} />
      </div>
      <button className="btn btn-outline btn-small">{row ? t('admin.save') : t('admin.add')}</button>
    </form>
  );
}

/** Official-numbers directory. Rows are inactive and UNVERIFIED until an admin checks the source. */
export default async function AdminNumbers({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  const { db } = await requireAdmin();
  const { data } = await db.from('official_numbers').select('*').order('category').order('organisation_el');
  const rows = (data ?? []) as Row[];
  return (
    <>
      <h1>{t('admin.numbers')}</h1>
      <details className="card">
        <summary>{t('admin.add')}</summary>
        <NumberForm t={t} />
      </details>
      {rows.map((r) => (
        <div key={r.id} className="card stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>
              {r.organisation_el} · {r.category} · {r.display_number ?? '—'}
            </strong>
            <span className={r.verified ? 'pill-safe' : 'pill-danger'}>
              {r.verified ? `${t('admin.verified')} ${r.verified_at ? new Date(r.verified_at).toLocaleDateString(localeTags[locale]) : ''}` : t('admin.unverified')} ·{' '}
              {r.active ? t('admin.active') : t('admin.inactive')}
            </span>
          </div>
          {r.notes ? <span className="muted">{r.notes}</span> : null}
          <details>
            <summary>{t('admin.edit')}</summary>
            <NumberForm row={r} t={t} />
          </details>
          <div className="row">
            {!r.verified ? (
              <form action={verifyOfficialNumber}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn btn-outline btn-small" disabled={!r.number_key || !r.source_url || !r.display_number} title={t('admin.verifyNeedsSource')}>
                  {t('admin.verify')}
                </button>
              </form>
            ) : null}
            <form action={setOfficialActive}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="active" value={r.active ? 'false' : 'true'} />
              <button className="btn btn-outline btn-small" disabled={!r.active && !r.verified}>
                {r.active ? t('admin.deactivate') : t('admin.activate')}
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
