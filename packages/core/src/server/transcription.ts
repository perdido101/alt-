import type { Locale } from '@alt/i18n';

/** Speech-to-text for voice notes (Greek + English). One implementation ships; keep it swappable. */
export interface TranscriptionProvider {
  transcribe(audio: { data: Uint8Array; mimeType: string }, locale: Locale): Promise<string>;
}

const ISO3: Record<Locale, string> = { el: 'ell', en: 'eng' };

/** ElevenLabs Scribe (strong Greek accuracy). Env: ELEVENLABS_API_KEY. */
export function createElevenLabsTranscriber(apiKey: string, model = 'scribe_v1'): TranscriptionProvider {
  return {
    async transcribe(audio, locale) {
      const form = new FormData();
      form.append('model_id', model);
      form.append('language_code', ISO3[locale]);
      form.append('tag_audio_events', 'false');
      form.append('file', new Blob([audio.data as BlobPart], { type: audio.mimeType }), 'voice-note');
      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
      });
      if (!res.ok) throw new Error(`transcription_failed_${res.status}`);
      const json = (await res.json()) as { text?: string };
      return (json.text ?? '').trim();
    },
  };
}

/** Used in development and tests when no provider key is configured. */
export const unavailableTranscriber: TranscriptionProvider = {
  async transcribe() {
    throw new Error('transcription_unavailable');
  },
};
