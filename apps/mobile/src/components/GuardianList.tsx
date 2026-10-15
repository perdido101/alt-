import { UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { useCircleMembers } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Card } from './Card';

/** The people who can see the parent's checks and alerts. */
export function GuardianList() {
  const { colors } = useTheme();
  const members = useCircleMembers();
  const guardians = (members.data ?? []).filter((m) => m.role === 'guardian');
  return (
    <Card tone="calm">
      {guardians.map((g) => (
        <View key={g.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
          <UserRound color={colors.primary} size={28} />
          <AppText variant="bodyStrong">{g.displayName}</AppText>
        </View>
      ))}
    </Card>
  );
}
