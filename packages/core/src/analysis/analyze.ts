import { messages, type Locale } from '@alt/i18n';
import type { CheckInputKind, ScamCategory, Verdict } from '../enums';
import { AnalysisResult } from '../schemas';
import { claimsCertainty } from './guard';
import { assessHeuristics, type HeuristicResult } from './heuristics';
import { SYSTEM_PROMPT, languageInstruction, wrapUntrusted } from './prompt';

export type AnalysisInput = {
  kind: CheckInputKind;
  /** Pasted text, a link, a transcript of a voice note, or text the user typed about a call. */
  text?: string;
  /** A screenshot or photo (letter, SMS, email). */
  image?: { mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'; base64: string };
};

export type ModelContent = { type: 'text'; text: string } | { type: 'image'; mediaType: string; base64: string };

export type ModelRequest = { system: string; content: ModelContent[] };

/** The model behind analyzeMessage. The Anthropic implementation lives in @alt/core/server. */
export interface AnalysisModel {
  run(request: ModelRequest): Promise<{ status: 'ok'; output: unknown } | { status: 'refused' | 'error'; detail?: string }>;
}

export type AnalysisOutcome = {
  result: AnalysisResult;
  /** "model" when the model's answer was used (possibly adjusted), "fallback" when rules decided alone. */
  source: 'model' | 'fallback';
  adjusted: boolean;
  heuristics: HeuristicResult;
};

export const MAX_TEXT_LENGTH = 10_000;

const ALERT_CATEGORIES: ScamCategory[] = ['fake_relative', 'fake_police', 'fake_bank', 'new_number', 'identity_request'];

function text(locale: Locale) {
  return messages[locale].analysis;
}

function fallbackResult(verdict: Exclude<Verdict, 'safe'>, category: ScamCategory, locale: Locale): AnalysisResult {
  const t = text(locale);
  return verdict === 'scam'
    ? { verdict, category, reason: t.fallbackScamReason, action: t.fallbackScamAction, suggestAlert: ALERT_CATEGORIES.includes(category) }
    : { verdict, category, reason: t.fallbackCautionReason, action: t.fallbackCautionAction, suggestAlert: false };
}

export function buildRequest(input: AnalysisInput, locale: Locale): ModelRequest {
  const content: ModelContent[] = [];
  if (input.image) content.push({ type: 'image', mediaType: input.image.mediaType, base64: input.image.base64 });
  const described =
    input.kind === 'voice'
      ? 'The person recorded a voice note describing a call or message; this is the transcript.'
      : input.kind === 'image'
        ? 'The person sent a photo or screenshot (above). Read all text in it.'
        : input.kind === 'link'
          ? 'The person pasted a web address they received.'
          : 'The person pasted a message they received.';
  const parts = [described];
  if (input.text?.trim()) parts.push(wrapUntrusted(input.text.trim(), input.kind));
  else if (input.image) parts.push(wrapUntrusted('(see the image above)', input.kind));
  parts.push(languageInstruction(locale));
  content.push({ type: 'text', text: parts.join('\n\n') });
  return { system: SYSTEM_PROMPT, content };
}

/**
 * Checks a message and returns one verdict, one reason and one action.
 * Safety rules applied on top of the model:
 *  - output must validate against AnalysisResult, otherwise rules decide;
 *  - certainty claims are replaced by neutral wording;
 *  - strong scam signals never come back as "safe" (raised to "caution");
 *  - without a usable model answer we never say "safe".
 */
export async function analyzeMessage(input: AnalysisInput, locale: Locale, deps: { model: AnalysisModel }): Promise<AnalysisOutcome> {
  if ((input.text?.length ?? 0) > MAX_TEXT_LENGTH) throw new Error('input_too_long');
  if (!input.text?.trim() && !input.image) throw new Error('input_empty');

  const heuristics = assessHeuristics(input.text ?? '');
  const fromRules = (): AnalysisOutcome => ({
    result: fallbackResult(heuristics.strength === 'strong' ? 'scam' : 'caution', heuristics.category === 'none' ? 'other' : heuristics.category, locale),
    source: 'fallback',
    adjusted: false,
    heuristics,
  });

  let response: Awaited<ReturnType<AnalysisModel['run']>>;
  try {
    response = await deps.model.run(buildRequest(input, locale));
  } catch {
    return fromRules();
  }
  if (response.status !== 'ok') return fromRules();

  const parsed = AnalysisResult.safeParse(response.output);
  if (!parsed.success) return fromRules();

  let result = parsed.data;
  let adjusted = false;
  const t = text(locale);

  if (claimsCertainty(result.reason) || claimsCertainty(result.action)) {
    adjusted = true;
    result =
      result.verdict === 'safe'
        ? { ...result, reason: t.safeReasonNeutral, action: t.safeAction }
        : { ...result, ...pickText(result.verdict, locale) };
  }

  if (result.verdict === 'safe' && heuristics.strength === 'strong') {
    adjusted = true;
    result = { ...fallbackResult('caution', heuristics.category, locale) };
  }

  if (result.verdict === 'safe' && result.category !== 'none') result = { ...result, category: 'none' };
  if (result.verdict === 'safe' && result.suggestAlert) result = { ...result, suggestAlert: false };

  return { result, source: 'model', adjusted, heuristics };
}

function pickText(verdict: Exclude<Verdict, 'safe'>, locale: Locale) {
  const t = text(locale);
  return verdict === 'scam'
    ? { reason: t.fallbackScamReason, action: t.fallbackScamAction }
    : { reason: t.fallbackCautionReason, action: t.fallbackCautionAction };
}
