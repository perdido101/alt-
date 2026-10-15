import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Optional 4-digit app PIN for the parent's phone. Only a salted SHA-256 is stored, in the keystore.
 * 5 wrong tries lock entry for a minute. It never blocks the family-alert button (see the lock screen).
 */
const KEY = 'alt.pin';
const MAX_TRIES = 5;
const LOCKOUT_MS = 60_000;
type Stored = { salt: string; hash: string; fails: number; lockedUntil: number };

async function read(): Promise<Stored | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? (JSON.parse(raw) as Stored) : null;
}
const write = (s: Stored) => SecureStore.setItemAsync(KEY, JSON.stringify(s));
const digest = (salt: string, pin: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export async function hasPin(): Promise<boolean> {
  return (await read()) !== null;
}

export async function setPin(pin: string): Promise<void> {
  if (!isValidPin(pin)) throw new Error('invalid_pin');
  const salt = Crypto.randomUUID();
  await write({ salt, hash: await digest(salt, pin), fails: 0, lockedUntil: 0 });
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

export type PinResult = 'ok' | 'wrong' | 'locked';

export async function verifyPin(pin: string, now = Date.now()): Promise<PinResult> {
  const s = await read();
  if (!s) return 'ok';
  if (s.lockedUntil > now) return 'locked';
  if ((await digest(s.salt, pin)) === s.hash) {
    await write({ ...s, fails: 0, lockedUntil: 0 });
    return 'ok';
  }
  const fails = s.fails + 1;
  await write({ ...s, fails: fails >= MAX_TRIES ? 0 : fails, lockedUntil: fails >= MAX_TRIES ? now + LOCKOUT_MS : 0 });
  return fails >= MAX_TRIES ? 'locked' : 'wrong';
}
