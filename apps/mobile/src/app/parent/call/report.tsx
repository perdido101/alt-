import { normalisePhone, type OfficialCategory } from '@alt/core';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, House } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { errorKey } from '@/lib/errors';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

/** Report a number. Reports go to moderation; reputation is computed server-side and synced to phones. */
export default function ReportNumber() {
  const params = useLocalSearchParams<{ numberKey?: string; category?: OfficialCategory }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const [number, setNumber] = useState(params.numberKey ? (normalisePhone(params.numberKey).display ?? params.numberKey) : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const key = normalisePhone(number).key;
    if (!key || !/^(\+[1-9]\d{6,14}|1\d{2,4})$/.test(key)) return setError(t('errors.phoneInvalid'));
    setBusy(true);
    const { data: user } = await supabase.auth.getUser();
    const { error: err } = await supabase.from('number_reports').insert({
      number_key: key,
      reporter_id: user.user?.id,
      circle_id: circleId,
      claimed_category: params.category ?? null,
      note: note.trim() || null,
    });
    setBusy(false);
    if (err) return setError(t(errorKey(err)));
    setDone(true);
  };

  const home = <BigButton icon={House} size={done ? 'lg' : 'md'} variant={done ? 'primary' : 'plain'} label={t('common.home')} onPress={() => router.replace('/parent/home')} />;
  if (done) {
    return (
      <Screen footer={home}>
        <CircleCheck color={colors.safe} size={56} />
        <AppText variant="heading" accessibilityRole="header">{t('call.reportThanks')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen footer={home}>
      <AppText variant="heading" accessibilityRole="header">{t('call.reportTitle')}</AppText>
      <TextField label={t('call.reportNumberLabel')} value={number} onChangeText={setNumber} keyboardType="phone-pad" error={error} />
      <TextField label={t('call.reportNoteLabel')} value={note} onChangeText={setNote} multiline maxLength={500} />
      <BigButton size="lg" label={t('call.reportSend')} onPress={() => void send()} loading={busy} disabled={!number.trim()} />
    </Screen>
  );
}
