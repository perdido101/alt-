import { describe, expect, it } from 'vitest';
import { createAnthropicModel } from '../server/anthropicModel';
import { analyzeMessage } from './analyze';
import { claimsCertainty } from './guard';
import { allSamples } from './samples';

/**
 * Live evaluation against the Claude API. Costs money, so it only runs when explicitly enabled:
 *   ANTHROPIC_API_KEY=... ALT_LIVE_EVAL=1 pnpm --filter @alt/core test
 */
const live = !!process.env.ANTHROPIC_API_KEY && process.env.ALT_LIVE_EVAL === '1';

describe.skipIf(!live)('analyzeMessage (live model)', () => {
  const model = createAnthropicModel({ model: process.env.ANTHROPIC_MODEL });

  it.each(allSamples)(
    '$id',
    async (s) => {
      const out = await analyzeMessage({ kind: 'text', text: s.text }, s.locale, { model });
      expect(out.source).toBe('model');
      expect(s.verdicts).toContain(out.result.verdict);
      if (out.result.verdict !== 'safe') expect(s.categories).toContain(out.result.category);
      expect(claimsCertainty(out.result.reason)).toBe(false);
      expect(claimsCertainty(out.result.action)).toBe(false);
    },
    120_000,
  );
});
