/**
 * Invite links. Tokens are created by public.create_invite() (32 random bytes, base64url) and only their
 * SHA-256 hash is stored. A link looks like https://<web>/j/<token> (universal/app link) or alt://join/<token>.
 */
export const INVITE_TTL_HOURS = 72;
export const APP_SCHEME = 'alt';

const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

export function buildInviteUrl(token: string, webBaseUrl: string): string {
  return `${webBaseUrl.replace(/\/+$/, '')}/j/${token}`;
}

export function buildInviteDeepLink(token: string): string {
  return `${APP_SCHEME}://join/${token}`;
}

/** Accepts a web link, a deep link or a bare token (pasted or scanned). Returns null if none is found. */
export function parseInviteToken(input: string): string | null {
  const s = input.trim();
  if (TOKEN.test(s)) return s;
  const m = s.match(/(?:\/j\/|:\/\/join\/)([A-Za-z0-9_-]{32,64})(?:[/?#]|$)/);
  return m ? m[1]! : null;
}
