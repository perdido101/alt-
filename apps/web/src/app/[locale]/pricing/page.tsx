import { entitlements, formatPrice, pricing } from '@alt/core';
import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'web.pricing' });
  return { title: t('title'), description: t('intro') };
}

export default async function Pricing({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web.pricing');
  const list = (s: string) => (
    <ul className="checklist">
      {s.split('|').map((f) => (
        <li key={f}>{f}</li>
      ))}
    </ul>
  );
  return (
    <section className="section">
      <div className="container stack">
        <h1>{t('title')}</h1>
        <p className="lead">{t('intro')}</p>
        <div className="grid grid-3">
          <div className="card price-card" data-testid="plan-free">
            <h2>{t('free')}</h2>
            <div className="price">{formatPrice(0, locale)}</div>
            {list(t('freeFeatures', { checks: entitlements.free.monthlyModelChecks ?? 0 }))}
            <Link href="/app" className="btn btn-outline">
              {t('chooseFree')}
            </Link>
          </div>
          <div className="card price-card featured" data-testid="plan-family">
            <h2>{t('family')}</h2>
            <span className="badge">{t('trial')}</span>
            <div className="price">
              {formatPrice(pricing.family.monthly, locale)}
              <small>{t('perMonth')}</small>
            </div>
            <div>
              {t('or')} <strong>{formatPrice(pricing.family.yearly, locale)}</strong>
              {t('perYear')}
            </div>
            {list(t('familyFeatures'))}
            <Link href="/app/billing?plan=family_monthly" className="btn btn-primary">
              {t('choose')}
            </Link>
          </div>
          <div className="card price-card" data-testid="plan-family-plus">
            <h2>{t('familyPlus')}</h2>
            <div className="price">
              {formatPrice(pricing.family_plus.monthly, locale)}
              <small>{t('perMonth')}</small>
            </div>
            {list(t('familyPlusFeatures'))}
            <Link href="/app/billing?plan=family_plus_monthly" className="btn btn-outline">
              {t('choose')}
            </Link>
          </div>
        </div>
        <p className="muted">{t('vat')}</p>
        <div className="card card-calm">
          <h2>{t('giftTitle')}</h2>
          <p>{t('giftBody')}</p>
          <Link href="/gift" className="btn btn-primary">
            {t('giftCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
