import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, House, MessageSquareText, Phone, ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { alertDetail } from '@/lib/alerts';
import { callNumber, firstGuardian } from '@/lib/family';
import { useCircleMembers, useFamilyContacts } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';

/** Holding screen after an alert: who has seen it, what not to do, and a direct call button. */
export default function AlertHolding() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const failed = id === 'failed';
  const { t } = useTranslation();
  const { colors } = useTheme();
  const members = useCircleMembers();
  const contacts = useFamilyContacts();
  const detail = useQuery({ queryKey: ['alert', id], queryFn: () => alertDetail(id), enabled: !failed, refetchInterval: 5_000 });
  const guardians = (members.data ?? []).filter((m) => m.role === 'guardian');
  const toCall = firstGuardian(contacts.data);
  const guardianPhones = (contacts.data ?? []).filter((c) => c.isGuardian).map((c) => c.phone);

  const smsFamily = () => {
    const sep = Platform.OS === 'ios' ? '&' : '?';
    void Linking.openURL(`sms:${guardianPhones.join(',')}${sep}body=${encodeURIComponent(t('alert.smsText'))}`);
  };

  return (
    <Screen
      footer={
        <>
          {toCall ? <BigButton icon={Phone} size="lg" label={t('alert.callNow', { name: toCall.name })} onPress={() => callNumber(toCall.phone)} /> : null}
          <BigButton icon={House} variant="outline" label={t('alert.backHome')} onPress={() => router.replace('/parent/home')} />
        </>
      }
    >
      {failed ? (
        <>
          <ShieldAlert color={colors.dangerText} size={56} />
          <AppText variant="headingLarge" accessibilityRole="header">{t('alert.failedTitle')}</AppText>
          <AppText variant="tileTitle">{t('alert.failedBody')}</AppText>
          {guardianPhones.length ? <BigButton icon={MessageSquareText} variant="ember" size="lg" label={t('alert.sendSms')} onPress={smsFamily} /> : null}
        </>
      ) : (
        <>
          <CircleCheck color={colors.safe} size={56} />
          <AppText variant="headingLarge" accessibilityRole="header">{t('alert.sentTitle')}</AppText>
          <AppText variant="tileTitle">{t('alert.sentBody')}</AppText>
          <Card tone="calm">
            {guardians.map((g) => {
              const seen = detail.data?.deliveries.some((d) => d.recipientUserId === g.userId && d.seenAt);
              return (
                <View key={g.userId} accessible style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, gap: spacing.sm }}>
                  <AppText variant="bodyStrong">{g.displayName}</AppText>
                  <AppText variant="bodyStrong" color={seen ? colors.safeText : colors.textSoft} accessibilityLiveRegion="polite">
                    {seen ? `✓ ${t('alert.seen')}` : t('alert.notified')}
                  </AppText>
                </View>
              );
            })}
          </Card>
        </>
      )}
      <Card>
        <AppText variant="bodyStrong">{t('alert.advice')}</AppText>
      </Card>
    </Screen>
  );
}
