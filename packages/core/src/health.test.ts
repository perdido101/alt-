import { describe, expect, it } from 'vitest';
import { evaluateHealth } from './health';

const now = new Date('2026-10-15T12:00:00Z');
const all = { supported: true, callScreeningRole: true, notifications: true, overlay: true, batteryExempt: true, fullScreenIntent: true, phoneState: true };

describe('evaluateHealth', () => {
  it('reports a healthy Android phone', () => {
    expect(evaluateHealth('android', all, '2026-10-15T08:00:00Z', now)).toEqual({ protecting: true, problems: [], staleDays: null });
  });

  it('lists lost permissions, most important first', () => {
    const r = evaluateHealth('android', { ...all, overlay: false, callScreeningRole: false, notifications: false }, null, now);
    expect(r.protecting).toBe(false);
    expect(r.problems).toEqual(['callScreeningRole', 'notifications', 'overlay']);
  });

  it('flags a phone that has been silent for 3+ days', () => {
    expect(evaluateHealth('android', all, '2026-10-11T12:00:00Z', now).staleDays).toBe(4);
    expect(evaluateHealth('android', all, '2026-10-13T12:00:00Z', now).staleDays).toBeNull();
  });

  it('never invents problems for iOS or unknown fields', () => {
    expect(evaluateHealth('ios', {}, null, now)).toEqual({ protecting: false, problems: [], staleDays: null });
    expect(evaluateHealth('android', { supported: true }, null, now).problems).toEqual([]);
  });
});
