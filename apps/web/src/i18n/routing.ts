import { defaultLocale, locales } from '@alt/i18n';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});
