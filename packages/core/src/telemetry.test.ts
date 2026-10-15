import { describe, expect, it, vi } from 'vitest';
import { capture, sanitizeProps, scrubDeep, scrubSentryEvent, scrubText } from './telemetry';

describe('telemetry', () => {
  it('keeps only allow-listed props', () => {
    expect(sanitizeProps('message_checked', { verdict: 'scam', text: 'hi', source: 'paste' })).toEqual({ verdict: 'scam', source: 'paste' });
  });
  it('drops values that look personal', () => {
    expect(sanitizeProps('invite_created', { channel: '+30 691 234 5678' })).toEqual({});
  });
  it('scrubs phones, emails, IBANs and tokens', () => {
    const s = scrubText('call +30 691 234 5678 or a.b@c.gr, IBAN GR12 0110 1250 0000 0001 2300 695, Bearer abc.def');
    expect(s).not.toMatch(/691|a\.b@|0110|abc\.def/);
  });
  it('removes sensitive keys deeply', () => {
    expect(scrubDeep({ a: { text: 'Γεια μαμά', ok: 1 }, list: [{ phone: '6912345678' }] })).toEqual({ a: { text: '[removed]', ok: 1 }, list: [{ phone: '[removed]' }] });
  });
  it('strips user, cookies, body and headers from Sentry events', () => {
    const e = scrubSentryEvent({ user: { email: 'x@y.z' }, request: { cookies: 'sb=1', data: { text: 'x' }, headers: { authorization: 'Bearer x', 'user-agent': 'UA' } } });
    expect(e.user).toBeUndefined();
    expect(e.request).toEqual({ headers: { 'user-agent': 'UA' } });
  });
  it('capture is a no-op without a key and never throws', async () => {
    const f = vi.fn().mockRejectedValue(new Error('offline'));
    await capture({ distinctId: 'x', event: 'app_opened', fetchImpl: f });
    expect(f).not.toHaveBeenCalled();
    await expect(capture({ apiKey: 'k', distinctId: 'x', event: 'app_opened', fetchImpl: f })).resolves.toBeUndefined();
    const body = JSON.parse(f.mock.calls[0]![1].body);
    expect(body.properties.$process_person_profile).toBe(false);
  });
});
