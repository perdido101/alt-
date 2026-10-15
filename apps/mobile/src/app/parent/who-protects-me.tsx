import { router } from 'expo-router';
import { House } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { GuardianList } from '@/components/GuardianList';
import { Screen } from '@/components/Screen';

/** "Ποιος με προστατεύει": the consent text and the guardians, available any time from home. */
export default function WhoProtectsMe() {
  const { t } = useTranslation();
  return (
    <Screen footer={<BigButton icon={House} label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('consent.whoProtectsMe')}
      </AppText>
      <AppText variant="bodyStrong">{t('consent.whoProtectsMeBody')}</AppText>
      <GuardianList />
      <AppText>{t('consent.body')}</AppText>
      <AppText>{t('consent.detail')}</AppText>
    </Screen>
  );
}
