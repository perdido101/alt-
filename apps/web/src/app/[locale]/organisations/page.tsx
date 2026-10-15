import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { B2BForm } from '@/components/B2BForm';
import { asLocale } from '@/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: 'web.orgs' });
  return { title: t('title'), description: t('body') };
}

export default async function Organisations({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web.orgs');
  const types = Object.fromEntries(['municipality', 'kapi', 'bank', 'telco', 'other'].map((k) => [k, t(`type_${k}` as 'type_bank')]));
  return (
    <section className="section">
      <div className="container grid grid-2">
        <div className="stack">
          <h1>{t('title')}</h1>
          <p className="lead">{t('body')}</p>
          <ul className="checklist">
            <li>{t('point1')}</li>
            <li>{t('point2')}</li>
            <li>{t('point3')}</li>
          </ul>
        </div>
        <div className="card">
          <h2>{t('formTitle')}</h2>
          <B2BForm
            locale={locale}
            labels={{
              org: t('orgLabel'),
              orgType: t('orgTypeLabel'),
              name: t('nameLabel'),
              email: t('emailLabel'),
              phone: t('phoneLabel'),
              message: t('messageLabel'),
              send: t('send'),
              sent: t('sent'),
              error: t('error'),
              types,
            }}
          />
        </div>
      </div>
    </section>
  );
}
