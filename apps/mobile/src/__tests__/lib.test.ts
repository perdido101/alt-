import { chunkedSecureStorage } from '@/lib/secureStorage';
import { errorKey } from '@/lib/errors';
import { greetingKey } from '@/lib/greeting';
import { useAppStore } from '@/lib/store';

describe('greetingKey', () => {
  it('says good morning before 13:00 and good evening after', () => {
    expect(greetingKey(new Date(2026, 0, 1, 9))).toBe('parent.home.greetingMorning');
    expect(greetingKey(new Date(2026, 0, 1, 12, 59))).toBe('parent.home.greetingMorning');
    expect(greetingKey(new Date(2026, 0, 1, 13))).toBe('parent.home.greetingEvening');
    expect(greetingKey(new Date(2026, 0, 1, 2))).toBe('parent.home.greetingEvening');
  });
});

describe('errorKey', () => {
  it('maps RPC errors to friendly messages', () => {
    expect(errorKey(new Error('invite_expired'))).toBe('errors.inviteExpired');
    expect(errorKey(new Error('circle_full'))).toBe('errors.circleFull');
    expect(errorKey(new Error('errors.phoneInvalid'))).toBe('errors.phoneInvalid');
    expect(errorKey(new Error('TypeError: Network request failed'))).toBe('errors.offline');
    expect(errorKey(new Error('relation "x" does not exist'))).toBe('errors.generic');
  });
});

describe('chunkedSecureStorage', () => {
  it('round-trips values larger than one SecureStore entry', async () => {
    const big = 'x'.repeat(5000) + 'Μαρία';
    await chunkedSecureStorage.setItem('sb-test-auth-token', big);
    expect(await chunkedSecureStorage.getItem('sb-test-auth-token')).toBe(big);
    await chunkedSecureStorage.setItem('sb-test-auth-token', 'small');
    expect(await chunkedSecureStorage.getItem('sb-test-auth-token')).toBe('small');
    await chunkedSecureStorage.removeItem('sb-test-auth-token');
    expect(await chunkedSecureStorage.getItem('sb-test-auth-token')).toBeNull();
  });
});

describe('app store', () => {
  it('defaults to Greek, extra large text', () => {
    useAppStore.getState().reset();
    expect(useAppStore.getState().locale).toBe('el');
    expect(useAppStore.getState().textScale).toBe('extraLarge');
  });

  it('never moves setup progress backwards', () => {
    useAppStore.getState().reset();
    useAppStore.getState().completeSetupStep('family');
    useAppStore.getState().completeSetupStep('language');
    expect(useAppStore.getState().setupProgress).toBe(2);
  });
});
