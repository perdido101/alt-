import { type AnalyticsEvent, type AnalyticsProps, capture } from '@alt/core';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { useAppStore } from './store';

/** App analytics (PostHog EU, allow-listed events only, see @alt/core telemetry). Respects the settings opt-out. */
export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  const s = useAppStore.getState();
  if (s.analyticsOptOut) return;
  let id = s.installId;
  if (!id) {
    id = Crypto.randomUUID();
    s.setInstallId(id);
  }
  void capture({
    apiKey: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    distinctId: id,
    event,
    props,
    extra: { platform: Platform.OS, mode: s.mode },
  });
}

/** Sent with API calls so server-side events honour the opt-out too. */
export const analyticsHeader = (): Record<string, string> => (useAppStore.getState().analyticsOptOut ? { 'x-alt-analytics': 'off' } : {});
