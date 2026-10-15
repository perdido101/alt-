import { localeTags } from '@alt/i18n';
import { spacing } from '@alt/tokens';
import { useQuery } from '@tanstack/react-query';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, House, KeyRound, Mic } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

async function pendingQuiz(id?: string): Promise<string | null> {
  if (id) return id;
  const { data } = await supabase.from('safe_word_quizzes').select('id').is('result', null).order('scheduled_for', { ascending: false }).limit(1);
  return (data as Array<{ id: string }> | null)?.[0]?.id ?? null;
}

/** "Ποια είναι η λέξη μας;" A gentle memory game. A wrong answer is never a failure. */
export default function Quiz() {
  const { quizId } = useLocalSearchParams<{ quizId?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const quiz = useQuery({ queryKey: ['quiz', quizId], queryFn: () => pendingQuiz(quizId) });
  const [word, setWord] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  useSpeechRecognitionEvent('result', (e) => setWord(e.results[0]?.transcript ?? ''));
  useSpeechRecognitionEvent('end', () => setListening(false));

  const answer = async (value: string | null) => {
    if (!quiz.data) return router.replace('/parent/home');
    setBusy(true);
    const { data } = await supabase.rpc('answer_quiz', { p_quiz: quiz.data, p_word: value });
    setBusy(false);
    if (value === null) return router.replace('/parent/home');
    setResult(data === 'correct' ? 'correct' : 'wrong');
  };

  const listen = async () => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return;
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: localeTags[locale], interimResults: true, continuous: false });
  };

  const home = <BigButton icon={House} size="lg" label={t('common.home')} onPress={() => router.replace('/parent/home')} />;

  if (result === 'correct') {
    return (
      <Screen footer={home}>
        <CircleCheck color={colors.safe} size={64} />
        <AppText variant="headingLarge" accessibilityRole="header">{t('quiz.correctTitle')}</AppText>
        <AppText variant="tileTitle">{t('quiz.correctBody')}</AppText>
      </Screen>
    );
  }
  if (result === 'wrong') {
    return (
      <Screen footer={<><BigButton size="lg" label={t('quiz.tryAgain')} onPress={() => { setWord(''); setResult(null); }} /><BigButton variant="plain" label={t('quiz.later')} onPress={() => router.replace('/parent/home')} /></>}>
        <AppText variant="headingLarge" accessibilityRole="header">{t('quiz.wrongTitle')}</AppText>
        <AppText variant="tileTitle">{t('quiz.wrongBody')}</AppText>
      </Screen>
    );
  }
  if (quiz.isSuccess && !quiz.data) {
    return (
      <Screen footer={home}>
        <AppText variant="heading">{t('quiz.none')}</AppText>
      </Screen>
    );
  }
  return (
    <Screen
      footer={
        <>
          <BigButton size="lg" label={t('quiz.check')} onPress={() => void answer(word)} loading={busy} disabled={!word.trim()} />
          <BigButton variant="plain" label={t('quiz.later')} onPress={() => void answer(null)} disabled={busy} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <KeyRound color={colors.primary} size={40} />
        <AppText variant="headingLarge" accessibilityRole="header" style={{ flexShrink: 1 }}>{t('quiz.title')}</AppText>
      </View>
      <AppText>{t('quiz.body')}</AppText>
      <TextField label={t('quiz.wordLabel')} value={word} onChangeText={setWord} autoCorrect={false} autoComplete="off" />
      <BigButton icon={Mic} variant="outline" label={listening ? t('voice.stop') : t('quiz.say')} onPress={() => (listening ? ExpoSpeechRecognitionModule.stop() : void listen())} />
      <Card tone="calm">
        <AppText variant="small">{t('setup.safeWord.hint')}</AppText>
      </Card>
    </Screen>
  );
}
