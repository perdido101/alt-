import { parseInviteToken } from '@alt/core';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { radii, spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/ThemeProvider';

export default function Join() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  const go = (raw: string) => {
    const token = parseInviteToken(raw);
    if (!token) {
      setError(t('errors.inviteInvalid'));
      return;
    }
    if (handled.current) return;
    handled.current = true;
    router.replace({ pathname: '/join/[token]', params: { token } });
  };

  return (
    <Screen>
      <AppText variant="heading" accessibilityRole="header">
        {t('join.title')}
      </AppText>
      <AppText>{t('join.scanBody')}</AppText>
      {permission?.granted ? (
        <View style={{ height: 300, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 3, borderColor: colors.primary }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => go(data)}
            accessibilityLabel={t('join.scan')}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="small" color={colors.textSoft}>
            {t('join.cameraPermission')}
          </AppText>
          <BigButton icon={Camera} label={t('join.allowCamera')} onPress={() => void requestPermission()} />
        </View>
      )}
      <TextField
        label={t('join.pasteLabel')}
        value={pasted}
        onChangeText={(v) => {
          setPasted(v);
          setError(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
      />
      <BigButton variant="outline" label={t('join.join')} onPress={() => go(pasted)} disabled={!pasted.trim()} />
    </Screen>
  );
}
