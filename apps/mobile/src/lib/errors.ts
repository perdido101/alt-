/**
 * Maps errors raised by our Postgres RPCs (`raise exception 'invite_expired'`) to i18n keys,
 * so screens never show raw database text.
 */
const KNOWN: Record<string, string> = {
  invite_invalid: 'errors.inviteInvalid',
  invite_expired: 'errors.inviteExpired',
  circle_full: 'errors.circleFull',
  safe_word_too_short: 'errors.safeWordTooShort',
};

export function errorKey(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : '';
  if (KNOWN[message]) return KNOWN[message];
  if (message.startsWith('errors.')) return message;
  if (/network|fetch/i.test(message)) return 'errors.offline';
  return 'errors.generic';
}

