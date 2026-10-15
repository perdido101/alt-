import { localeTags, type Locale } from '@alt/i18n';
import * as Speech from 'expo-speech';

/** "Διάβασέ το μου": reads text aloud in the user's language, a little slower than default. */
export function readAloud(parts: string[], locale: Locale) {
  void Speech.stop();
  Speech.speak(parts.filter(Boolean).join('. '), { language: localeTags[locale], rate: 0.9 });
}
