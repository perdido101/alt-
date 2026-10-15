import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { spacing } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

/** Full-screen "Το ελέγχω…" while the server analyses. */
export function Checking() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={t('check.checking')}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="heading" center>
        {t('check.checking')}
      </AppText>
      <AppText center color={colors.textSoft}>
        {t('check.checkingSub')}
      </AppText>
    </View>
  );
}
