import { describe, expect, it } from 'vitest';
import { isDiallableContact, normalisePhone } from './phone';

describe('normalisePhone', () => {
  it.each([
    ['6912345678', '+306912345678'],
    ['691 234 5678', '+306912345678'],
    ['+30 691-234-5678', '+306912345678'],
    ['0030 6912345678', '+306912345678'],
    ['210 1234567', '+302101234567'],
    ['(210) 123 4567', '+302101234567'],
  ])('normalises Greek %s to %s', (raw, e164) => {
    const n = normalisePhone(raw);
    expect(n.kind).toBe('domestic');
    expect(n.key).toBe(e164);
    expect(n.e164).toBe(e164);
    expect(n.country).toBe('GR');
  });

  it('formats domestic numbers nationally', () => {
    expect(normalisePhone('+306912345678').display).toBe('691 234 5678');
  });

  it('detects international numbers', () => {
    const n = normalisePhone('+44 20 7946 0958');
    expect(n.kind).toBe('international');
    expect(n.key).toBe('+442079460958');
    expect(n.country).toBe('GB');
    expect(n.display).toMatch(/^\+44/);
  });

  it.each(['', '  ', 'Private', 'anonymous', 'UNKNOWN', '-2', null, undefined])('treats %s as hidden', (raw) => {
    const n = normalisePhone(raw);
    expect(n.kind).toBe('hidden');
    expect(n.key).toBeNull();
  });

  it.each(['100', '112', '166', '199', '1564', '11888'])('keeps Greek short code %s as digits', (raw) => {
    expect(normalisePhone(raw)).toMatchObject({ kind: 'short', key: raw });
  });

  it('marks garbage as invalid but keeps a key for reporting', () => {
    expect(normalisePhone('12')).toMatchObject({ kind: 'invalid', key: '12' });
    expect(normalisePhone('+3069')).toMatchObject({ kind: 'invalid', key: '+3069' });
  });

  it('only accepts real numbers as family contacts', () => {
    expect(isDiallableContact('6912345678')).toBe(true);
    expect(isDiallableContact('+447911123456')).toBe(true);
    expect(isDiallableContact('112')).toBe(false);
    expect(isDiallableContact('abc')).toBe(false);
  });
});
