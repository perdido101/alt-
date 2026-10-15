import { normalisePhone, type OfficialCategory } from '@alt/core';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Flag, House, OctagonAlert, Phone, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { CallAlertButton } from '@/components/CallAlertButton';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { Screen } from '@/components/Screen';
import { CATEGORY_GROUPS, directory, recordAnswer, type DirectoryRow } from '@/lib/callFlow';
import { callNumber } from '@/lib/family';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Official-number check: does the number that called belong to the organisation they named?
 * A match still gets the reminder, because numbers can be spoofed.
 */
export default function OfficialCheck() {
  const { callEventId, category, numberKey } = useLocalSearchParams<{ callEventId: string; category: OfficialCategory; numberKey?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const rows = useQuery({ queryKey: ['directory', category], queryFn: () => directory(CATEGORY_GROUPS[category] ?? [category]) });
  const [org, setOrg] = useState<string | null | undefined>(undefined); // undefined = not chosen yet, null = "I don't know"

  const orgs = useMemo(() => [...new Map((rows.data ?? []).map((r) => [r.organisation_el, r])).values()], [rows.data]);
  const needsPick = orgs.length > 1 && org === undefined;
  const chosen: DirectoryRow[] = (rows.data ?? []).filter((r) => (org ? r.organisation_el === org : true));
  const representative = org ? chosen[0] : orgs.length === 1 ? orgs[0] : undefined;
  const orgName = representative ? (locale === 'el' ? representative.organisation_el : representative.organisation_en) : t(`callOrg.${category}`);
  const article = representative?.article_el ?? t(`callOrgArticle.${category}`);
  const match = !!numberKey && chosen.some((r) => r.number_key === numberKey);
  const realNumber = representative?.display_number;

  useEffect(() => {
    if (rows.isSuccess && !needsPick) void recordAnswer(callEventId, { official_match: numberKey ? match : null });
  }, [rows.isSuccess, needsPick, match, numberKey, callEventId]);

  const footer = <BigButton icon={House} variant="plain" label={t('common.home')} onPress={() => router.replace('/parent/home')} />;

  if (rows.isLoading) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;

  if (needsPick) {
    return (
      <Screen footer={footer}>
        <AppText variant="heading" accessibilityRole="header">{t('call.whichOrg')}</AppText>
        <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
          {orgs.map((o) => (
            <Choice key={o.id} label={locale === 'el' ? o.organisation_el : o.organisation_en} selected={false} onPress={() => setOrg(o.organisation_el)} />
          ))}
          <Choice label={t('call.dontKnow')} selected={false} onPress={() => setOrg(null)} />
        </View>
      </Screen>
    );
  }

  const neverAsks = t('call.neverAsks', { org: orgName, article });
  const callReal = realNumber ? (
    <BigButton icon={Phone} variant="outline" label={t('call.callReal', { org: orgName, article, number: realNumber })} onPress={() => callNumber(realNumber)} />
  ) : null;

  if (match) {
    return (
      <Screen footer={footer}>
        <ShieldCheck color={colors.cautionText} size={48} />
        <AppText variant="heading" accessibilityRole="header">{t('call.matchTitle')}</AppText>
        <AppText variant="tileTitle">{t('call.matchBody')}</AppText>
        {callReal}
        <CallAlertButton callEventId={callEventId} numberKey={numberKey} />
      </Screen>
    );
  }

  return (
    <Screen footer={footer}>
      <View style={{ backgroundColor: colors.dangerBg, borderRadius: 24, padding: spacing.lg, gap: spacing.sm }}>
        <OctagonAlert color={colors.dangerText} size={48} />
        <AppText variant="heading" color={colors.dangerText} accessibilityRole="header">
          {numberKey ? t('call.mismatchTitle', { org: orgName, article }) : t('call.unknownNumberTitle')}
        </AppText>
        <AppText variant="tileTitle">{neverAsks}</AppText>
        {numberKey ? <AppText>{normalisePhone(numberKey).display}</AppText> : null}
      </View>
      <CallAlertButton callEventId={callEventId} numberKey={numberKey} />
      {callReal}
      {numberKey ? (
        <BigButton
          icon={Flag}
          variant="outline"
          label={t('call.report')}
          onPress={() => router.push({ pathname: '/parent/call/report', params: { numberKey, category } })}
        />
      ) : null}
      <Card tone="calm">
        <AppText>{t('alert.advice')}</AppText>
      </Card>
    </Screen>
  );
}
