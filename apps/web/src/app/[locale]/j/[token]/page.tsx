import { parseInviteToken } from '@alt/core';
import type { Locale } from '@alt/i18n';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/i18n/locale';

export const metadata: Metadata = { robots: { index: false } };

const PLAY = process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? 'https://play.google.com/store/apps/details?id=gr.alt.app';
const APP_STORE = process.env.NEXT_PUBLIC_APP_STORE_URL ?? 'https://apps.apple.com/';

/**
 * Invite links normally open the app directly (App Links / Universal Links). This page is the fallback
 * when the app isn't installed yet, or the link was opened on a computer.
 */
export default async function InviteFallback({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale: rawLocale, token } = await params;
  const locale = asLocale(rawLocale);
  setRequestLocale(locale);
  if (!parseInviteToken(token)) notFound();
  const t = await getTranslations('web.invite');
  return (
    <section className="section">
      <div className="container stack" style={{ maxWidth: 640 }}>
        <h1>{t('title')}</h1>
        <p className="lead">{t('body')}</p>
        <a className="btn btn-primary" href={`alt://join/${token}`}>
          {t('open')}
        </a>
        <div className="row">
          <a className="btn btn-outline" href={PLAY}>
            {t('playStore')}
          </a>
          <a className="btn btn-outline" href={APP_STORE}>
            {t('appStore')}
          </a>
        </div>
      </div>
    </section>
  );
}
