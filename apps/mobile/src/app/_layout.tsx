import { Commissioner_400Regular } from '@expo-google-fonts/commissioner/400Regular';
import { Commissioner_600SemiBold } from '@expo-google-fonts/commissioner/600SemiBold';
import { Commissioner_800ExtraBold } from '@expo-google-fonts/commissioner/800ExtraBold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { track } from '@/lib/analytics';
import { useCallShieldSync } from '@/lib/callShield';
import { initI18n } from '@/lib/i18n';
import { usePinLock } from '@/lib/pinLock';
import { registerForPush, useNotificationRouting } from '@/lib/push';
import { initSentry, wrapRoot } from '@/lib/sentry';
import { useSessionSync } from '@/lib/session';
import { useAppStore } from '@/lib/store';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

initSentry();
void SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function Navigator() {
  const { colors, dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({ Commissioner_400Regular, Commissioner_600SemiBold, Commissioner_800ExtraBold });
  const { hydrated, locale, mode, textScale } = useAppStore();
  const i18n = initI18n(locale);
  useSessionSync();
  useNotificationRouting(hydrated && !!mode);
  useCallShieldSync(hydrated && mode === 'parent');
  usePinLock(hydrated && fontsLoaded && mode === 'parent' && useAppStore.getState().setupDone);

  // Register this phone for push once it belongs to a circle (alerts for guardians, quizzes for parents).
  useEffect(() => {
    if (hydrated && mode) void registerForPush().catch(() => undefined);
  }, [hydrated, mode]);

  useEffect(() => {
    if (hydrated) track('app_opened', { mode: mode ?? 'none' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {/* Welcome and join screens use the parent look too: the person joining may be the parent. */}
          <ThemeProvider mode={mode === 'guardian' ? 'guardian' : 'parent'} textScale={textScale}>
            <Navigator />
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

export default wrapRoot(RootLayout);
