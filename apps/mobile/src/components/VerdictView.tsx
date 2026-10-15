import type { Verdict } from '@alt/core';
import { radii, spacing } from '@alt/tokens';
import { CircleAlert, CircleCheck, OctagonAlert, Volume2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { readAloud } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

type Props = { verdict: Verdict; title: string; sentence: string; detail?: string; actions: ReactNode };

/** Full-colour verdict: icon + word + one big sentence + actions. Colour is never the only signal. */
export function VerdictView({ verdict, title, sentence, detail, actions }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const tone = {
    scam: { bg: colors.dangerBg, fg: colors.dangerText, Icon: OctagonAlert },
    caution: { bg: colors.cautionBg, fg: colors.cautionText, Icon: CircleAlert },
    safe: { bg: colors.safeBg, fg: colors.safeText, Icon: CircleCheck },
  }[verdict];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tone.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, flexGrow: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.readAloud')}
          onPress={() => readAloud([title, sentence, detail ?? ''], locale)}
          style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 56, paddingHorizontal: spacing.sm, borderRadius: radii.md }}
        >
          <Volume2 color={tone.fg} size={28} />
          <AppText variant="bodyStrong" color={tone.fg}>
            {t('common.readAloud')}
          </AppText>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} accessible accessibilityRole="header" accessibilityLabel={title}>
          <tone.Icon color={tone.fg} size={48} strokeWidth={2.5} />
          <AppText variant="headingLarge" color={tone.fg} style={{ flexShrink: 1 }}>
            {title}
          </AppText>
        </View>
        <AppText variant="tileTitle">{sentence}</AppText>
        {detail ? <AppText>{detail}</AppText> : null}
        <View style={{ flex: 1 }} />
        <View style={{ gap: spacing.sm }}>{actions}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
