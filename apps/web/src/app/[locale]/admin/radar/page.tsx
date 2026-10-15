import { ScamCategory } from '@alt/core';
import type { Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAdmin } from '@/server/admin';
import { saveRadarItem } from '../actions';
import { asLocale } from '@/i18n/locale';

type Item = Record<'id' | 'slug' | 'category' | 'title_el' | 'title_en' | 'summary_el' | 'summary_en' | 'body_el' | 'body_en' | 'what_to_do_el' | 'what_to_do_en', string> & {
  featured_week: string | null;
  published: boolean;
};

function ItemForm({ item, t }: { item?: Item; t: (k: string) => string }) {
  const text = (name: keyof Item, label: string, area = false) => (
    <div className="field">
      <label>{label}</label>
      {area ? <textarea name={name} defaultValue={(item?.[name] as string) ?? ''} required /> : <input name={name} defaultValue={(item?.[name] as string) ?? ''} required />}
    </div>
  );
  return (
    <form action={saveRadarItem} className="stack">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid grid-3">
        {text('slug', t('slug'))}
        <div className="field">
          <label>{t('category')}</label>
          <select name="category" defaultValue={item?.category ?? 'other'}>
            {ScamCategory.options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t('featuredWeek')}</label>
          <input type="date" name="featured_week" defaultValue={item?.featured_week ?? ''} />
        </div>
      </div>
      <div className="grid grid-2">
        {text('title_el', t('titleEl'))}
        {text('title_en', t('titleEn'))}
        {text('summary_el', t('summaryEl'), true)}
        {text('summary_en', t('summaryEn'), true)}
        {text('body_el', t('bodyEl'), true)}
        {text('body_en', t('bodyEn'), true)}
        {text('what_to_do_el', t('todoEl'), true)}
        {text('what_to_do_en', t('todoEn'), true)}
      </div>
      <label>
        <input type="checkbox" name="published" defaultChecked={item?.published ?? false} style={{ width: 'auto', minHeight: 0, marginRight: 8 }} />
        {t('published')}
      </label>
      <button className="btn btn-primary">{t('save')}</button>
    </form>
  );
}

export default async function AdminRadar({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const { db } = await requireAdmin();
  const { data } = await db.from('scam_radar_items').select('*').order('created_at', { ascending: false });
  const items = (data ?? []) as Item[];
  return (
    <>
      <h1>{t('radar')}</h1>
      <details className="card">
        <summary>{t('newItem')}</summary>
        <ItemForm t={t} />
      </details>
      {items.map((i) => (
        <details key={i.id} className="card">
          <summary>
            {i.title_el} · <span className={i.published ? 'pill-safe' : 'muted'}>{i.published ? t('published') : t('draft')}</span>
          </summary>
          <ItemForm item={i} t={t} />
        </details>
      ))}
    </>
  );
}
