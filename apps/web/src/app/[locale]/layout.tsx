import { isLocale, type Locale } from '@alt/i18n';
import '@alt/tokens/tokens.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { ConsentBanner } from '@/components/ConsentBanner';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { asLocale } from '@/i18n/locale';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const t = await getTranslations({ locale: isLocale(locale) ? locale : 'el' });
  return {
    metadataBase: new URL(site),
    title: { default: `ΑΛΤ! · ${t('brand.tagline')}`, template: '%s · ΑΛΤ!' },
    description: t('web.hero.subline'),
    alternates: { languages: { el: '/el', en: '/en', 'x-default': '/el' } },
    openGraph: { siteName: 'ΑΛΤ!', locale: locale === 'el' ? 'el_GR' : 'en_GB', type: 'website' },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: 'web.consent' });
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <ConsentBanner text={t('text')} accept={t('accept')} decline={t('decline')} enabled={!!process.env.NEXT_PUBLIC_POSTHOG_KEY} />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
