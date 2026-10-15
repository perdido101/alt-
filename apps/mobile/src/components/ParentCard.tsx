import { localeTags } from '@alt/i18n';
import { spacing } from '@alt/tokens';
import { KeyRound, PhoneIncoming, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { Member } from '@/lib/api';
import type { ParentStatus } from '@/lib/parentStatus';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Card } from './Card';

function Line({ icon: Icon, color, text }: { icon: typeof ShieldCheck; color: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Icon color={color} size={20} />
      <AppText variant="gBody" color={color} style={{ flexShrink: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

/** One card per parent: protected status, call protection, last safe-word result, last activity, health warnings. */
export function ParentCard({ member, status }: { member: Member; status?: ParentStatus }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const joined = !!member.consentedAt;
  const h = status?.health;
  const callsText = !status?.platform ? null : status.platform === 'ios' ? t('health.callsIos') : h?.protecting ? t('health.callsOn') : t('health.callsOff');
  const when = status?.lastSeenAt ? new Date(status.lastSeenAt).toLocaleString(localeTags[locale], { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  const quizText = status?.lastQuiz ? t('health.lastQuiz', { result: t(`history.quiz_${status.lastQuiz}`) }) : null;

  return (
    <Card>
      <AppText variant="gHeading">{member.displayName}</AppText>
      <Line icon={ShieldCheck} color={joined ? colors.safeText : colors.textSoft} text={joined ? t('guardian.home.protected') : t('guardian.home.notJoined')} />
      {callsText ? <Line icon={PhoneIncoming} color={h?.protecting || status?.platform === 'ios' ? colors.text : colors.dangerText} text={callsText} /> : null}
      {quizText ? <Line icon={KeyRound} color={status?.lastQuiz === 'correct' ? colors.text : colors.cautionText} text={quizText} /> : null}
      {when ? <Line icon={Smartphone} color={colors.textSoft} text={t('health.lastActive', { when })} /> : null}

      {h && (h.problems.length > 0 || h.staleDays !== null) ? (
        <View accessibilityRole="alert" style={{ backgroundColor: colors.cautionBg, borderRadius: 16, padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <ShieldAlert color={colors.cautionText} size={22} />
            <AppText variant="gTitle" color={colors.cautionText} style={{ flexShrink: 1 }}>
              {h.problems.length > 0 ? t('health.title', { name: member.displayName }) : t('health.stale', { name: member.displayName, days: h.staleDays ?? 0 })}
            </AppText>
          </View>
          {h.problems.length > 0 ? (
            <>
              <AppText variant="gBody">{t('health.fixIntro')}</AppText>
              {h.problems.map((p) => (
                <AppText key={p} variant="gBody">{`• ${t(`health.fix_${p}`)}`}</AppText>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
