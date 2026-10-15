import { normalisePhone } from '@alt/core';
import { localeTags } from '@alt/i18n';
import { spacing } from '@alt/tokens';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Phone } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { alertDetail } from '@/lib/alerts';
import { callNumber } from '@/lib/family';
import { useCircleMembers } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

/** Guardian alert view: who, when, what triggered it, and a big call button. Opening it marks it seen. */
export default function GuardianAlert() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const queryClient = useQueryClient();
  const members = useCircleMembers();
  const detail = useQuery({ queryKey: ['alert', id], queryFn: () => alertDetail(id), refetchInterval: 10_000 });

  useEffect(() => {
    void supabase.rpc('mark_alert_seen', { p_alert: id });
  }, [id]);

  const a = detail.data;
  const parent = (members.data ?? []).find((m) => m.userId === a?.protectedUserId);
  const name = parent?.displayName ?? '';
  const resolve = async () => {
    await supabase.rpc('resolve_alert', { p_alert: id });
    await queryClient.invalidateQueries();
    router.replace('/guardian/home');
  };

  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header" color={colors.dangerText}>
        {t('guardianAlert.banner', { name })}
      </AppText>
      {parent?.phone ? (
        <BigButton icon={Phone} variant="ember" size="lg" label={t('guardianAlert.callParent', { name })} onPress={() => callNumber(parent.phone!)} />
      ) : (
        <AppText variant="gBody" color={colors.textSoft}>{t('guardianAlert.noPhone')}</AppText>
      )}
      {a ? (
        <Card>
          <AppText variant="gTitle">{t('guardianAlert.when')}</AppText>
          <AppText variant="gBody">{new Date(a.createdAt).toLocaleString(localeTags[locale], { dateStyle: 'medium', timeStyle: 'short' })}</AppText>
          <AppText variant="gTitle">{t('guardianAlert.trigger')}</AppText>
          <AppText variant="gBody">{t(`history.alert_${a.source}`)}</AppText>
          {a.callerNumber ? (
            <>
              <AppText variant="gTitle">{t('guardianAlert.caller')}</AppText>
              <AppText variant="gBody">{normalisePhone(a.callerNumber).display ?? a.callerNumber}</AppText>
            </>
          ) : null}
          <AppText variant="gTitle">{t('guardianAlert.deliveries')}</AppText>
          {(members.data ?? [])
            .filter((m) => m.role === 'guardian')
            .map((g) => (
              <View key={g.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                <AppText variant="gBody">{g.displayName}</AppText>
                <AppText variant="gBody" color={a.deliveries.some((d) => d.recipientUserId === g.userId && d.seenAt) ? colors.safeText : colors.textSoft}>
                  {a.deliveries.some((d) => d.recipientUserId === g.userId && d.seenAt) ? t('alert.seen') : t('alert.notified')}
                </AppText>
              </View>
            ))}
        </Card>
      ) : null}
      {a?.status === 'open' ? (
        <BigButton icon={CircleCheck} variant="outline" label={t('guardianAlert.resolve')} onPress={() => void resolve()} />
      ) : a ? (
        <AppText variant="gTitle" color={colors.safeText}>{t('guardianAlert.resolved')}</AppText>
      ) : null}
    </Screen>
  );
}
