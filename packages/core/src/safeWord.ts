/**
 * Normalises a family safe word before hashing or comparing: trims, collapses spaces, lowercases,
 * strips accents/tonos/dialytika and maps final sigma to sigma, so "Λεμονόπιτα " == "λεμονοπιτα".
 * public.normalise_safe_word() in the database does exactly the same; keep them in sync.
 */
export function normaliseSafeWord(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SAFE_WORD_MIN_LENGTH = 3;

export function isAcceptableSafeWord(input: string): boolean {
  return normaliseSafeWord(input).length >= SAFE_WORD_MIN_LENGTH;
}
