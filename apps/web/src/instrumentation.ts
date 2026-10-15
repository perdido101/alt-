import * as Sentry from '@sentry/nextjs';
import { scrubDeep, scrubSentryEvent } from '@alt/core';

/** Server + edge error reporting. Off unless SENTRY_DSN is set. Never sends PII (see @alt/core telemetry). */
export function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? 'development',
    // Collect nothing about the person: no user info, cookies, bodies, query strings or AI inputs/outputs.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: { request: { allow: ['user-agent', 'accept-language'] }, response: false }, httpBodies: [], urlQueryParams: false, genAI: { inputs: false, outputs: false }, databaseQueryData: false },
    tracesSampleRate: 0.05,
    beforeSend: (event) => scrubSentryEvent(event),
    beforeBreadcrumb: (crumb) => scrubDeep(crumb),
  });
}

export const onRequestError = Sentry.captureRequestError;
