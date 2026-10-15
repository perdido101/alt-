import { env } from '@/server/env';
import { supabaseAdmin } from '@/server/supabase';

export const dynamic = 'force-dynamic';

/**
 * Uptime check for BetterStack / UptimeRobot (see docs/OPERATIONS.md). Public, cheap, no secrets in output.
 * 200 when the database answers; 503 otherwise. `?deep=1` also reports which integrations are configured.
 */
export async function GET(req: Request) {
  const started = Date.now();
  const e = env();
  let database: 'ok' | 'down' | 'not_configured' = 'not_configured';
  if (e.NEXT_PUBLIC_SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await supabaseAdmin().from('official_numbers').select('id', { head: true, count: 'exact' }).limit(1);
      database = error ? 'down' : 'ok';
    } catch {
      database = 'down';
    }
  }
  const deep = new URL(req.url).searchParams.get('deep') === '1';
  const body = {
    status: database === 'down' ? 'degraded' : 'ok',
    database,
    latencyMs: Date.now() - started,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    ...(deep
      ? {
          integrations: {
            analysis: !!e.ANTHROPIC_API_KEY,
            transcription: !!e.ELEVENLABS_API_KEY,
            rateLimit: !!e.UPSTASH_REDIS_REST_URL,
            jobs: !!e.QSTASH_TOKEN,
            push: !!e.EXPO_ACCESS_TOKEN,
            sms: e.SMS_PROVIDER === 'twilio' && !!e.TWILIO_ACCOUNT_SID,
            billing: !!e.STRIPE_SECRET_KEY,
            email: !!e.RESEND_API_KEY,
          },
        }
      : {}),
  };
  return Response.json(body, { status: database === 'down' ? 503 : 200, headers: { 'cache-control': 'no-store' } });
}
