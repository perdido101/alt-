import type { CallClassification, OfficialCategory } from './enums';
import type { NormalisedNumber } from './phone';

export type OfficialEntry = {
  id: string;
  organisation: { el: string; en: string };
  category: OfficialCategory;
  displayNumber: string;
  verified: boolean;
};

export type ReputationEntry = {
  /** Count of moderated (approved) scam reports. */
  approvedReports: number;
  /** Set by the server-side reputation service for new numbers showing scam-like patterns. */
  flagged: boolean;
};

export type ClassifyContext = {
  family: ReadonlySet<string>;
  official: ReadonlyMap<string, OfficialEntry>;
  reputation: ReadonlyMap<string, ReputationEntry>;
  /** Approved reports needed for "reported scam". */
  reportThreshold?: number;
};

export type ClassifyReason =
  | 'family'
  | 'official'
  | 'reported'
  | 'hidden'
  | 'international'
  | 'flagged'
  | 'invalid'
  | 'unknown';

export type CallVerdict = {
  classification: CallClassification;
  reason: ClassifyReason;
  official?: OfficialEntry;
};

export const DEFAULT_REPORT_THRESHOLD = 3;

/**
 * Decides how an incoming call is labelled. Order matters: family > official > reported > risky > unknown.
 * The Android CallScreeningService reimplements this in Kotlin and is tested against the same cases
 * (packages/core/fixtures/classification-cases.json), so change both together.
 */
export function classifyCall(number: NormalisedNumber, ctx: ClassifyContext): CallVerdict {
  if (number.kind === 'hidden' || number.key === null) {
    return { classification: 'risky', reason: 'hidden' };
  }
  const key = number.key;

  if (ctx.family.has(key)) return { classification: 'family', reason: 'family' };

  const official = ctx.official.get(key);
  if (official) return { classification: 'official', reason: 'official', official };

  const rep = ctx.reputation.get(key);
  if (rep && rep.approvedReports >= (ctx.reportThreshold ?? DEFAULT_REPORT_THRESHOLD)) {
    return { classification: 'reported_scam', reason: 'reported' };
  }

  if (number.kind === 'international') return { classification: 'risky', reason: 'international' };
  if (number.kind === 'invalid') return { classification: 'risky', reason: 'invalid' };
  if (rep?.flagged) return { classification: 'risky', reason: 'flagged' };

  return { classification: 'unknown', reason: 'unknown' };
}
