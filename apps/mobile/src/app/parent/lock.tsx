import { router } from 'expo-router';
import { HandCoins } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { verifyPin } from '@/lib/pin';
import { useTheme } from '@/theme/ThemeProvider';

/** PIN lock. The family-alert button works without the PIN: asking for help is never locked. */
export default function Lock() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const onChange = (v: string) => {
    setMessage(null);
    setValue(v);
    if (v.length < 4) return;
    void verifyPin(v).then((r) => {
      if (r === 'ok') return router.canGoBack() ? router.back() : router.replace('/parent/home');
      setMessage(r === 'locked' ? t('parent.pin.lockedOut') : t('parent.pin.wrong'));
      setValue('');
    });
  };

  return (
    <Screen
      footer={
        <BigButton
          icon={HandCoins}
          variant="ember"
          size="lg"
          align="left"
          label={t('parent.home.askingMoney')}
          sub={t('parent.home.askingMoneySub')}
          onPress={() => router.push({ pathname: '/parent/alert/confirm', params: { source: 'button' } })}
        />
      }
    >
      <Wordmark />
      <AppText variant="heading" accessibilityRole="header">{t('parent.pin.title')}</AppText>
      {message ? <AppText color={colors.dangerText} accessibilityRole="alert">{message}</AppText> : null}
      <PinPad value={value} onChange={onChange} />
      <AppText variant="small" color={colors.textSoft}>{t('parent.pin.forgot')}</AppText>
    </Screen>
  );
}
