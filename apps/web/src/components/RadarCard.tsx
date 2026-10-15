import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { RadarItem } from '@/server/content';

export async function RadarCard({ item }: { item: RadarItem }) {
  const t = await getTranslations();
  return (
    <Link href={`/scam-radar/${item.slug}`} className="card radar-card">
      <span className="tag">{t(`categories.${item.category}`)}</span>
      <h3>{item.title}</h3>
      <p className="muted">{item.summary}</p>
    </Link>
  );
}
