import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useCircleMembers, useFamilyContacts } from '@/lib/queries';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuardianFamily() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const members = useCircleMembers();
  const contacts = useFamilyContacts();
  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('circle.members')}
      </AppText>
      <Card>
        {(members.data ?? []).map((m) => (
          <View key={m.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
            <AppText variant="gTitle">{m.displayName}</AppText>
            <AppText variant="gBody" color={colors.textSoft}>
              {m.role === 'guardian' ? t('circle.guardian') : t('circle.protected')}
            </AppText>
          </View>
        ))}
      </Card>
      <BigButton
        icon={UserPlus}
        variant="outline"
        label={t('invite.createGuardian')}
        onPress={() => router.push({ pathname: '/guardian/invite', params: { role: 'guardian' } })}
      />
      <BigButton
        icon={UserPlus}
        variant="outline"
        label={t('invite.createParent')}
        onPress={() => router.push({ pathname: '/guardian/invite', params: { role: 'protected' } })}
      />
      <AppText variant="gHeading" accessibilityRole="header">
        {t('setup.family.title')}
      </AppText>
      <Card>
        {(contacts.data ?? []).length === 0 ? (
          <AppText variant="gBody" color={colors.textSoft}>
            {t('setup.family.empty')}
          </AppText>
        ) : (
          (contacts.data ?? []).map((c) => (
            <View key={c.id} style={{ paddingVertical: spacing.xs }}>
              <AppText variant="gTitle">{c.name}</AppText>
              <AppText variant="gBody" color={colors.textSoft}>
                {`${t(`relations.${c.relation}`)} · ${c.phone}`}
              </AppText>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
