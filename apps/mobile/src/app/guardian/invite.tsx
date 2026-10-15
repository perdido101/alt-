import { buildInviteUrl, INVITE_TTL_HOURS, type MemberRole } from '@alt/core';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { palette, spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { createInvite } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

const webUrl = (Constants.expoConfig?.extra?.webUrl as string | undefined) ?? 'https://alt.example';

export default function Invite() {
  const { role: roleParam } = useLocalSearchParams<{ role?: MemberRole }>();
  const role: MemberRole = roleParam === 'guardian' ? 'guardian' : 'protected';
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const [inviteeName, setInviteeName] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!circleId) return;
    setBusy(true);
    setError(null);
    try {
      const invite = await createInvite(circleId, role, role === 'protected' ? inviteeName.trim() : undefined);
      setUrl(buildInviteUrl(invite.token, webUrl));
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={<BigButton variant="plain" label={t('common.continue')} onPress={() => router.replace('/guardian/home')} />}
    >
      <AppText variant="gHeading" accessibilityRole="header">
        {role === 'protected' ? t('invite.parentTitle') : t('invite.guardianTitle')}
      </AppText>
      <AppText variant="gBody" color={colors.textSoft}>
        {role === 'protected' ? t('invite.parentBody') : t('invite.guardianBody')}
      </AppText>

      {!url ? (
        <>
          {role === 'protected' && (
            <TextField
              label={t('invite.parentNameLabel')}
              placeholder={t('invite.parentNamePlaceholder')}
              value={inviteeName}
              onChangeText={setInviteeName}
              error={error}
            />
          )}
          {role === 'guardian' && error ? <AppText color={colors.dangerText}>{error}</AppText> : null}
          <BigButton
            label={role === 'protected' ? t('invite.createParent') : t('invite.createGuardian')}
            onPress={() => void create()}
            loading={busy}
            disabled={role === 'protected' && !inviteeName.trim()}
          />
        </>
      ) : (
        <>
          <Card style={{ alignItems: 'center', gap: spacing.md }}>
            <View accessible accessibilityRole="image" accessibilityLabel={t('invite.qrLabel')} style={{ padding: spacing.md, backgroundColor: palette.white }}>
              <QRCode value={url} size={240} color={palette.ink} backgroundColor={palette.white} ecl="M" />
            </View>
            <AppText variant="gBody" color={colors.textSoft}>
              {t('invite.expires', { hours: INVITE_TTL_HOURS })}
            </AppText>
          </Card>
          <BigButton
            icon={Share2}
            variant="outline"
            label={t('invite.share')}
            onPress={() => void Share.share({ message: t('invite.shareMessage', { url }) })}
          />
          {role === 'protected' && (
            <Card tone="calm">
              <AppText variant="gTitle">{t('guardian.home.startSetup')}</AppText>
              <AppText variant="gBody">{t('guardian.home.startSetupBody')}</AppText>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
