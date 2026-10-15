import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { House, ImageIcon, Mic, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, View } from 'react-native';
import { radii } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Checking } from '@/components/Checking';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { checkErrorKey } from '@/lib/apiErrors';
import { checkImage, checkText, useCheckStore } from '@/lib/checks';
import { publicConfig } from '@/lib/server';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

type Picked = { uri: string; width: number };

/** "Δείξε μου το μήνυμα": photo/screenshot, voice, or pasted text. */
export default function CheckInput() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const config = useQuery({ queryKey: ['publicConfig'], queryFn: publicConfig, staleTime: 3_600_000 });
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets[0];
    if (asset) setPhoto({ uri: asset.uri, width: asset.width });
  };

  const choosePhoto = () =>
    Alert.alert(t('check.photo'), undefined, [
      { text: t('check.takePhoto'), onPress: () => void pick('camera') },
      { text: t('check.pickPhoto'), onPress: () => void pick('library') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = photo ? await checkImage(photo.uri, photo.width, locale, text.trim()) : await checkText(text.trim(), locale);
      useCheckStore.getState().set(result);
      setText('');
      setPhoto(null);
      router.replace('/parent/verdict');
    } catch (e) {
      setError(t(checkErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <Checking />;

  return (
    <Screen footer={<BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('check.title')}
      </AppText>
      {photo ? (
        <Card>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 220, borderRadius: radii.sm }} resizeMode="contain" accessibilityIgnoresInvertColors />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="bodyStrong">{t('check.photoSelected')}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={t('check.removePhoto')} onPress={() => setPhoto(null)} style={{ minWidth: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}>
              <X color={colors.textSoft} size={28} />
            </Pressable>
          </View>
        </Card>
      ) : (
        <BigButton icon={ImageIcon} size="lg" align="left" label={t('check.photo')} sub={t('check.photoSub')} onPress={choosePhoto} />
      )}
      <BigButton icon={Mic} size="lg" align="left" variant="outline" label={t('check.voice')} sub={t('check.voiceSub')} onPress={() => router.push('/parent/check/voice')} />
      <TextField label={t('check.pasteLabel')} value={text} onChangeText={setText} multiline numberOfLines={4} textAlignVertical="top" error={error} />
      <BigButton icon={Send} size="lg" label={t('check.submit')} onPress={() => void submit()} disabled={!photo && !text.trim()} />
      {config.data?.viber ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/parent/link-chat')} style={{ minHeight: 56, justifyContent: 'center' }}>
          <AppText color={colors.primary} style={{ textDecorationLine: 'underline' }}>
            {t('check.viberTip')}
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}
