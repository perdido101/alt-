import { describe, expect, it } from 'vitest';
import { assessHeuristics } from './heuristics';
import { safeSamples, scamSamplesEl, scamSamplesEn } from './samples';

describe('sample set', () => {
  it('meets the §9 minimums', () => {
    expect(scamSamplesEl.length).toBeGreaterThanOrEqual(15);
    expect(scamSamplesEn.length).toBeGreaterThanOrEqual(6);
    expect(safeSamples.length).toBeGreaterThanOrEqual(8);
  });

  it('covers every scam category', () => {
    const covered = new Set([...scamSamplesEl, ...scamSamplesEn].map((s) => s.categories[0]));
    for (const c of ['fake_relative', 'fake_police', 'fake_bank', 'fake_courier', 'fake_utility_refund', 'new_number', 'prize', 'romance', 'investment', 'identity_request']) {
      expect(covered, c).toContain(c);
    }
  });
});

describe('heuristics', () => {
  it.each([...scamSamplesEl, ...scamSamplesEn])('$id is flagged strongly with an accepted category', (s) => {
    const h = assessHeuristics(s.text);
    expect(h.strength).toBe('strong');
    expect(s.categories).toContain(h.category);
  });

  it.each(safeSamples)('$id raises no strong signal', (s) => {
    expect(assessHeuristics(s.text).strength).not.toBe('strong');
  });
});
