import { formatPrice, pricing } from '@alt/core';
import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GiftForm } from '@/components/GiftForm';
import { asLocale } from '@/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'web.gift' });
  return { title: t('title'), description: t('intro') };
}

export default async function Gift({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web');
  return (
    <section className="section">
      <div className="container stack" style={{ maxWidth: 760 }}>
        <h1>{t('gift.title')}</h1>
        <p className="lead">{t('gift.intro')}</p>
        <GiftForm
          locale={locale}
          options={[
            { key: 'gift_3m', label: t('gift.months', { months: 3 }), price: formatPrice(pricing.gift.months3, locale) },
            { key: 'gift_6m', label: t('gift.months', { months: 6 }), price: formatPrice(pricing.gift.months6, locale) },
            { key: 'gift_12m', label: t('gift.months', { months: 12 }), price: formatPrice(pricing.gift.months12, locale) },
          ]}
          labels={{ email: t('gift.emailLabel'), recipient: t('gift.recipientLabel'), buy: t('gift.buy'), error: t('orgs.error') }}
        />
        <p className="muted">{t('pricing.vat')}</p>
      </div>
    </section>
  );
}
