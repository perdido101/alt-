import { ApiError } from './server';

/** Maps server errors to messages the parent can act on. */
export function checkErrorKey(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return 'check.tooMany';
    if (e.status === 413) return 'check.tooLong';
    if (e.status === 0) return 'errors.offline';
  }
  return 'errors.generic';
}
