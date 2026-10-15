import { router } from 'expo-router';
import { House } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';

/**
 * STUB: placeholder for the message check (milestone 2), family alert (milestone 3) and
 * after-call check-in (milestone 4). Remove once those flows exist.
 */
export default function ComingSoon() {
  const { t } = useTranslation();
  return (
    <Screen footer={<BigButton icon={House} size="lg" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('common.comingSoon')}
      </AppText>
      <Card tone="calm">
        <AppText>{t('setup.test.body')}</AppText>
      </Card>
    </Screen>
  );
}
