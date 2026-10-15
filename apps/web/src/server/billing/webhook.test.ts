import { describe, expect, it, vi } from 'vitest';

vi.mock('../email/send', () => ({ sendGiftCodeEmail: vi.fn(), sendPaymentFailedEmail: vi.fn() }));
vi.mock('../supabase', () => ({ supabaseAdmin: vi.fn() }));
vi.mock('./stripe', () => ({ stripe: vi.fn() }));

const { newGiftCode } = await import('./webhook');

describe('gift codes', () => {
  it('are unambiguous and well-formed', () => {
    const codes = new Set(Array.from({ length: 500 }, () => newGiftCode()));
    expect(codes.size).toBeGreaterThan(495);
    for (const c of codes) {
      expect(c).toMatch(/^ALT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      expect(c).not.toMatch(/[01IO]/);
    }
  });
});
