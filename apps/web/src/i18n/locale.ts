import { defaultLocale, isLocale, type Locale } from '@alt/i18n';

/** Route params arrive as strings; the proxy guarantees a supported locale, this narrows the type. */
export function asLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}
