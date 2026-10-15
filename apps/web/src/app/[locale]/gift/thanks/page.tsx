import type { Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/i18n/locale';

export default async function GiftThanks({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web.gift');
  return (
    <section className="section">
      <div className="container stack" style={{ maxWidth: 680 }}>
        <h1>{t('thanksTitle')}</h1>
        <p className="lead">{t('thanksBody')}</p>
      </div>
    </section>
  );
}
