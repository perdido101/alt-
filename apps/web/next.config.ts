import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
/**
 * Content Security Policy. Next.js hydration needs inline scripts ('unsafe-inline'); everything else is
 * restricted to our own origin and the services we use (Supabase, PostHog EU, Sentry, Vercel, Google Fonts).
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${supabase}`,
  `connect-src 'self' ${supabase} ${supabase.replace('https://', 'wss://')} https://eu.i.posthog.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  'upgrade-insecure-requests',
].join('; ');

const config: NextConfig = {
  transpilePackages: ['@alt/core', '@alt/i18n', '@alt/tokens'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

const withIntl = withNextIntl(config);

/** Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (CI / Vercel). */
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : withIntl;
