import { defaultLocale, isLocale, messages, type Locale } from '@alt/i18n';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

/** The shared catalogs are ICU MessageFormat, so i18next runs with the ICU plugin. */
export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return isLocale(code) ? code : defaultLocale;
}

export function initI18n(locale: Locale) {
  if (i18n.isInitialized) {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n;
  }
  void i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      resources: { el: { translation: messages.el }, en: { translation: messages.en } },
      lng: locale,
      fallbackLng: defaultLocale,
      interpolation: { escapeValue: false },
      returnNull: false,
      initAsync: false,
    });
  return i18n;
}

export { i18n };
