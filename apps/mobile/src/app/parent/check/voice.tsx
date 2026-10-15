import { localeTags } from '@alt/i18n';
import { radii, spacing } from '@alt/tokens';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { router } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { House, Mic, Square } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Checking } from '@/components/Checking';
import { Screen } from '@/components/Screen';
import { checkErrorKey } from '@/lib/apiErrors';
import { checkAudio, checkText, useCheckStore } from '@/lib/checks';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Voice note. On-device speech recognition gives a live transcript ("Αυτό που άκουσα"). If the phone
 * has no recogniser, we record audio instead and the server transcribes it.
 */
export default function VoiceNote() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Decided once on mount: on-device speech recognition when available, otherwise record audio.
  const [mode] = useState<'speech' | 'audio'>(() => (ExpoSpeechRecognitionModule.isRecognitionAvailable() ? 'speech' : 'audio'));
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  const startTimer = () => {
    setSeconds(0);
    setListening(true);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    setListening(false);
    if (timer.current) clearInterval(timer.current);
  };

  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    if (e.isFinal) {
      setFinalText((prev) => `${prev} ${text}`.trim());
      setInterim('');
    } else setInterim(text);
  });
  useSpeechRecognitionEvent('audioend', (e) => {
    if (e.uri) setAudioUri(e.uri);
  });
  useSpeechRecognitionEvent('end', () => stopTimer());
  useSpeechRecognitionEvent('error', (e) => {
    stopTimer();
    if (e.error === 'not-allowed') setError(t('voice.micPermission'));
  });

  const start = async () => {
    setError(null);
    setFinalText('');
    setInterim('');
    setAudioUri(null);
    if (mode === 'speech') {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return setError(t('voice.micPermission'));
      ExpoSpeechRecognitionModule.start({
        lang: localeTags[locale],
        interimResults: true,
        continuous: true,
        recordingOptions: { persist: ExpoSpeechRecognitionModule.supportsRecording() },
      });
    } else {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return setError(t('voice.micPermission'));
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
    startTimer();
  };

  const stop = async () => {
    if (mode === 'speech') ExpoSpeechRecognitionModule.stop();
    else {
      await recorder.stop();
      setAudioUri(recorder.uri);
    }
    stopTimer();
  };

  const transcript = `${finalText} ${interim}`.trim();

  const submit = async () => {
    if (listening) await stop();
    setBusy(true);
    try {
      const result = transcript ? await checkText(transcript, locale, 'voice') : audioUri ? await checkAudio(audioUri, locale) : null;
      if (!result) return setBusy(false);
      useCheckStore.getState().set(result);
      router.replace('/parent/verdict');
    } catch (e) {
      setError(t(checkErrorKey(e)));
      setBusy(false);
    }
  };

  if (busy) return <Checking />;

  return (
    <Screen footer={<BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('voice.title')}
      </AppText>
      <AppText>{t('voice.body')}</AppText>
      {mode === 'audio' && <AppText variant="small" color={colors.textSoft}>{t('voice.notAvailable')}</AppText>}

      <View style={{ alignItems: 'center', gap: spacing.md, marginVertical: spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? t('voice.stop') : t('voice.start')}
          onPress={() => void (listening ? stop() : start())}
          style={({ pressed }) => ({
            width: 140,
            height: 140,
            borderRadius: radii.pill,
            backgroundColor: listening ? colors.danger : pressed ? colors.primaryPressed : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {listening ? <Square color={colors.onPrimary} size={52} fill={colors.onPrimary} /> : <Mic color={colors.onPrimary} size={64} />}
        </Pressable>
        <AppText variant="bodyStrong" accessibilityLiveRegion="polite">
          {listening ? t('voice.listening', { time: mmss(seconds) }) : t('voice.start')}
        </AppText>
      </View>

      {mode === 'speech' && (
        <Card tone="calm">
          <AppText variant="bodyStrong">{t('voice.heard')}</AppText>
          <AppText accessibilityLiveRegion="polite">{transcript || '…'}</AppText>
        </Card>
      )}
      {error ? <AppText color={colors.dangerText} accessibilityRole="alert">{error}</AppText> : null}
      <BigButton size="lg" label={t('voice.done')} onPress={() => void submit()} disabled={!transcript && !audioUri && !listening} />
    </Screen>
  );
}
