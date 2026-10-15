import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BellRing, Phone, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { ParentCard } from '@/components/ParentCard';
import { Wordmark } from '@/components/Wordmark';
import { openAlerts } from '@/lib/alerts';
import { callNumber } from '@/lib/family';
import { useParentStatuses } from '@/lib/parentStatus';
import { useCircleMembers } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/** Milestone 1: one card per parent with join status. Alerts, call protection and quizzes arrive later. */
export default function GuardianHome() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const members = useCircleMembers();
  const circleId = useAppStore((s) => s.circleId);
  const alerts = useQuery({ queryKey: ['openAlerts', circleId], queryFn: () => openAlerts(circleId!), enabled: !!circleId, refetchInterval: 15_000 });
  const parents = (members.data ?? []).filter((m) => m.role === 'protected');
  const statuses = useParentStatuses(parents.map((p) => p.userId));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={members.isRefetching} onRefresh={() => void members.refetch()} />}
      >
        <Wordmark size={24} />
        {(alerts.data ?? []).map((a) => {
          const p = parents.find((x) => x.userId === a.protected_user_id);
          return (
            <View key={a.id} accessibilityRole="alert" style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger, borderWidth: 3, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <BellRing color={colors.dangerText} size={28} />
                <AppText variant="gHeading" color={colors.dangerText} style={{ flexShrink: 1 }}>
                  {t('guardianAlert.banner', { name: p?.displayName ?? '' })}
                </AppText>
              </View>
              {p?.phone ? (
                <BigButton icon={Phone} variant="ember" label={t('guardianAlert.callParent', { name: p.displayName })} onPress={() => callNumber(p.phone!)} />
              ) : null}
              <BigButton variant="calm" label={t('guardianAlert.title')} onPress={() => router.push({ pathname: '/guardian/alert/[id]', params: { id: a.id } })} />
            </View>
          );
        })}
        {parents.map((p) => (
          <ParentCard key={p.userId} member={p} status={statuses.data?.find((x) => x.userId === p.userId)} />
        ))}
        {members.isSuccess && parents.length === 0 && (
          <Card tone="calm">
            <AppText variant="gTitle">{t('guardian.home.noParents')}</AppText>
            <AppText variant="gBody">{t('guardian.home.startSetupBody')}</AppText>
            <BigButton
              icon={UserPlus}
              label={t('guardian.home.inviteParent')}
              onPress={() => router.push({ pathname: '/guardian/invite', params: { role: 'protected' } })}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
