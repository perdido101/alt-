import 'server-only';
import { translate as t, type Locale } from '@alt/i18n';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { Resend } from 'resend';
import { env } from '../env';
import { Code, Cta, EmailLayout, H, P } from './templates';

let resend: Resend | null = null;

/** Transactional email via Resend. Without RESEND_API_KEY (development) the email is only logged. */
async function send(to: string, subject: string, element: ReactElement): Promise<void> {
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const key = env().RESEND_API_KEY;
  if (!key) {
    console.info(`[email] to=${to.replace(/(.).*@/, '$1…@')} subject="${subject}" (${text.length} chars)`);
    return;
  }
  resend ??= new Resend(key);
  const { error } = await resend.emails.send({ from: env().EMAIL_FROM, to, subject, html, text });
  if (error) console.error('email_failed', error.name);
}

const site = () => env().NEXT_PUBLIC_SITE_URL;

export async function sendGiftCodeEmail(p: { to: string; code: string; months: number; recipientName: string | null; locale: Locale }) {
  const recipient = p.recipientName ? t(p.locale, 'email.giftRecipient', { name: p.recipientName }) : '';
  const subject = t(p.locale, 'email.giftSubject');
  await send(
    p.to,
    subject,
    <EmailLayout lang={p.locale} preview={subject} footer={t(p.locale, 'email.footer')}>
      <H>{t(p.locale, 'email.giftTitle')}</H>
      <P>{t(p.locale, 'email.giftBody', { months: p.months, recipient })}</P>
      <Code>{p.code}</Code>
      <P>{t(p.locale, 'email.giftHow')}</P>
    </EmailLayout>,
  );
}

export async function sendPaymentFailedEmail(p: { to: string; locale: Locale; graceDays: number }) {
  const subject = t(p.locale, 'email.paymentFailedSubject');
  await send(
    p.to,
    subject,
    <EmailLayout lang={p.locale} preview={subject} footer={t(p.locale, 'email.footer')}>
      <H>{subject}</H>
      <P>{t(p.locale, 'email.paymentFailedBody', { days: p.graceDays })}</P>
      <P>{t(p.locale, 'email.paymentFailedNote')}</P>
      <Cta href={`${site()}/${p.locale}/app/billing`}>{t(p.locale, 'email.updateCard')}</Cta>
    </EmailLayout>,
  );
}

export async function sendDowngradedEmail(p: { to: string; locale: Locale }) {
  const subject = t(p.locale, 'email.downgradedSubject');
  await send(
    p.to,
    subject,
    <EmailLayout lang={p.locale} preview={subject} footer={t(p.locale, 'email.footer')}>
      <H>{subject}</H>
      <P>{t(p.locale, 'email.downgradedBody')}</P>
      <Cta href={`${site()}/${p.locale}/app/billing`}>{t(p.locale, 'email.renew')}</Cta>
    </EmailLayout>,
  );
}

export async function sendDigestEmail(p: {
  to: string;
  locale: Locale;
  item: { slug: string; title: string; summary: string } | null;
  stats: { checks: number; alerts: number; calls: number };
}) {
  const subject = p.item ? t(p.locale, 'email.digestSubject', { title: p.item.title }) : t(p.locale, 'email.digestTitle');
  await send(
    p.to,
    subject,
    <EmailLayout lang={p.locale} preview={subject} footer={t(p.locale, 'email.footer')}>
      <H>{t(p.locale, 'email.digestTitle')}</H>
      {p.item ? (
        <>
          <P>{p.item.title}</P>
          <P>{p.item.summary}</P>
          <Cta href={`${site()}/${p.locale}/scam-radar/${p.item.slug}`}>{t(p.locale, 'email.readMore')}</Cta>
        </>
      ) : null}
      <P>{t(p.locale, 'email.digestStats', p.stats)}</P>
      <P>{t(p.locale, 'email.unsubscribe')}</P>
    </EmailLayout>,
  );
}

/** Notifications to us (B2B requests). Greek, plain. */
export async function sendInternalEmail(subject: string, lines: string[]) {
  await send(
    env().SALES_EMAIL,
    subject,
    <EmailLayout lang="el" preview={subject} footer="ΑΛΤ! internal">
      <H>{subject}</H>
      {lines.map((l, i) => (
        <P key={i}>{l}</P>
      ))}
    </EmailLayout>,
  );
}
