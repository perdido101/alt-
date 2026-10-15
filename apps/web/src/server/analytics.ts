import 'server-only';
import { type AnalyticsEvent, type AnalyticsProps, capture } from '@alt/core';
import { after } from 'next/server';

/**
 * Server-side analytics: the distinct id is the Supabase user id (pseudonymous) or "anon".
 * Sent after the response so it never slows a request. Users who opted out in the app have
 * profiles.analytics_opt_out = true and the caller passes optOut.
 */
export function trackServer(event: AnalyticsEvent, opts: { userId?: string | null; props?: AnalyticsProps; optOut?: boolean } = {}) {
  if (opts.optOut || !process.env.POSTHOG_KEY) return;
  const send = () => capture({ apiKey: process.env.POSTHOG_KEY, host: process.env.POSTHOG_HOST, distinctId: opts.userId ?? 'anon', event, props: opts.props, extra: { platform: 'server' } });
  try {
    after(send);
  } catch {
    void send();
  }
}
