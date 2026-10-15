import type { Locale } from '@alt/i18n';
import { localeTags } from '@alt/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShareButtons } from '@/components/ShareButtons';
import { Link } from '@/i18n/navigation';
import { radarItem, radarRows } from '@/server/content';
import { asLocale } from '@/i18n/locale';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateStaticParams() {
  const rows = await radarRows();
  return rows.flatMap((r) => [
    { locale: 'el', slug: r.slug },
    { locale: 'en', slug: r.slug },
  ]);
}

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  const item = await radarItem(locale, slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/${locale}/scam-radar/${slug}`, languages: { el: `/el/scam-radar/${slug}`, en: `/en/scam-radar/${slug}` } },
    openGraph: { title: item.title, description: item.summary, type: 'article', publishedTime: item.publishedAt },
  };
}

export default async function RadarArticle({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  setRequestLocale(locale);
  const item = await radarItem(locale, slug);
  if (!item) notFound();
  const t = await getTranslations();
  const url = `${site}/${locale}/scam-radar/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt,
    inLanguage: localeTags[locale],
    publisher: { '@type': 'Organization', name: 'ΑΛΤ!' },
  };
  return (
    <section className="section">
      <article className="container article stack">
        <Link href="/scam-radar">← {t('web.radar.back')}</Link>
        <span className="tag">{t(`categories.${item.category}`)}</span>
        <h1>{item.title}</h1>
        <p className="muted">{t('web.radar.published', { date: new Date(item.publishedAt).toLocaleDateString(localeTags[locale], { dateStyle: 'long' }) })}</p>
        <p className="lead">{item.summary}</p>
        {item.body.split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <div className="todo">
          <h2>{t('web.radar.whatToDo')}</h2>
          <p>{item.whatToDo}</p>
        </div>
        <ShareButtons
          url={url}
          title={item.title}
          labels={{
            share: t('web.radar.share'),
            viber: t('web.radar.shareViber'),
            whatsapp: t('web.radar.shareWhatsApp'),
            facebook: t('web.radar.shareFacebook'),
            copy: t('web.radar.copyLink'),
            copied: t('web.radar.copied'),
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </article>
    </section>
  );
}
