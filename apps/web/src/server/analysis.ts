import 'server-only';
import { analyzeMessage, type AnalysisInput, type AnalysisModel, type AnalysisOutcome, type CheckChannel } from '@alt/core';
import { createAnthropicModel, createElevenLabsTranscriber, unavailableTranscriber, type TranscriptionProvider } from '@alt/core/server';
import type { Locale } from '@alt/i18n';
import { env } from './env';
import { supabaseAdmin } from './supabase';

let model: AnalysisModel | null = null;
let transcriber: TranscriptionProvider | null = null;

export function analysisModel(): AnalysisModel {
  const e = env();
  // Without a key every check falls back to the rule-based verdict (never "safe").
  model ??= e.ANTHROPIC_API_KEY
    ? createAnthropicModel({ apiKey: e.ANTHROPIC_API_KEY, model: e.ANTHROPIC_MODEL, effort: e.ANALYSIS_EFFORT })
    : { run: async () => ({ status: 'error', detail: 'no_api_key' }) };
  return model;
}

export function transcription(): TranscriptionProvider {
  const e = env();
  transcriber ??= e.ELEVENLABS_API_KEY ? createElevenLabsTranscriber(e.ELEVENLABS_API_KEY) : unavailableTranscriber;
  return transcriber;
}

export type StoredCheck = AnalysisOutcome & { checkId: string };

/** Runs the analysis and stores the verdict (never the content) in `checks`. */
export async function runCheck(params: {
  input: AnalysisInput;
  locale: Locale;
  circleId: string;
  userId: string;
  channel: CheckChannel;
  media?: { data: Uint8Array; mimeType: string };
}): Promise<StoredCheck> {
  const outcome = await analyzeMessage(params.input, params.locale, { model: analysisModel() });
  const { data, error } = await supabaseAdmin()
    .from('checks')
    .insert({
      circle_id: params.circleId,
      user_id: params.userId,
      channel: params.channel,
      input_kind: params.input.kind,
      verdict: outcome.result.verdict,
      category: outcome.result.category,
      reason: outcome.result.reason,
      action: outcome.result.action,
      suggest_alert: outcome.result.suggestAlert,
      locale: params.locale,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`check_insert_failed: ${error?.message}`);
  const checkId = (data as { id: string }).id;

  // Raw media is analysed in memory and dropped. Only if retention is configured is a copy kept
  // (in a private bucket, deleted by the daily retention job).
  const hours = env().RAW_MEDIA_RETENTION_HOURS;
  if (hours > 0 && params.media) {
    await supabaseAdmin()
      .storage.from('check-media')
      .upload(`${params.circleId}/${checkId}`, params.media.data, { contentType: params.media.mimeType, upsert: false });
  }
  return { ...outcome, checkId };
}
