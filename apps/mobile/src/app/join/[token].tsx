import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { acceptInvite } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { refreshMembership } from '@/lib/session';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Accepts an invite. A parent's phone gets an anonymous, device-bound session (no password).
 * Guardian invites need a real account, so if the invite turns out to be for a guardian we
 * send them to sign in first and accept afterwards.
 */
export default function AcceptInvite() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !token) return;
    started.current = true;
    void (async () => {
      try {
        let { data } = await supabase.auth.getSession();
        let createdAnonymous = false;
        if (!data.session) {
          const res = await supabase.auth.signInAnonymously({ options: { data: { locale: useAppStore.getState().locale } } });
          if (res.error) throw res.error;
          createdAnonymous = true;
          ({ data } = await supabase.auth.getSession());
        }
        try {
          const { circleId, role } = await acceptInvite(token);
          useAppStore.getState().setMembership({ mode: role === 'protected' ? 'parent' : 'guardian', circleId, role });
          await refreshMembership();
          router.replace(role === 'protected' ? '/parent/consent' : '/guardian/home');
        } catch (e) {
          if (e instanceof Error && e.message === 'anonymous_not_allowed') {
            if (createdAnonymous) await supabase.auth.signOut();
            router.replace({ pathname: '/guardian/sign-in', params: { invite: token } });
            return;
          }
          throw e;
        }
      } catch (e) {
        setError(t(errorKey(e)));
      }
    })();
  }, [token, t]);

  return (
    <Screen>
      {error ? (
        <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
          <AppText variant="heading" accessibilityRole="alert">
            {error}
          </AppText>
          <BigButton label={t('common.back')} variant="outline" onPress={() => router.replace('/welcome')} />
        </View>
      ) : (
        <View style={{ gap: spacing.lg, marginTop: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyStrong">{t('join.joining')}</AppText>
        </View>
      )}
    </Screen>
  );
}
