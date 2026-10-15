import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { SetupFrame } from '@/components/SetupFrame';
import { useAppStore } from '@/lib/store';

/** Step 5: test call. STUB until milestone 4. */
export default function SetupTest() {
  const { t } = useTranslation();
  return (
    <SetupFrame
      step={5}
      title={t('setup.test.title')}
      actions={
        <BigButton
          testID="setup-continue"
          label={t('common.continue')}
          onPress={() => {
            useAppStore.getState().completeSetupStep('test');
            router.push('/parent/setup/done');
          }}
        />
      }
    >
      <Card tone="calm">
        <AppText>{t('setup.test.body')}</AppText>
      </Card>
    </SetupFrame>
  );
}
