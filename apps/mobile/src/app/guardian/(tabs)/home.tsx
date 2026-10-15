import { router } from 'expo-router';
import { ShieldCheck, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Wordmark } from '@/components/Wordmark';
import { useCircleMembers } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';

/** Milestone 1: one card per parent with join status. Alerts, call protection and quizzes arrive later. */
export default function GuardianHome() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const members = useCircleMembers();
  const parents = (members.data ?? []).filter((m) => m.role === 'protected');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={members.isRefetching} onRefresh={() => void members.refetch()} />}
      >
        <Wordmark size={24} />
        {parents.map((p) => (
          <Card key={p.userId}>
            <AppText variant="gHeading">{p.displayName}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <ShieldCheck color={colors.safe} size={20} />
              <AppText variant="gTitle" color={colors.safeText}>
                {p.consentedAt ? t('guardian.home.protected') : t('guardian.home.notJoined')}
              </AppText>
            </View>
          </Card>
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
