import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/AppNav';
import { requireAdmin } from '@/server/admin';
import { asLocale } from '@/i18n/locale';

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  await requireAdmin();
  const t = await getTranslations();
  return (
    <div className="container app-shell">
      <AppNav
        base="/admin"
        signOut={t('dashboard.signOut')}
        items={[
          { href: '', label: t('admin.numbers') },
          { href: '/reports', label: t('admin.reports') },
          { href: '/radar', label: t('admin.radar') },
          { href: '/orgs', label: t('admin.orgs') },
          { href: '/requests', label: t('admin.requests') },
          { href: '/sms', label: t('admin.smsTest') },
        ]}
      />
      <div className="stack">{children}</div>
    </div>
  );
}
