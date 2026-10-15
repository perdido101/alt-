import { router } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { track } from '@/lib/analytics';

export default function SetupDone() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Screen
      footer={
        <>
          <BigButton
            testID="setup-finish"
            size="lg"
            label={t('common.done')}
            onPress={() => {
              useAppStore.getState().finishSetup();
              track('setup_completed', { mode: 'parent' });
              router.replace('/parent/home');
            }}
          />
          <BigButton
            variant="plain"
            label={t('parent.pin.set')}
            onPress={() => {
              useAppStore.getState().finishSetup();
              track('setup_completed', { mode: 'parent' });
              router.replace('/parent/pin-setup');
            }}
          />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.lg, marginTop: spacing.xxl }}>
        <CircleCheck color={colors.safe} size={96} strokeWidth={2} />
        <AppText variant="headingLarge" center accessibilityRole="header">
          {t('setup.finish')}
        </AppText>
        <AppText center>{t('setup.finishBody')}</AppText>
      </View>
    </Screen>
  );
}
