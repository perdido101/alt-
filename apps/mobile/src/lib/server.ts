import Constants from 'expo-constants';
import { analyticsHeader } from './analytics';
import { supabase } from './supabase';

/** Base URL of the ΑΛΤ! server routes (the Next.js app on Vercel). */
export const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.webUrl as string | undefined) ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

/** Authenticated call to our server with the current Supabase session. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), ...analyticsHeader(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'internal_error');
  return body;
}

export type PublicConfig = { viber: boolean; viberBotName: string; whatsapp: boolean };

export async function publicConfig(): Promise<PublicConfig> {
  try {
    const res = await fetch(`${apiUrl}/api/config`);
    return (await res.json()) as PublicConfig;
  } catch {
    return { viber: false, viberBotName: 'ΑΛΤ!', whatsapp: false };
  }
}
