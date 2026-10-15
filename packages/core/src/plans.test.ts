import { describe, expect, it } from 'vitest';
import { entitlements, formatPrice, planForLookupKey, planLimits, priceLookupKeys, pricing } from './plans';

describe('plans', () => {
  it('match the circle limits enforced in the database', () => {
    for (const plan of ['free', 'family', 'family_plus'] as const) {
      expect(entitlements[plan].maxGuardians).toBe(planLimits[plan].guardians);
      expect(entitlements[plan].maxProtected).toBe(planLimits[plan].protected);
    }
  });

  it('keep the safety basics in every plan', () => {
    for (const plan of ['free', 'family', 'family_plus'] as const) expect(entitlements[plan].protectionLevels).toContain('warn');
  });

  it('use the prices from the brief', () => {
    expect(pricing.family.monthly).toBe(499);
    expect(pricing.family.yearly).toBe(3900);
    expect(pricing.family.trialDays).toBe(30);
    expect(pricing.family_plus.monthly).toBe(799);
  });

  it('maps Stripe lookup keys to plans', () => {
    expect(planForLookupKey(priceLookupKeys.family_yearly)).toBe('family');
    expect(planForLookupKey(priceLookupKeys.family_plus_monthly)).toBe('family_plus');
    expect(planForLookupKey(priceLookupKeys.gift_6m)).toBeNull();
  });

  it('formats prices per locale', () => {
    expect(formatPrice(499, 'el').replace(/\s/g, ' ')).toBe('4,99 €');
    expect(formatPrice(3900, 'el').replace(/\s/g, ' ')).toBe('39 €');
    expect(formatPrice(799, 'en')).toBe('€7.99');
  });
});
