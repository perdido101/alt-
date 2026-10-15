import { router } from 'expo-router';
import { QrCode, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/theme/ThemeProvider';

export default function Welcome() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Screen
      footer={
        <AppText variant="small" color={colors.textSoft} center>
          {t('brand.neverAsks')}
        </AppText>
      }
    >
      <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
        <Wordmark size={44} />
        <AppText variant="bodyStrong" color={colors.primary}>
          {t('brand.tagline')}
        </AppText>
      </View>
      <AppText variant="heading" accessibilityRole="header">
        {t('welcome.title')}
      </AppText>
      <AppText>{t('welcome.subtitle')}</AppText>
      <BigButton
        testID="welcome-parent"
        icon={QrCode}
        size="lg"
        align="left"
        label={t('welcome.parentCta')}
        sub={t('welcome.parentCtaSub')}
        onPress={() => router.push('/join')}
      />
      <BigButton
        testID="welcome-guardian"
        icon={ShieldCheck}
        size="lg"
        align="left"
        variant="outline"
        label={t('welcome.guardianCta')}
        sub={t('welcome.guardianCtaSub')}
        onPress={() => router.push('/guardian/sign-in')}
      />
    </Screen>
  );
}
