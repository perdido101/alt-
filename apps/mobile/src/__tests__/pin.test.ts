import { clearPin, hasPin, setPin, verifyPin } from '@/lib/pin';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockStore.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockStore.set(k, v),
  deleteItemAsync: async (k: string) => void mockStore.delete(k),
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  randomUUID: () => 'salt',
  digestStringAsync: async (_a: string, s: string) => `h(${s})`,
}));

describe('parent PIN', () => {
  beforeEach(() => mockStore.clear());

  it('stores only a salted hash', async () => {
    await setPin('1234');
    expect(await hasPin()).toBe(true);
    expect([...mockStore.values()].join()).not.toContain('"1234"');
  });

  it('verifies and locks after 5 wrong tries', async () => {
    await setPin('1234');
    expect(await verifyPin('1234', 0)).toBe('ok');
    for (let i = 0; i < 4; i++) expect(await verifyPin('0000', 0)).toBe('wrong');
    expect(await verifyPin('0000', 0)).toBe('locked');
    expect(await verifyPin('1234', 1000)).toBe('locked');
    expect(await verifyPin('1234', 61_000)).toBe('ok');
  });

  it('no PIN means unlocked; rejects non-4-digit PINs', async () => {
    expect(await verifyPin('9999')).toBe('ok');
    await expect(setPin('12a4')).rejects.toThrow();
    await setPin('4321');
    await clearPin();
    expect(await hasPin()).toBe(false);
  });
});
