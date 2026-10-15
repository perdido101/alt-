import type { Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { createOrganisation, updateSeats } from '../actions';
import { asLocale } from '@/i18n/locale';

/** Organisations are created here and pay by invoice (see docs/SETUP.md, invoicing). */
export default async function AdminOrgs({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const { db } = await requireAdmin();
  const { data } = await db.from('organisations').select('id, slug, kind, name_el, name_en, seats_total, cobranding_enabled').order('created_at');
  const orgs = (data ?? []) as Array<{ id: string; slug: string; kind: string; name_el: string; name_en: string; seats_total: number; cobranding_enabled: boolean }>;
  return (
    <>
      <h1>{t('orgs')}</h1>
      <details className="card">
        <summary>{t('createOrg')}</summary>
        <form action={createOrganisation} className="grid grid-2">
          <div><label>{t('slug')}</label><input name="slug" required pattern="[a-z0-9-]{2,60}" /></div>
          <div>
            <label>{t('kind')}</label>
            <select name="kind" defaultValue="municipality">
              {['municipality', 'kapi', 'bank', 'telco', 'other'].map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div><label>{t('nameEl')}</label><input name="name_el" required /></div>
          <div><label>{t('nameEn')}</label><input name="name_en" required /></div>
          <div><label>{t('seats')}</label><input name="seats_total" type="number" min={0} defaultValue={0} /></div>
          <div><label>{t('addAdmin')}</label><input name="admin_email" type="email" /></div>
          <label><input type="checkbox" name="cobranding" style={{ width: 'auto', minHeight: 0, marginRight: 8 }} />{t('cobranding')}</label>
          <button className="btn btn-primary">{t('add')}</button>
        </form>
      </details>
      {orgs.map((o) => (
        <form key={o.id} action={updateSeats} className="card row" style={{ justifyContent: 'space-between' }}>
          <input type="hidden" name="id" value={o.id} />
          <strong>{o.name_el} ({o.slug}) · {o.kind}</strong>
          <label className="row" style={{ margin: 0 }}>{t('seats')} <input name="seats_total" type="number" min={0} defaultValue={o.seats_total} style={{ width: 110 }} /></label>
          <label style={{ margin: 0 }}><input type="checkbox" name="cobranding" defaultChecked={o.cobranding_enabled} style={{ width: 'auto', minHeight: 0, marginRight: 8 }} />{t('cobranding')}</label>
          <button className="btn btn-outline btn-small">{t('save')}</button>
        </form>
      ))}
    </>
  );
}
