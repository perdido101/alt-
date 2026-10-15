import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';
import { HttpError } from './supabase';

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`;

export const LIMITS = {
  analyzeUser: { tokens: 20, window: '1 h' },
  analyzeCircle: { tokens: 60, window: '1 h' },
  inviteCircle: { tokens: 20, window: '1 d' },
  reportUser: { tokens: 20, window: '1 d' },
  alertUser: { tokens: 10, window: '1 h' },
  publicForm: { tokens: 5, window: '1 h' },
} as const satisfies Record<string, { tokens: number; window: Window }>;

export type LimitName = keyof typeof LIMITS;

const limiters = new Map<LimitName, Ratelimit>();
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const e = env();
  redis = e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN ? new Redis({ url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN }) : null;
  return redis;
}

// Development fallback (single instance only): fixed window counters in memory.
const memory = new Map<string, { count: number; resetAt: number }>();
const windowMs = (w: Window) => {
  const [n, unit] = w.split(' ') as [string, 's' | 'm' | 'h' | 'd'];
  return Number(n) * { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
};

/** Throws 429 when `key` exceeded the named limit. Upstash in production, memory in development. */
export async function enforceLimit(name: LimitName, key: string): Promise<void> {
  const { tokens, window } = LIMITS[name];
  const r = getRedis();
  if (r) {
    let limiter = limiters.get(name);
    if (!limiter) {
      limiter = new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(tokens, window), prefix: `alt:${name}` });
      limiters.set(name, limiter);
    }
    const { success } = await limiter.limit(key);
    if (!success) throw new HttpError(429, 'rate_limited');
    return;
  }
  const k = `${name}:${key}`;
  const now = Date.now();
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + windowMs(window) });
    return;
  }
  entry.count += 1;
  if (entry.count > tokens) throw new HttpError(429, 'rate_limited');
}
