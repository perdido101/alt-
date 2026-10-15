import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('web');
  return (
    <section className="section">
      <div className="container stack">
        <h1>{t('notFound')}</h1>
        <Link href="/">{t('home')}</Link>
      </div>
    </section>
  );
}
