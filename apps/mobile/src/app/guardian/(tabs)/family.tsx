import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable , View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
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
  const qc = useQueryClient();
  const circleId = useAppStore((s) => s.circleId);
  const remove = (userId: string, name: string) =>
    Alert.alert(t('account.removeMember'), `${name}\n\n${t('account.removeMemberBody')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: () => void supabase.from('circle_members').delete().eq('circle_id', circleId!).eq('user_id', userId).then(() => qc.invalidateQueries({ queryKey: ['members'] })),
      },
    ]);
  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('circle.members')}
      </AppText>
      <Card>
        {(members.data ?? []).map((m) => (
          <View key={m.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
            <AppText variant="gTitle">{m.displayName}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <AppText variant="gBody" color={colors.textSoft}>
                {m.role === 'guardian' ? t('circle.guardian') : t('circle.protected')}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('account.removeMember')}: ${m.displayName}`}
                accessibilityHint={t('account.removeMemberBody')}
                onPress={() => remove(m.userId, m.displayName)}
                style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
              >
                <AppText variant="gBody" color={colors.primary}>
                  {t('common.remove')}
                </AppText>
              </Pressable>
            </View>
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
