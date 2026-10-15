import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PhoneMock } from '@/components/PhoneMock';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/i18n/locale';
import { env } from '@/server/env';
import { demoMode, logoUrl } from '@/server/org';

type Branding = { slug: string; name_el: string; name_en: string; logo_path: string | null; kind: string };

async function branding(slug: string): Promise<Branding | null> {
  if (demoMode() && slug === 'demo') return { slug: 'demo', name_el: 'Δοκιμής', name_en: 'Dokimi', logo_path: null, kind: 'municipality' };
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const db = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await db.rpc('org_branding', { p_slug: slug });
  return ((data as Branding[] | null) ?? [])[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = await branding(slug);
  return b ? { title: `ΑΛΤ! · ${b.name_el}` } : {};
}

/** Co-branded landing for a municipality: /d/<org-slug>. */
export default async function CoBranded({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const b = await branding(slug);
  if (!b) notFound();
  const t = await getTranslations();
  const name = locale === 'el' ? b.name_el : b.name_en;
  const sponsor = b.kind === 'municipality' ? t('org.sponsoredBy', { name }) : t('org.sponsoredByOrg', { name });
  const logo = logoUrl(b.logo_path);
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <div className="row" style={{ marginBottom: 16 }}>
            {logo ? <img src={logo} alt="" style={{ height: 48, width: 'auto' }} /> : null}
            <strong>{sponsor}</strong>
          </div>
          <div className="eyebrow">{t('web.hero.eyebrow')}</div>
          <h1>{t('web.hero.headline')}</h1>
          <p className="lead">{t('web.hero.subline')}</p>
          <p className="card card-calm">{t('org.landingCode')}</p>
          <div className="row">
            <Link href="/app" className="btn btn-primary">
              {t('web.hero.ctaPrimary')}
            </Link>
            <Link href="/#how" className="btn btn-outline">
              {t('web.hero.ctaSecondary')}
            </Link>
          </div>
        </div>
        <PhoneMock />
      </div>
    </section>
  );
}
