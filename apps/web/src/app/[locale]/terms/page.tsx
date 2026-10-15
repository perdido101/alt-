import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalPage } from '@/components/LegalPage';
import { legal } from '@/content/legal';
import { asLocale } from '@/i18n/locale';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  return { title: legal.terms[locale].title };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  return <LegalPage doc={legal.terms[locale]} />;
}
