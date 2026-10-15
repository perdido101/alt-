import { normalisePhone } from '@alt/core';
import { localeTags } from '@alt/i18n';
import { spacing } from '@alt/tokens';
import { BellRing, CircleAlert, CircleCheck, KeyRound, MessageSquareText, OctagonAlert, PhoneIncoming } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { TimelineItem } from '@/lib/timeline';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

/** One row of the guardian timeline: icon, what happened, who, when. */
export function TimelineRow({ item, who }: { item: TimelineItem; who?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = useAppStore((s) => s.locale);
  const time = new Date(item.at).toLocaleString(localeTags[locale], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  let Icon = MessageSquareText;
  let color = colors.textSoft;
  let title = '';
  let detail: string | null = null;

  switch (item.kind) {
    case 'check': {
      Icon = item.verdict === 'scam' ? OctagonAlert : item.verdict === 'caution' ? CircleAlert : CircleCheck;
      color = item.verdict === 'scam' ? colors.dangerText : item.verdict === 'caution' ? colors.cautionText : colors.safeText;
      const word = t(item.verdict === 'scam' ? 'verdict.scamTitle' : item.verdict === 'caution' ? 'verdict.cautionTitle' : 'verdict.safeTitle');
      title = `${t('history.check')}: ${word}`;
      detail = `${item.verdict === 'safe' ? '' : `${t(`categories.${item.category}`)} · `}${item.reason}`;
      break;
    }
    case 'alert':
      Icon = BellRing;
      color = item.status === 'open' ? colors.dangerText : colors.textSoft;
      title = t(`history.alert_${item.source}`);
      detail = `${t(item.status === 'open' ? 'history.alertOpen' : 'history.alertResolved')}${item.callerNumber ? ` · ${normalisePhone(item.callerNumber).display ?? item.callerNumber}` : ''}`;
      break;
    case 'call':
      Icon = PhoneIncoming;
      color = item.classification === 'reported_scam' ? colors.dangerText : item.classification === 'risky' ? colors.cautionText : colors.textSoft;
      title = t(`history.call_${item.classification}`);
      detail = [
        item.numberKey ? normalisePhone(item.numberKey).display : t('history.hiddenNumber'),
        item.answer ? t(`history.answer_${item.answer}`) : null,
        item.officialMatch === false ? t('history.officialMismatch') : null,
      ]
        .filter(Boolean)
        .join(' · ');
      break;
    case 'quiz':
      Icon = KeyRound;
      color = item.result === 'correct' ? colors.safeText : colors.cautionText;
      title = t(`history.quiz_${item.result ?? 'skipped'}`);
      break;
  }

  return (
    <View accessible style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Icon color={color} size={24} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="gTitle" color={color}>
          {title}
        </AppText>
        {detail ? <AppText variant="gBody">{detail}</AppText> : null}
        <AppText variant="gBody" color={colors.textSoft}>
          {who ? `${who} · ${time}` : time}
        </AppText>
      </View>
    </View>
  );
}
