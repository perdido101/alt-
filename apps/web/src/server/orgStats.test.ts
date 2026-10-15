import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { suppressSmallGroups, statsCsv } = await import('./org');

describe('org stats privacy', () => {
  it('hides activity counts below 5 people and exports blanks', () => {
    const s = suppressSmallGroups([{ weekStart: '2026-10-05', protectedPeople: 4, checks: 3, checksScam: 1, alerts: 1, flaggedCalls: 0 }]);
    expect(s[0]).toMatchObject({ checks: null, alerts: null });
    expect(statsCsv(s, ['w'])).toContain('2026-10-05,4,,,,');
  });
});
