import { CreateCircleInput } from '@alt/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { createCircle } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

export default function CreateCircle() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [yourName, setYourName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = CreateCircleInput.safeParse({ name, displayName: yourName });
    if (!parsed.success) return;
    setBusy(true);
    try {
      const circleId = await createCircle(parsed.data.name, parsed.data.displayName);
      useAppStore.getState().setMembership({ mode: 'guardian', circleId, role: 'guardian', displayName: parsed.data.displayName });
      router.replace({ pathname: '/guardian/invite', params: { role: 'protected' } });
    } catch (e) {
      setError(t(errorKey(e)));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('circle.createTitle')}
      </AppText>
      <AppText variant="gBody" color={colors.textSoft}>
        {t('circle.createSubtitle')}
      </AppText>
      <TextField label={t('circle.nameLabel')} placeholder={t('circle.namePlaceholder')} value={name} onChangeText={setName} />
      <TextField label={t('circle.yourNameLabel')} value={yourName} onChangeText={setYourName} autoComplete="given-name" error={error} />
      <BigButton label={t('circle.create')} onPress={() => void submit()} loading={busy} disabled={!name.trim() || !yourName.trim()} />
    </Screen>
  );
}
