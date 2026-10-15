import type { AlertSource } from '@alt/core';
import { router, useLocalSearchParams } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { triggerAlert } from '@/lib/alerts';
import { useTheme } from '@/theme/ThemeProvider';

/** The one confirmation in parent mode: right before alerting the family (prevents accidental taps). */
export default function ConfirmAlert() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ source?: AlertSource; checkId?: string; callEventId?: string; callerNumber?: string }>();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const { alertId } = await triggerAlert({
        source: params.source ?? 'button',
        checkId: params.checkId,
        callEventId: params.callEventId,
        callerNumber: params.callerNumber,
      });
      router.replace({ pathname: '/parent/alert/[id]', params: { id: alertId } });
    } catch {
      router.replace({ pathname: '/parent/alert/[id]', params: { id: 'failed' } });
    }
  };

  return (
    <Screen
      footer={
        <>
          <BigButton testID="alert-confirm" icon={BellRing} variant="ember" size="hero" label={t('alert.confirmYes')} onPress={() => void send()} loading={busy} />
          <BigButton variant="outline" size="lg" label={t('alert.confirmNo')} onPress={() => router.back()} disabled={busy} />
        </>
      }
    >
      <AppText variant="headingLarge" accessibilityRole="header">
        {t('alert.confirmTitle')}
      </AppText>
      <AppText variant="tileTitle" color={colors.textSoft}>
        {busy ? t('alert.sending') : t('alert.confirmBody')}
      </AppText>
    </Screen>
  );
}
