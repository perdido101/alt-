import { useTranslations } from 'next-intl';

/** Placeholder until the marketing site lands in milestone 5. */
export default function Home() {
  const t = useTranslations('brand');
  return (
    <main style={{ padding: 32 }}>
      <h1>{t('name')}</h1>
      <p>{t('tagline')}</p>
    </main>
  );
}
