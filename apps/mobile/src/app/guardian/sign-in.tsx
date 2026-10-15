import { EmailInput , normalisePhone } from '@alt/core';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Choice } from '@/components/Choice';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Wordmark } from '@/components/Wordmark';
import { finishGuardianSignIn, pendingInvite } from '@/lib/guardianAuth';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

type Method = 'email' | 'phone';

/** Passwordless sign-in: magic link (or 6-digit code) by email, or SMS code by phone. */
export default function SignIn() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const locale = useAppStore((s) => s.locale);
  const [method, setMethod] = useState<Method>('email');
  const [value, setValue] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (invite) void pendingInvite.set(invite);
  }, [invite]);

  const send = async () => {
    setError(null);
    let target: string;
    if (method === 'email') {
      const parsed = EmailInput.safeParse(value);
      if (!parsed.success) return setError(t('errors.emailInvalid'));
      target = parsed.data;
    } else {
      const e164 = normalisePhone(value).e164;
      if (!e164) return setError(t('errors.phoneInvalid'));
      target = e164;
    }
    setBusy(true);
    const options = { data: { locale }, emailRedirectTo: Linking.createURL('auth-callback') };
    const { error: err } =
      method === 'email'
        ? await supabase.auth.signInWithOtp({ email: target, options })
        : await supabase.auth.signInWithOtp({ phone: target, options: { data: { locale } } });
    setBusy(false);
    if (err) return setError(t('errors.generic'));
    setSentTo(target);
  };

  const verify = async () => {
    if (!sentTo) return;
    setBusy(true);
    const { error: err } =
      method === 'email'
        ? await supabase.auth.verifyOtp({ email: sentTo, token: code.trim(), type: 'email' })
        : await supabase.auth.verifyOtp({ phone: sentTo, token: code.trim(), type: 'sms' });
    if (err) {
      setBusy(false);
      return setError(t('errors.generic'));
    }
    router.replace(await finishGuardianSignIn());
  };

  return (
    <Screen>
      <Wordmark />
      <AppText variant="heading" accessibilityRole="header">
        {t('auth.title')}
      </AppText>
      <AppText color={colors.textSoft}>{t('auth.subtitle')}</AppText>
      {!sentTo ? (
        <>
          <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
            <Choice label={t('auth.byEmail')} selected={method === 'email'} onPress={() => setMethod('email')} />
            <Choice label={t('auth.byPhone')} selected={method === 'phone'} onPress={() => setMethod('phone')} />
          </View>
          <TextField
            label={method === 'email' ? t('auth.emailLabel') : t('auth.phoneLabel')}
            value={value}
            onChangeText={setValue}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoComplete={method === 'email' ? 'email' : 'tel'}
            autoCapitalize="none"
            error={error}
          />
          <BigButton label={t('auth.send')} onPress={() => void send()} loading={busy} disabled={!value.trim()} />
        </>
      ) : (
        <>
          <AppText>{method === 'email' ? t('auth.sentEmail', { email: sentTo }) : t('auth.sentPhone', { phone: sentTo })}</AppText>
          <TextField
            label={method === 'email' ? t('auth.otpLabelEmail') : t('auth.otpLabel')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            error={error}
          />
          <BigButton label={t('auth.verify')} onPress={() => void verify()} loading={busy} disabled={code.trim().length < 6} />
          <BigButton variant="plain" label={t('common.back')} onPress={() => setSentTo(null)} />
        </>
      )}
    </Screen>
  );
}
