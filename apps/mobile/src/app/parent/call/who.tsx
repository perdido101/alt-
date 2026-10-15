import type { OfficialCategory } from '@alt/core';
import { spacing } from '@alt/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { Building2, HeartPulse, House, Landmark, Package, ShieldHalf, UsersRound, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { CallAlertButton } from '@/components/CallAlertButton';
import { Screen } from '@/components/Screen';
import { recordAnswer } from '@/lib/callFlow';

type Choice = { key: OfficialCategory | 'relative'; icon: LucideIcon };
const CHOICES: Choice[] = [
  { key: 'police', icon: ShieldHalf },
  { key: 'health', icon: HeartPulse },
  { key: 'bank', icon: Landmark },
  { key: 'tax_social', icon: Building2 },
  { key: 'post_courier', icon: Package },
  { key: 'relative', icon: UsersRound },
];

/** "Ποιος είπε ότι είναι;" */
export default function WhoWasIt() {
  const { callEventId, numberKey } = useLocalSearchParams<{ callEventId: string; numberKey?: string }>();
  const { t } = useTranslation();

  const pick = (key: Choice['key']) => {
    if (key === 'relative') {
      void recordAnswer(callEventId, { claimed_relative: true });
      router.push({ pathname: '/parent/call/relative', params: { callEventId, ...(numberKey ? { numberKey } : {}) } });
    } else {
      void recordAnswer(callEventId, { claimed_category: key });
      router.push({ pathname: '/parent/call/official', params: { callEventId, category: key, ...(numberKey ? { numberKey } : {}) } });
    }
  };

  return (
    <Screen footer={<BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">{t('call.whoTitle')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {CHOICES.map((c) => (
          <View key={c.key} style={{ width: '48%', flexGrow: 1 }}>
            <BigButton icon={c.icon} size="lg" align="left" variant="outline" label={t(`call.who_${c.key}`)} onPress={() => pick(c.key)} />
          </View>
        ))}
      </View>
      <CallAlertButton callEventId={callEventId} numberKey={numberKey} />
    </Screen>
  );
}
