import { messages, type Locale } from '@alt/i18n';
import type { AnalysisResult } from '../schemas';

const ICON = { scam: '🔴', caution: '🟡', safe: '🟢' } as const;

/** Plain-text verdict for chat channels (Viber/WhatsApp): icon + word, reason, action. Colour is never alone. */
export function formatVerdictText(result: AnalysisResult, locale: Locale): string {
  const v = messages[locale].verdict;
  const title = result.verdict === 'scam' ? v.scamTitle : result.verdict === 'caution' ? v.cautionTitle : v.safeTitle;
  const lines = [`${ICON[result.verdict]} ${title}`, result.reason, result.action];
  if (result.verdict === 'safe') lines.push(v.safeHint);
  if (result.suggestAlert) lines.push(messages[locale].channels.alertHint);
  return lines.filter((l, i, a) => a.indexOf(l) === i).join('\n\n');
}
