import el from '../messages/el.json';
import en from '../messages/en.json';

/** Messages are ICU MessageFormat ({name}, plurals), read by next-intl (web) and i18next-icu (mobile). */
export const locales = ['el', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'el';

export type Messages = typeof el;
export const messages: Record<Locale, Messages> = { el, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** BCP-47 tag for TTS, Intl formatting and Stripe/Checkout. */
export const localeTags: Record<Locale, string> = { el: 'el-GR', en: 'en-GB' };
