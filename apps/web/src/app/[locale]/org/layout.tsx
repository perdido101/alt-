import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/AppNav';
import { SignInForm } from '@/components/SignInForm';
import { asLocale } from '@/i18n/locale';
import { currentUser } from '@/server/auth';
import { demoMode, orgRepo } from '@/server/org';

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations();
  if (!demoMode() && !(await currentUser())) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return (
      <section className="section">
        <div className="container stack" style={{ maxWidth: 520 }}>
          <h1>{t('org.signInTitle')}</h1>
          {url && key ? (
            <SignInForm locale={`${locale}`} supabaseUrl={url} anonKey={key} labels={{ email: t('dashboard.emailLabel'), send: t('dashboard.send'), sent: t('dashboard.sent'), error: t('errors.generic') }} />
          ) : null}
        </div>
      </section>
    );
  }
  const org = await orgRepo().current();
  if (!org) return <section className="section"><div className="container"><p className="card card-calm">{t('org.notMember')}</p></div></section>;
  return (
    <div className="container app-shell">
      <AppNav
        base="/org"
        signOut={t('dashboard.signOut')}
        items={[
          { href: '', label: t('org.overview') },
          { href: '/stats', label: t('org.stats') },
          { href: '/branding', label: t('org.branding') },
        ]}
      />
      <div className="stack">{children}</div>
    </div>
  );
}
