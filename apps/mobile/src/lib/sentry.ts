import { scrubDeep, scrubSentryEvent } from '@alt/core';
import * as Sentry from '@sentry/react-native';

/** Crash/error reporting. Off unless EXPO_PUBLIC_SENTRY_DSN is set. No PII, no screenshots, no replays. */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0.05,
    beforeSend: (event) => scrubSentryEvent(event),
    beforeBreadcrumb: (crumb) => scrubDeep(crumb),
  });
}

export const wrapRoot = Sentry.wrap;
