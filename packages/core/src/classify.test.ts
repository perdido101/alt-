import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/classification-cases.json';
import { classifyCall, type OfficialEntry, type ReputationEntry } from './classify';
import type { OfficialCategory } from './enums';
import { normalisePhone } from './phone';

const official = new Map<string, OfficialEntry>(
  Object.entries(fixtures.context.official).map(([key, category]) => [
    key,
    {
      id: key,
      organisation: { el: 'Οργανισμός', en: 'Organisation' },
      category: category as OfficialCategory,
      displayNumber: key,
      verified: true,
    },
  ]),
);
const ctx = {
  family: new Set(fixtures.context.family),
  official,
  reputation: new Map<string, ReputationEntry>(Object.entries(fixtures.context.reputation)),
  reportThreshold: fixtures.context.reportThreshold,
};

describe('classifyCall (shared fixtures)', () => {
  it.each(fixtures.cases)('$raw → $expect ($reason)', ({ raw, expect: classification, reason }) => {
    expect(classifyCall(normalisePhone(raw), ctx)).toMatchObject({ classification, reason });
  });
});

describe('classifyCall', () => {
  it('returns the official entry', () => {
    expect(classifyCall(normalisePhone('112'), ctx).official?.category).toBe('emergency');
  });

  it('prefers family over reports', () => {
    const c = { ...ctx, reputation: new Map([['+306912345678', { approvedReports: 10, flagged: true }]]) };
    expect(classifyCall(normalisePhone('6912345678'), c).classification).toBe('family');
  });

  it('uses the default threshold of 3', () => {
    const c = { family: new Set<string>(), official: new Map(), reputation: new Map([['+306911111111', { approvedReports: 3, flagged: false }]]) };
    expect(classifyCall(normalisePhone('6911111111'), c).classification).toBe('reported_scam');
  });
});
