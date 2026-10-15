import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { GuardianList } from '@/components/GuardianList';
import { Screen } from '@/components/Screen';
import { recordConsent } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/** The parent must see, in plain words, what the family will see, and tap to agree. */
export default function Consent() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agree = async () => {
    if (!circleId) return;
    setBusy(true);
    try {
      await recordConsent(circleId);
      useAppStore.getState().setConsented(true);
      router.replace('/parent/setup/language');
    } catch (e) {
      setError(t(errorKey(e)));
      setBusy(false);
    }
  };

  return (
    <Screen footer={<BigButton testID="consent-agree" size="lg" label={t('consent.agree')} onPress={() => void agree()} loading={busy} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('consent.title')}
      </AppText>
      <AppText variant="tileTitle">{t('consent.body')}</AppText>
      <AppText>{t('consent.detail')}</AppText>
      <AppText variant="bodyStrong">{t('consent.whoProtectsMeBody')}</AppText>
      <GuardianList />
      {error ? (
        <AppText color={colors.dangerText} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}
