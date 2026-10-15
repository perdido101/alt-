import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export const DEFAULT_REGION: CountryCode = 'GR';

export type NumberKind = 'hidden' | 'short' | 'domestic' | 'international' | 'invalid';

export type NormalisedNumber = {
  kind: NumberKind;
  /**
   * Stable lookup key used everywhere (family contacts, official directory, reputation, on-device cache):
   * E.164 for full numbers ("+302101234567"), bare digits for short codes ("112"), null for hidden numbers.
   */
  key: string | null;
  e164: string | null;
  /** Human formatting: national for domestic numbers, international otherwise. */
  display: string | null;
  country: CountryCode | null;
};

const HIDDEN_MARKERS = new Set(['', 'private', 'anonymous', 'unknown', 'restricted', 'withheld', '-1', '-2', '-3']);

/** Greek short codes: 3-digit emergency/service numbers (100, 112, 166, 199) and 4-5 digit 1xxx(x) numbers. */
const SHORT_CODE = /^1\d{2,4}$/;

export function normalisePhone(raw: string | null | undefined, region: CountryCode = DEFAULT_REGION): NormalisedNumber {
  const trimmed = (raw ?? '').trim();
  if (HIDDEN_MARKERS.has(trimmed.toLowerCase())) {
    return { kind: 'hidden', key: null, e164: null, display: null, country: null };
  }

  const digits = trimmed.replace(/[^\d+]/g, '');
  if (region === 'GR' && SHORT_CODE.test(digits)) {
    return { kind: 'short', key: digits, e164: null, display: digits, country: 'GR' };
  }

  const parsed = parsePhoneNumberFromString(trimmed, region);
  if (!parsed || !parsed.isValid()) {
    const fallback = digits.replace(/(?!^)\+/g, '');
    return { kind: 'invalid', key: fallback || null, e164: null, display: trimmed || null, country: null };
  }

  const country = parsed.country ?? null;
  const domestic = country === region;
  return {
    kind: domestic ? 'domestic' : 'international',
    key: parsed.number,
    e164: parsed.number,
    display: domestic ? parsed.formatNational() : parsed.formatInternational(),
    country,
  };
}

/** Convenience: the lookup key or null. */
export function numberKey(raw: string | null | undefined, region: CountryCode = DEFAULT_REGION): string | null {
  return normalisePhone(raw, region).key;
}

/** True for numbers a guardian can store as a family contact (no hidden, no short codes, no garbage). */
export function isDiallableContact(raw: string, region: CountryCode = DEFAULT_REGION): boolean {
  const n = normalisePhone(raw, region);
  return n.kind === 'domestic' || n.kind === 'international';
}
