import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LocaleSwitch } from './LocaleSwitch';
import { Wordmark } from './Wordmark';

export async function SiteHeader() {
  const t = await getTranslations('web.nav');
  const locale = await getLocale();
  const links = [
    { href: '/#how', label: t('how') },
    { href: '/scam-radar', label: t('radar') },
    { href: '/pricing', label: t('pricing') },
    { href: '/organisations', label: t('orgs') },
  ] as const;
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <div className="container bar">
        <Wordmark />
        <nav className="nav" aria-label={t('menu')}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <LocaleSwitch current={locale} label={t('language')} />
          <Link href="/app" className="btn btn-outline btn-small">
            {t('signIn')}
          </Link>
        </nav>
        <details className="menu-toggle">
          <summary>{t('menu')}</summary>
          <nav className="mobile-nav" aria-label={t('menu')}>
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/app">{t('signIn')}</Link>
            <LocaleSwitch current={locale} label={t('language')} />
          </nav>
        </details>
      </div>
    </header>
  );
}
