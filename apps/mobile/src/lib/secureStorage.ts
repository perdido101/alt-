import * as SecureStore from 'expo-secure-store';

/**
 * Supabase session storage backed by the OS keystore. SecureStore values are limited to ~2 KB, and a
 * session is larger, so values are split into chunks. Losing the parent's anonymous session would unbind
 * their phone from the circle, so it lives in the keystore rather than AsyncStorage.
 */
const CHUNK = 1800;
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const chunkedSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    const k = safeKey(key);
    const count = await SecureStore.getItemAsync(`${k}.n`, opts);
    if (count === null) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${k}.${i}`, opts);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const k = safeKey(key);
    await this.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), opts);
    }
    await SecureStore.setItemAsync(`${k}.n`, String(n), opts);
  },

  async removeItem(key: string): Promise<void> {
    const k = safeKey(key);
    const count = await SecureStore.getItemAsync(`${k}.n`, opts);
    await SecureStore.deleteItemAsync(`${k}.n`, opts);
    for (let i = 0; i < Number(count ?? 0); i++) await SecureStore.deleteItemAsync(`${k}.${i}`, opts);
  },
};
