import { locales } from '@alt/i18n';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { Screen } from '@/components/Screen';
import { updateProfile } from '@/lib/api';
import { confirmDeleteAccount, exportMyData } from '@/lib/account';
import { useSafeWordStatus } from '@/lib/queries';
import { useCircleSettings, useProtectionLevel, useUpdateCircle } from '@/lib/settings';
import { TextField } from '@/components/TextField';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { entitlements } from '@alt/core';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuardianSettings() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale, setLocale, reset, analyticsOptOut, setAnalyticsOptOut } = useAppStore();
  const safeWord = useSafeWordStatus();
  const protection = useProtectionLevel();
  const circle = useCircleSettings();
  const updateCircle = useUpdateCircle();
  const qc = useQueryClient();
  const prefs = useQuery({
    queryKey: ['prefs'],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from('profiles').select('notify_digest_email, notify_quiz_nudges').eq('id', u.user!.id).single();
      return { id: u.user!.id, ...(data as { notify_digest_email: boolean; notify_quiz_nudges: boolean }) };
    },
  });
  const setPref = async (patch: Partial<{ notify_digest_email: boolean; notify_quiz_nudges: boolean }>) => {
    if (!prefs.data) return;
    await supabase.from('profiles').update(patch).eq('id', prefs.data.id);
    await qc.invalidateQueries({ queryKey: ['prefs'] });
  };
  const [code, setCode] = useState('');
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const redeem = async () => {
    const circleId = useAppStore.getState().circleId;
    const { data } = await supabase.rpc('redeem_code', { p_circle: circleId, p_code: code });
    const status = (data as { status?: string } | null)?.status;
    setRedeemMsg(status === 'ok' ? t('dashboard.redeemed') : status === 'already_subscribed' ? t('dashboard.redeemAlreadySubscribed') : t('dashboard.redeemInvalid'));
    await qc.invalidateQueries({ queryKey: ['circleSettings'] });
  };
  const plan = circle.data?.plan as 'free' | 'family' | 'family_plus' | undefined;
  const allowedLevels = entitlements[plan ?? 'free'].protectionLevels;

  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('guardian.nav.settings')}
      </AppText>
      <AppText variant="gTitle">{t('guardian.settings.language')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {locales.map((l) => (
          <Choice
            key={l}
            label={t(`languages.${l}`)}
            selected={locale === l}
            onPress={() => {
              setLocale(l);
              void updateProfile({ locale: l });
            }}
          />
        ))}
      </View>
      <AppText variant="gTitle">{t('protection.title')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {(['warn', 'silence', 'block'] as const).map((level) => (
          <Choice
            key={level}
            label={t(`protection.${level}`)}
            sub={t(`protection.${level}Sub`)}
            selected={protection.level === level}
            onPress={() => allowedLevels.includes(level) && protection.set(level)}
          />
        ))}
      </View>
      <AppText variant="gTitle">{t('dashboard.quizFrequency')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {[7, 14, 30].map((days) => (
          <Choice key={days} label={t('dashboard.every', { days })} selected={circle.data?.quiz_interval_days === days} onPress={() => updateCircle.mutate({ quiz_interval_days: days })} />
        ))}
      </View>
      <AppText variant="gTitle">{t('dashboard.notifications')}</AppText>
      <Choice kind="checkbox" label={t('dashboard.digestEmail')} selected={!!prefs.data?.notify_digest_email} onPress={() => void setPref({ notify_digest_email: !prefs.data?.notify_digest_email })} />
      <Choice kind="checkbox" label={t('dashboard.quizNudges')} selected={!!prefs.data?.notify_quiz_nudges} onPress={() => void setPref({ notify_quiz_nudges: !prefs.data?.notify_quiz_nudges })} />
      <BigButton variant="outline" label={t('guardian.settings.familyNumbers')} onPress={() => router.push('/guardian/family-numbers')} />
      <Card>
        <AppText variant="gTitle">{t('guardian.settings.subscription')}</AppText>
        <AppText variant="gBody">{t('dashboard.plan', { plan: t(plan === 'family_plus' ? 'web.pricing.familyPlus' : plan === 'family' ? 'web.pricing.family' : 'web.pricing.free') })}</AppText>
        <AppText variant="gBody" color={colors.textSoft}>{t('guardian.settings.subscriptionWeb')}</AppText>
        <TextField label={t('dashboard.redeemTitle')} value={code} onChangeText={setCode} autoCapitalize="characters" />
        <BigButton variant="outline" label={t('dashboard.redeem')} onPress={() => void redeem()} disabled={code.trim().length < 4} />
        {redeemMsg ? <AppText variant="gBody" accessibilityLiveRegion="polite">{redeemMsg}</AppText> : null}
      </Card>
      <Card>
        <AppText variant="gTitle">{t('guardian.settings.safeWord')}</AppText>
        <AppText variant="gBody" color={colors.textSoft}>
          {safeWord.data?.isSet ? t('guardian.settings.safeWordHashedNote') : t('setup.safeWord.body')}
        </AppText>
        <BigButton variant="outline" label={t('guardian.settings.safeWordChange')} onPress={() => router.push('/guardian/safe-word')} />
      </Card>
      <Choice
        label={t('account.analytics')}
        sub={t('account.analyticsSub')}
        selected={!analyticsOptOut}
        kind="checkbox"
        onPress={() => setAnalyticsOptOut(!analyticsOptOut)}
      />
      <BigButton variant="outline" label={t('dashboard.exportData')} onPress={() => void exportMyData()} />
      <BigButton variant="plain" label={t('account.deleteTitle')} onPress={() => confirmDeleteAccount(() => router.replace('/welcome'))} />
      <BigButton
        variant="outline"
        label={t('auth.signOut')}
        onPress={() => {
          void supabase.auth.signOut().then(() => {
            reset();
            router.replace('/welcome');
          });
        }}
      />
    </Screen>
  );
}
