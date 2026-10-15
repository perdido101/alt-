import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RadarCard } from '@/components/RadarCard';
import { radarItems, scamOfTheWeek } from '@/server/content';
import { asLocale } from '@/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'web.radar' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/scam-radar`, languages: { el: '/el/scam-radar', en: '/en/scam-radar' } } };
}

export default async function ScamRadar({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web.radar');
  const [items, weekly] = await Promise.all([radarItems(locale), scamOfTheWeek(locale)]);
  return (
    <section className="section">
      <div className="container stack">
        <h1>{t('title')}</h1>
        <p className="lead">{t('intro')}</p>
        {weekly ? (
          <div className="card card-calm">
            <div className="eyebrow">{t('weekly')}</div>
            <RadarCard item={weekly} />
          </div>
        ) : null}
        <div className="grid grid-3">
          {items.map((i) => (
            <RadarCard key={i.slug} item={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
