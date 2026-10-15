import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { Locale } from '@alt/i18n';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '@/lib/i18n';
import { ThemeProvider, type UiMode } from '@/theme/ThemeProvider';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

export async function renderWithProviders(ui: ReactElement, { mode = 'parent', locale = 'el' }: { mode?: UiMode; locale?: Locale } = {}) {
  const i18n = initI18n(locale);
  await i18n.changeLanguage(locale);
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <ThemeProvider mode={mode} textScale="extraLarge">
            {ui}
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>,
  );
}
