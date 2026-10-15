import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { SetupFrame } from '@/components/SetupFrame';
import { useAppStore } from '@/lib/store';

/** Step 2: call protection. STUB until milestone 4 (CallScreeningService role + permissions). */
export default function SetupCalls() {
  const { t } = useTranslation();
  return (
    <SetupFrame
      step={2}
      title={t('setup.calls.title')}
      actions={
        <BigButton
          testID="setup-continue"
          label={t('common.continue')}
          onPress={() => {
            useAppStore.getState().completeSetupStep('calls');
            router.push('/parent/setup/family');
          }}
        />
      }
    >
      <Card tone="calm">
        <AppText>{t('setup.calls.body')}</AppText>
      </Card>
    </SetupFrame>
  );
}
