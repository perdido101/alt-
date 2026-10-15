import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { track } from '@/lib/analytics';
import { setPin } from '@/lib/pin';
import { useTheme } from '@/theme/ThemeProvider';

/** Optional: offered at the end of setup. */
export default function PinSetup() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onChange = (v: string) => {
    setError(null);
    if (v.length < 4) return setValue(v);
    setValue('');
    if (!first) return setFirst(v);
    if (v === first) {
      void setPin(v).then(() => {
        track('pin_set');
        router.replace('/parent/home');
      });
    } else {
      setError(t('parent.pin.mismatch'));
      setFirst(null);
    }
  };

  return (
    <Screen footer={<BigButton variant="plain" label={t('parent.pin.skip')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">{first ? t('parent.pin.confirm') : t('parent.pin.setTitle')}</AppText>
      <AppText>{t('parent.pin.setBody')}</AppText>
      {error ? <AppText color={colors.dangerText} accessibilityRole="alert">{error}</AppText> : null}
      <PinPad value={value} onChange={onChange} />
    </Screen>
  );
}
