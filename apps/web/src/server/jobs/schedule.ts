import 'server-only';
import { Client, Receiver } from '@upstash/qstash';
import { env } from '../env';

/**
 * Delayed jobs (alert escalation) via Upstash QStash: one message per alert, delivered once after the delay.
 * Without QStash (local development) a timer in this process stands in, and the escalation cron is the safety net.
 */
export async function scheduleJob(path: string, body: Record<string, unknown>, delaySeconds: number, dedupeId: string): Promise<void> {
  const e = env();
  const url = `${e.NEXT_PUBLIC_SITE_URL}${path}`;
  if (e.QSTASH_TOKEN) {
    await new Client({ token: e.QSTASH_TOKEN }).publishJSON({ url, body, delay: delaySeconds, deduplicationId: dedupeId, retries: 5 });
    return;
  }
  setTimeout(() => {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${e.CRON_SECRET ?? 'dev'}` },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  }, delaySeconds * 1000).unref?.();
}

/** Verifies a QStash-signed request, or the CRON_SECRET bearer used by Vercel Cron and the dev fallback. */
export async function verifyJobRequest(req: Request, rawBody: string): Promise<boolean> {
  const e = env();
  const signature = req.headers.get('upstash-signature');
  if (signature && e.QSTASH_CURRENT_SIGNING_KEY && e.QSTASH_NEXT_SIGNING_KEY) {
    const receiver = new Receiver({ currentSigningKey: e.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey: e.QSTASH_NEXT_SIGNING_KEY });
    return receiver.verify({ signature, body: rawBody }).catch(() => false);
  }
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (e.CRON_SECRET) return bearer === e.CRON_SECRET;
  return process.env.NODE_ENV !== 'production' && bearer === 'dev';
}
