import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetEnv } from '../env';
import { hmacHex } from './crypto';
import { viberAdapter } from './viber';
import { whatsappAdapter } from './whatsapp';

beforeEach(() => {
  process.env.FEATURE_VIBER = 'on';
  process.env.VIBER_AUTH_TOKEN = 'viber-secret';
  process.env.FEATURE_WHATSAPP = 'on';
  process.env.WHATSAPP_APP_SECRET = 'wa-secret';
  process.env.WHATSAPP_ACCESS_TOKEN = 'wa-token';
  resetEnv();
});
afterEach(() => {
  for (const k of ['FEATURE_VIBER', 'VIBER_AUTH_TOKEN', 'FEATURE_WHATSAPP', 'WHATSAPP_APP_SECRET', 'WHATSAPP_ACCESS_TOKEN']) delete process.env[k];
  resetEnv();
});

const req = (headers: Record<string, string>) => new Request('https://alt.example/api', { method: 'POST', headers });

describe('viber adapter', () => {
  const body = JSON.stringify({ event: 'message', sender: { id: 'u1' }, message: { type: 'text', text: 'Γεια σου μαμά, νέο νούμερο' } });

  it('accepts only correctly signed webhooks', () => {
    expect(viberAdapter.verify(req({ 'x-viber-content-signature': hmacHex('viber-secret', body) }), body)).toBe(true);
    expect(viberAdapter.verify(req({ 'x-viber-content-signature': hmacHex('wrong', body) }), body)).toBe(false);
    expect(viberAdapter.verify(req({}), body)).toBe(false);
  });

  it('maps text, pictures and voice files', () => {
    expect(viberAdapter.parse(body)).toEqual([{ channel: 'viber', externalId: 'u1', kind: 'text', text: 'Γεια σου μαμά, νέο νούμερο' }]);
    const pic = JSON.stringify({ event: 'message', sender: { id: 'u1' }, message: { type: 'picture', media: 'https://x/y.jpg' } });
    expect(viberAdapter.parse(pic)[0]).toMatchObject({ kind: 'image', media: 'https://x/y.jpg' });
    const voice = JSON.stringify({ event: 'message', sender: { id: 'u1' }, message: { type: 'file', media: 'https://x/v.m4a', file_name: 'v.m4a' } });
    expect(viberAdapter.parse(voice)[0]).toMatchObject({ kind: 'voice' });
    expect(viberAdapter.parse(JSON.stringify({ event: 'delivered' }))).toEqual([]);
  });

  it('is disabled by the feature flag', () => {
    process.env.FEATURE_VIBER = 'off';
    resetEnv();
    expect(viberAdapter.enabled()).toBe(false);
  });
});

describe('whatsapp adapter', () => {
  const body = JSON.stringify({
    entry: [{ changes: [{ value: { messages: [
      { from: '306900000001', type: 'text', text: { body: 'ALT-123456' } },
      { from: '306900000001', type: 'image', image: { id: 'm1', mime_type: 'image/jpeg' } },
      { from: '306900000001', type: 'audio', audio: { id: 'm2', mime_type: 'audio/ogg' } },
      { from: '306900000001', type: 'sticker' },
    ] } }] }],
  });

  it('accepts only correctly signed webhooks', () => {
    expect(whatsappAdapter.verify(req({ 'x-hub-signature-256': `sha256=${hmacHex('wa-secret', body)}` }), body)).toBe(true);
    expect(whatsappAdapter.verify(req({ 'x-hub-signature-256': `sha256=${hmacHex('nope', body)}` }), body)).toBe(false);
  });

  it('maps every message type', () => {
    expect(whatsappAdapter.parse(body).map((m) => m.kind)).toEqual(['text', 'image', 'voice', 'unsupported']);
  });
});
