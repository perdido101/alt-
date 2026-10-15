import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { TimelineRow } from '@/components/TimelineRow';
import { useCircleMembers } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { circleTimeline } from '@/lib/timeline';
import { useTheme } from '@/theme/ThemeProvider';

/** Per-circle timeline: flagged calls, checks with verdicts, alerts, quizzes. */
export default function GuardianHistory() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const members = useCircleMembers();
  const timeline = useQuery({ queryKey: ['timeline', circleId], queryFn: () => circleTimeline(circleId!), enabled: !!circleId });
  const names = new Map((members.data ?? []).map((m) => [m.userId, m.displayName]));
  const many = (members.data ?? []).filter((m) => m.role === 'protected').length > 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={timeline.isRefetching} onRefresh={() => void timeline.refetch()} />}
      >
        <AppText variant="gHeading" accessibilityRole="header">
          {t('guardian.nav.history')}
        </AppText>
        {timeline.data?.length ? (
          <Card>
            {timeline.data.map((item) => (
              <TimelineRow key={`${item.kind}-${item.id}`} item={item} who={many ? names.get(item.userId) : undefined} />
            ))}
          </Card>
        ) : (
          <Card tone="calm">
            <AppText variant="gBody">{t('guardian.history.empty')}</AppText>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
