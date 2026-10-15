import { describe, expect, it } from 'vitest';
import { buildInviteDeepLink, buildInviteUrl, parseInviteToken } from './invite';

const token = 'abcDEF0123456789_-abcDEF0123456789_-abcdef';

describe('invite links', () => {
  it('round-trips web and deep links', () => {
    expect(parseInviteToken(buildInviteUrl(token, 'https://alt.example/'))).toBe(token);
    expect(parseInviteToken(buildInviteDeepLink(token))).toBe(token);
    expect(parseInviteToken(`https://alt.example/j/${token}?utm=qr`)).toBe(token);
  });

  it('accepts a bare token', () => {
    expect(parseInviteToken(`  ${token} `)).toBe(token);
  });

  it('rejects anything else', () => {
    expect(parseInviteToken('https://alt.example/j/short')).toBeNull();
    expect(parseInviteToken('hello')).toBeNull();
    expect(parseInviteToken(`https://evil.example/x/${token}`)).toBeNull();
  });
});
