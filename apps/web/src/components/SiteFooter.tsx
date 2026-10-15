import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function SiteFooter() {
  const t = await getTranslations('web.footer');
  const brand = await getTranslations('brand');
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label="Footer">
          <Link href="/privacy">{t('privacy')}</Link>
          <Link href="/terms">{t('terms')}</Link>
          <Link href="/organisations">{t('contact')}</Link>
          <Link href="/privacy#cookies">{t('cookies')}</Link>
        </nav>
        <p className="never-asks">{brand('neverAsksWeb')}</p>
        <p className="muted">
          {brand('tagline')} {t('copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
