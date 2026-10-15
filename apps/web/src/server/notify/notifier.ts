import 'server-only';
import { env } from '../env';

export type PushMessage = { title: string; body: string; data?: Record<string, string> };
export type PushResult = { token: string; ok: boolean; ref?: string; error?: string };

/** Push notifications. Expo push (FCM/APNs) in production; swappable. */
export interface Notifier {
  send(tokens: string[], message: PushMessage): Promise<PushResult[]>;
}

type ExpoTicket = { status: 'ok' | 'error'; id?: string; message?: string; details?: { error?: string } };

export const expoNotifier: Notifier = {
  async send(tokens, message) {
    if (tokens.length === 0) return [];
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token = env().EXPO_ACCESS_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const body = tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
      priority: 'high',
      channelId: 'alerts',
      interruptionLevel: 'time-sensitive',
    }));
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers, body: JSON.stringify(body) });
      const json = (await res.json()) as { data?: ExpoTicket[] };
      return tokens.map((t, i) => {
        const ticket = json.data?.[i];
        return ticket?.status === 'ok' ? { token: t, ok: true, ref: ticket.id } : { token: t, ok: false, error: ticket?.details?.error ?? ticket?.message ?? `http_${res.status}` };
      });
    } catch {
      return tokens.map((t) => ({ token: t, ok: false, error: 'network' }));
    }
  },
};

export function notifier(): Notifier {
  return expoNotifier;
}
