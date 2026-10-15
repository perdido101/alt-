import { router, useLocalSearchParams } from 'expo-router';
import { House, KeyRound, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { CallAlertButton } from '@/components/CallAlertButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { callNumber } from '@/lib/family';
import { useFamilyContacts } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';

/** "Συγγενής": remind them to ask for the safe word, and one-tap calls to the real family. */
export default function RelativeCall() {
  const { callEventId, numberKey } = useLocalSearchParams<{ callEventId: string; numberKey?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const contacts = useFamilyContacts();
  return (
    <Screen footer={<BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <KeyRound color={colors.primary} size={40} />
        <AppText variant="headingLarge" accessibilityRole="header">{t('call.relativeTitle')}</AppText>
      </View>
      <AppText variant="tileTitle">{t('call.relativeBody')}</AppText>
      <Card tone="calm">
        <AppText variant="bodyStrong">{t('call.callFamily')}</AppText>
        {(contacts.data ?? [])
          .filter((c) => !c.isBackup || c.isGuardian)
          .map((c) => (
            <BigButton key={c.id} icon={Phone} align="left" variant="outline" label={c.name} sub={t(`relations.${c.relation}`)} onPress={() => callNumber(c.phone)} />
          ))}
      </Card>
      <CallAlertButton callEventId={callEventId} numberKey={numberKey} />
    </Screen>
  );
}
