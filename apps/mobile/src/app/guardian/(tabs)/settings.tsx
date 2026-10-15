import { locales } from '@alt/i18n';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { Screen } from '@/components/Screen';
import { updateProfile } from '@/lib/api';
import { useSafeWordStatus } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuardianSettings() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale, setLocale, reset } = useAppStore();
  const safeWord = useSafeWordStatus();

  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('guardian.nav.settings')}
      </AppText>
      <AppText variant="gTitle">{t('guardian.settings.language')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {locales.map((l) => (
          <Choice
            key={l}
            label={t(`languages.${l}`)}
            selected={locale === l}
            onPress={() => {
              setLocale(l);
              void updateProfile({ locale: l });
            }}
          />
        ))}
      </View>
      <Card>
        <AppText variant="gTitle">{t('guardian.settings.safeWord')}</AppText>
        <AppText variant="gBody" color={colors.textSoft}>
          {safeWord.data?.isSet ? t('guardian.settings.safeWordHashedNote') : t('setup.safeWord.body')}
        </AppText>
        <AppText variant="gBody" color={colors.textSoft}>
          {t('guardian.settings.safeWordReauth')}
        </AppText>
      </Card>
      <BigButton
        variant="outline"
        label={t('auth.signOut')}
        onPress={() => {
          void supabase.auth.signOut().then(() => {
            reset();
            router.replace('/welcome');
          });
        }}
      />
    </Screen>
  );
}
