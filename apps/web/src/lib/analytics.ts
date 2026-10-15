'use client';

import { type AnalyticsEvent, type AnalyticsProps, capture } from '@alt/core';
import { readConsent } from '@/components/ConsentBanner';

/**
 * Browser analytics. Without consent the id lives in memory only (a new one per page load, nothing stored);
 * after "accept" it is kept in localStorage. "Decline" turns capture off.
 */
const KEY = 'alt-aid';
let memoryId: string | null = null;

function distinctId(): string {
  const consent = readConsent();
  if (consent === 'granted') {
    try {
      const existing = window.localStorage.getItem(KEY);
      if (existing) return existing;
      const id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
      return id;
    } catch {
      // fall through to memory id
    }
  }
  memoryId ??= crypto.randomUUID();
  return memoryId;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  if (readConsent() === 'denied') return;
  void capture({ apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY, host: process.env.NEXT_PUBLIC_POSTHOG_HOST, distinctId: distinctId(), event, props, extra: { platform: 'web' } });
}
