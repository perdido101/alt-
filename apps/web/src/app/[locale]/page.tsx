import { entitlements, formatPrice, pricing } from '@alt/core';
import type { Locale } from '@alt/i18n';
import { BellRing, MessageSquareText, PhoneIncoming, ShieldCheck } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PhoneMock } from '@/components/PhoneMock';
import { RadarCard } from '@/components/RadarCard';
import { Link } from '@/i18n/navigation';
import { radarItems } from '@/server/content';
import { asLocale } from '@/i18n/locale';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('web');
  const items = (await radarItems(locale)).slice(0, 3);
  const features = [
    { icon: PhoneIncoming, title: t('features.callTitle'), body: t('features.callBody') },
    { icon: ShieldCheck, title: t('features.officialTitle'), body: t('features.officialBody') },
    { icon: MessageSquareText, title: t('features.messageTitle'), body: t('features.messageBody') },
    { icon: BellRing, title: t('features.alertTitle'), body: t('features.alertBody') },
  ];

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">{t('hero.eyebrow')}</div>
            <h1>{t('hero.headline')}</h1>
            <p className="lead">{t('hero.subline')}</p>
            <div className="row" style={{ marginTop: 24 }}>
              <Link href="/app" className="btn btn-primary">
                {t('hero.ctaPrimary')}
              </Link>
              <a href="#how" className="btn btn-outline">
                {t('hero.ctaSecondary')}
              </a>
            </div>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section id="how" className="section section-alt" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title">{t('how.title')}</h2>
          <ol className="grid grid-3" style={{ listStyle: 'none', padding: 0 }}>
            {[1, 2, 3].map((n) => (
              <li key={n} className="card">
                <span className="step-num" aria-hidden="true">
                  {n}
                </span>
                <h3>{t(`how.step${n}Title` as 'how.step1Title')}</h3>
                <p className="muted">{t(`how.step${n}Body` as 'how.step1Body')}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="features-title">
        <div className="container">
          <h2 id="features-title">{t('features.title')}</h2>
          <div className="grid grid-4">
            {features.map((f) => (
              <div key={f.title} className="card">
                <f.icon className="feature-icon" aria-hidden="true" strokeWidth={2} />
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="radar-title">
        <div className="container">
          <h2 id="radar-title">{t('radar.teaserTitle')}</h2>
          <p className="lead">{t('radar.intro')}</p>
          <div className="grid grid-3">
            {items.map((i) => (
              <RadarCard key={i.slug} item={i} />
            ))}
          </div>
          <p style={{ marginTop: 24 }}>
            <Link href="/scam-radar">{t('radar.all')} →</Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="pricing-title">
        <div className="container">
          <h2 id="pricing-title">{t('pricing.title')}</h2>
          <p className="lead">{t('pricing.intro')}</p>
          <p>
            {t('pricing.free')} {formatPrice(0, locale)} · {t('pricing.family')} {formatPrice(pricing.family.monthly, locale)}
            {t('pricing.perMonth')} · {t('pricing.familyPlus')} {formatPrice(pricing.family_plus.monthly, locale)}
            {t('pricing.perMonth')}
          </p>
          <div className="row">
            <Link href="/pricing" className="btn btn-primary">
              {t('nav.pricing')}
            </Link>
            <Link href="/gift" className="btn btn-outline">
              {t('pricing.giftTitle')}
            </Link>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            {t('pricing.freeFeatures', { checks: entitlements.free.monthlyModelChecks ?? 0 }).split('|').slice(1, 3).join(' · ')}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="b2b">
            <h2>{t('orgs.title')}</h2>
            <p>{t('orgs.body')}</p>
            <Link href="/organisations" className="btn btn-light">
              {t('orgs.formTitle')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
