import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCss } from './css';
import { schemes, palette } from './colors';
import { contrastRatio } from './contrast';

describe('contrast', () => {
  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  for (const [name, s] of Object.entries(schemes)) {
    describe(name, () => {
      const pairs: Array<[string, string, string]> = [
        ['text on background', s.text, s.background],
        ['text on surface', s.text, s.surface],
        ['textSoft on background', s.textSoft, s.background],
        ['textSoft on surface', s.textSoft, s.surface],
        ['onPrimary on primary', s.onPrimary, s.primary],
        ['onPrimary on primaryPressed', s.onPrimary, s.primaryPressed],
        ['onEmber on ember', s.onEmber, s.ember],
        ['primary on background', s.primary, s.background],
        ['safeText on safeBg', s.safeText, s.safeBg],
        ['cautionText on cautionBg', s.cautionText, s.cautionBg],
        ['dangerText on dangerBg', s.dangerText, s.dangerBg],
        ['text on surfaceCalm', s.text, s.surfaceCalm],
        ['onCallSurface on callSurface', s.onCallSurface, s.callSurface],
      ];
      for (const [label, fg, bg] of pairs) {
        it(`${label} meets AA (4.5:1)`, () => {
          expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }

  it('brand palette matches the spec', () => {
    expect(palette.teal700).toBe('#0E5E5A');
    expect(palette.ember).toBe('#C2410C');
  });
});

describe('tokens.css', () => {
  it('is in sync with the TS tokens (run `pnpm --filter @alt/tokens generate:css`)', () => {
    const file = readFileSync(fileURLToPath(new URL('../tokens.css', import.meta.url)), 'utf8');
    expect(file).toBe(buildCss());
  });
});
