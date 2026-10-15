import * as Sentry from '@sentry/nextjs';
import { scrubDeep, scrubSentryEvent } from '@alt/core';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    // Collect nothing about the person: no user info, cookies, bodies, query strings or AI inputs/outputs.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: { request: { allow: ['user-agent', 'accept-language'] }, response: false }, httpBodies: [], urlQueryParams: false, genAI: { inputs: false, outputs: false }, databaseQueryData: false },
    tracesSampleRate: 0.05,
    // No session replay: it would record what people paste into the checker.
    beforeSend: (event) => scrubSentryEvent(event),
    beforeBreadcrumb: (crumb) => scrubDeep(crumb),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
