import { normalisePhone } from '@alt/core';
import { spacing } from '@alt/tokens';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { House } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { manualCall, recordAnswer, screenedCall, type CallInfo } from '@/lib/callFlow';

/**
 * "Μόλις μίλησες με…": the after-call check-in. Opened from the native notification (localId) or
 * from the home button "Μόλις μου τηλεφώνησαν" (manual, also on iOS).
 */
export default function AfterCall() {
  const { localId } = useLocalSearchParams<{ localId?: string }>();
  const { t } = useTranslation();
  const screened = useQuery({ queryKey: ['screenedCall', localId], queryFn: () => screenedCall(localId!), enabled: !!localId });
  const [number, setNumber] = useState('');
  const [answeredNo, setAnsweredNo] = useState(false);
  const [busy, setBusy] = useState(false);

  const call = async (): Promise<CallInfo> => screened.data ?? (await manualCall(number));

  const answer = async (value: 'yes' | 'no' | 'unsure') => {
    setBusy(true);
    try {
      const info = await call();
      await recordAnswer(info.callEventId, { checkin_answer: value });
      if (value === 'no') setAnsweredNo(true);
      else if (value === 'yes') router.replace({ pathname: '/parent/call/who', params: { callEventId: info.callEventId, ...(info.numberKey ? { numberKey: info.numberKey } : {}) } });
      else router.replace('/parent/check/voice');
    } finally {
      setBusy(false);
    }
  };

  const home = <BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />;

  if (answeredNo) {
    return (
      <Screen footer={<BigButton icon={House} size="lg" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
        <AppText variant="headingLarge" accessibilityRole="header">{t('call.noTitle')}</AppText>
        <AppText variant="tileTitle">{t('call.noBody')}</AppText>
      </Screen>
    );
  }

  const who = screened.data?.numberKey ? (normalisePhone(screened.data.numberKey).display ?? screened.data.numberKey) : t('callShield.hiddenWho');
  return (
    <Screen footer={home}>
      <AppText variant="heading" accessibilityRole="header">
        {localId ? t('call.afterTitle', { who }) : t('call.manualTitle')}
      </AppText>
      {!localId ? <TextField label={t('call.numberLabel')} value={number} onChangeText={setNumber} keyboardType="phone-pad" /> : null}
      <Card tone="calm">
        <AppText variant="tileTitle">{t('call.question')}</AppText>
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <BigButton testID="call-yes" style={{ flex: 1 }} size="hero" variant="primary" label={t('call.yes')} onPress={() => void answer('yes')} disabled={busy} />
        <BigButton testID="call-no" style={{ flex: 1 }} size="hero" variant="outline" label={t('call.no')} onPress={() => void answer('no')} disabled={busy} />
      </View>
      <BigButton variant="calm" label={t('call.unsure')} onPress={() => void answer('unsure')} disabled={busy} />
    </Screen>
  );
}
