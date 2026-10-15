import { env } from '@/server/env';

/** Public feature flags for the apps (no secrets). */
export async function GET() {
  const e = env();
  return Response.json(
    {
      viber: e.FEATURE_VIBER === 'on' && !!e.VIBER_AUTH_TOKEN,
      viberBotName: e.VIBER_BOT_NAME,
      whatsapp: e.FEATURE_WHATSAPP === 'on' && !!e.WHATSAPP_ACCESS_TOKEN,
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
