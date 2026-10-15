import { SafeWordInput } from '@alt/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { SetupFrame } from '@/components/SetupFrame';
import { TextField } from '@/components/TextField';
import { setSafeWord } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useSafeWordStatus } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/** Step 4: the family safe word, chosen together. Only a salted hash is stored (server side). */
export default function SetupSafeWord() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const status = useSafeWordStatus();
  const [word, setWord] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ word?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);

  const next = () => {
    useAppStore.getState().completeSetupStep('safe-word');
    router.push('/parent/setup/test-call');
  };

  const save = async () => {
    if (!circleId) return;
    const parsed = SafeWordInput.safeParse({ word, confirm });
    if (!parsed.success) {
      const e: { word?: string; confirm?: string } = {};
      for (const issue of parsed.error.issues) e[issue.path[0] as 'word' | 'confirm'] = t(issue.message);
      setErrors(e);
      return;
    }
    setBusy(true);
    try {
      await setSafeWord(circleId, word);
      setWord('');
      setConfirm('');
      next();
    } catch (e) {
      setErrors({ word: t(errorKey(e)) });
    } finally {
      setBusy(false);
    }
  };

  const alreadySet = status.data?.isSet === true;

  return (
    <SetupFrame
      step={4}
      title={t('setup.safeWord.title')}
      actions={
        alreadySet ? (
          <BigButton testID="setup-continue" label={t('common.continue')} onPress={next} />
        ) : (
          <BigButton testID="setup-save-word" label={t('common.save')} onPress={() => void save()} loading={busy} disabled={!word || !confirm} />
        )
      }
    >
      <AppText>{t('setup.safeWord.body')}</AppText>
      <Card tone="calm">
        <AppText variant="bodyStrong">{t('setup.safeWord.guidance')}</AppText>
      </Card>
      {alreadySet ? (
        <AppText>{t('setup.safeWord.saved')}</AppText>
      ) : (
        <>
          <TextField
            label={t('setup.safeWord.wordLabel')}
            value={word}
            onChangeText={(v) => {
              setWord(v);
              setErrors({});
            }}
            autoCorrect={false}
            autoComplete="off"
            error={errors.word}
          />
          <TextField
            label={t('setup.safeWord.confirmLabel')}
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              setErrors({});
            }}
            autoCorrect={false}
            autoComplete="off"
            error={errors.confirm}
          />
          <AppText variant="small" color={colors.textSoft}>
            {t('setup.safeWord.hint')}
          </AppText>
        </>
      )}
    </SetupFrame>
  );
}
