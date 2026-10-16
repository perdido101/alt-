import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/AppNav';
import { SignInForm } from '@/components/SignInForm';
import { currentUser, supabaseServer } from '@/server/auth';
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
  // Admins and organisation staff get a shortcut to their areas (RLS decides what each can read).
  const db = await supabaseServer();
  const [{ data: profile }, { data: orgs }] = await Promise.all([
    db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle(),
    db.from('org_members').select('org_id').eq('user_id', user.id).limit(1),
  ]);
  const ta = await getTranslations();
  const extra = [
    ...((profile as { is_admin?: boolean } | null)?.is_admin ? [{ href: '/admin', label: ta('admin.title') }] : []),
    ...((orgs ?? []).length ? [{ href: '/org', label: ta('org.title') }] : []),
  ];
  return (
    <div className="container app-shell">
      <AppNav
        base="/app"
        extra={extra}
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
