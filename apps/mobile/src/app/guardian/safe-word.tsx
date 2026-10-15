import { SafeWordInput } from '@alt/core';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { setSafeWord } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

const FRESH_SECONDS = 9 * 60;

/** Seconds since this session last authenticated (from the access token's amr claim). */
async function authAge(): Promise<number> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return Infinity;
  try {
    const payload = JSON.parse(globalThis.atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { amr?: Array<{ timestamp: number }> };
    const last = Math.max(...(payload.amr ?? []).map((a) => a.timestamp));
    return Date.now() / 1000 - last;
  } catch {
    return Infinity;
  }
}

/** Change the family word. The server requires a sign-in within the last 10 minutes, so we re-authenticate first. */
export default function ChangeSafeWord() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const circleId = useAppStore((s) => s.circleId);
  const [fresh, setFresh] = useState<boolean | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [word, setWord] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void authAge().then((age) => setFresh(age < FRESH_SECONDS));
  }, []);

  const identity = async () => {
    const { data } = await supabase.auth.getUser();
    return { email: data.user?.email ?? null, phone: data.user?.phone ? `+${data.user.phone.replace(/^\+/, '')}` : null };
  };

  const sendCode = async () => {
    setBusy(true);
    const id = await identity();
    const { error: e } = id.email ? await supabase.auth.signInWithOtp({ email: id.email, options: { shouldCreateUser: false } }) : await supabase.auth.signInWithOtp({ phone: id.phone!, options: { shouldCreateUser: false } });
    setBusy(false);
    if (e) return setError(t('errors.generic'));
    setCodeSent(true);
  };

  const verify = async () => {
    setBusy(true);
    const id = await identity();
    const { error: e } = id.email
      ? await supabase.auth.verifyOtp({ email: id.email, token: code.trim(), type: 'email' })
      : await supabase.auth.verifyOtp({ phone: id.phone!, token: code.trim(), type: 'sms' });
    setBusy(false);
    if (e) return setError(t('errors.generic'));
    setError(null);
    setFresh(true);
  };

  const save = async () => {
    const parsed = SafeWordInput.safeParse({ word, confirm });
    if (!parsed.success) return setError(t(parsed.error.issues[0]!.message));
    setBusy(true);
    try {
      await setSafeWord(circleId!, word);
      await qc.invalidateQueries({ queryKey: ['safeWord'] });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error && e.message === 'reauth_required' ? t('guardian.settings.safeWordReauth') : t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen footer={<BigButton label={t('common.done')} onPress={() => router.back()} />}>
        <AppText variant="gHeading" color={colors.safeText}>{t('guardian.settings.wordChanged')}</AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">{t('guardian.settings.safeWordChange')}</AppText>
      <AppText variant="gBody" color={colors.textSoft}>{t('guardian.settings.safeWordHashedNote')}</AppText>
      {fresh === false ? (
        <Card>
          <AppText variant="gBody">{t('guardian.settings.safeWordReauth')}</AppText>
          {codeSent ? (
            <>
              <TextField label={t('guardian.settings.reauthCode')} value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} />
              <BigButton label={t('guardian.settings.reauthVerify')} onPress={() => void verify()} loading={busy} disabled={code.length < 6} />
            </>
          ) : (
            <BigButton label={t('guardian.settings.reauthSend')} onPress={() => void sendCode()} loading={busy} />
          )}
        </Card>
      ) : fresh ? (
        <>
          <AppText variant="gBody">{t('setup.safeWord.guidance')}</AppText>
          <TextField label={t('guardian.settings.newWord')} value={word} onChangeText={setWord} autoCorrect={false} autoComplete="off" />
          <TextField label={t('setup.safeWord.confirmLabel')} value={confirm} onChangeText={setConfirm} autoCorrect={false} autoComplete="off" />
          <BigButton label={t('common.save')} onPress={() => void save()} loading={busy} disabled={!word || !confirm} />
        </>
      ) : null}
      {error ? <AppText variant="gBody" color={colors.dangerText} accessibilityRole="alert">{error}</AppText> : null}
    </Screen>
  );
}
