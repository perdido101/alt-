import { describe, expect, it } from 'vitest';
import { isAcceptableSafeWord, normaliseSafeWord } from './safeWord';
import { SafeWordInput } from './schemas';

describe('normaliseSafeWord', () => {
  it.each([
    ['Λεμονόπιτα', 'λεμονοπιτα'],
    ['  ΛΕΜΟΝΟΠΙΤΑ  ', 'λεμονοπιτα'],
    ['λεμονοπίτα', 'λεμονοπιτα'],
    ['Ταΐζω', 'ταιζω'],
    ['ΰ', 'υ'],
    ['Κόκκινος   Γάιδαρος', 'κοκκινοσ γαιδαροσ'],
    ['κοκκινοσ', 'κοκκινοσ'],
    ['Crème Brûlée', 'creme brulee'],
  ])('%s → %s', (input, out) => {
    expect(normaliseSafeWord(input)).toBe(out);
  });

  it('requires at least 3 letters', () => {
    expect(isAcceptableSafeWord(' ά ')).toBe(false);
    expect(isAcceptableSafeWord('ναι')).toBe(true);
  });

  it('confirms ignoring accents and case', () => {
    expect(SafeWordInput.safeParse({ word: 'Λεμονόπιτα', confirm: 'λεμονοπιτα' }).success).toBe(true);
    expect(SafeWordInput.safeParse({ word: 'Λεμονόπιτα', confirm: 'πορτοκαλόπιτα' }).success).toBe(false);
  });
});
