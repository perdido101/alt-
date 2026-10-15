import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/AppNav';
import { SignInForm } from '@/components/SignInForm';
import { currentUser } from '@/server/auth';
import { asLocale } from '@/i18n/locale';

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Guardian dashboard. Signed out: magic-link sign-in. */
export default async function AppLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const user = await currentUser();
  if (!user) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return (
      <section className="section">
        <div className="container stack" style={{ maxWidth: 520 }}>
          <h1>{t('signInTitle')}</h1>
          <p className="lead">{t('signInBody')}</p>
          {url && key ? (
            <SignInForm locale={locale} supabaseUrl={url} anonKey={key} labels={{ email: t('emailLabel'), send: t('send'), sent: t('sent'), error: (await getTranslations('errors'))('generic') }} />
          ) : (
            <p className="warn-box">Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).</p>
          )}
        </div>
      </section>
    );
  }
  return (
    <div className="container app-shell">
      <AppNav
        base="/app"
        items={[
          { href: '', label: t('overview') },
          { href: '/history', label: t('history') },
          { href: '/settings', label: t('settings') },
          { href: '/billing', label: t('billing') },
        ]}
        signOut={t('signOut')}
      />
      <div className="stack">{children}</div>
    </div>
  );
}
