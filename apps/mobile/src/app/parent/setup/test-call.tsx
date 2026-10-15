import { useEvent } from 'expo';
import { router } from 'expo-router';
import { PhoneIncoming } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';
import { spacing } from '@alt/tokens';
import { CallShield } from '../../../../modules/call-shield';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { SetupFrame } from '@/components/SetupFrame';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/** Listens for the native screening event while the guardian places the test call. */
function TestCallStatus({ shield }: { shield: NonNullable<typeof CallShield> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const event = useEvent(shield, 'onCallScreened');
  if (event && event.classification !== 'family') {
    return (
      <Card tone="calm">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <PhoneIncoming color={colors.safe} size={32} />
          <AppText variant="tileTitle" style={{ flexShrink: 1 }} accessibilityLiveRegion="polite">
            {t('setup.test.seen')}
          </AppText>
        </View>
      </Card>
    );
  }
  return (
    <Card>
      <AppText>{t('setup.test.instructions')}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ActivityIndicator color={colors.primary} />
        <AppText variant="bodyStrong">{t('setup.test.waiting')}</AppText>
      </View>
    </Card>
  );
}

/** Step 5: the guardian calls from a non-family number and both see the warning. */
export default function SetupTestCall() {
  const { t } = useTranslation();
  const shield = Platform.OS === 'android' ? CallShield : null;
  const finish = () => {
    useAppStore.getState().completeSetupStep('test');
    router.push('/parent/setup/done');
  };
  return (
    <SetupFrame
      step={5}
      title={t('setup.test.title')}
      actions={
        <>
          <BigButton testID="setup-continue" label={shield ? t('setup.test.yes') : t('common.continue')} onPress={finish} />
          {shield ? <BigButton variant="plain" label={t('setup.test.later')} onPress={finish} /> : null}
        </>
      }
    >
      {shield ? <TestCallStatus shield={shield} /> : <AppText>{t('setup.test.iosBody')}</AppText>}
    </SetupFrame>
  );
}
