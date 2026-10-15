import 'server-only';
import { z } from 'zod';

/**
 * Server environment. Everything here is secret or server-side config and must never use the
 * NEXT_PUBLIC_ prefix (except the two Supabase public values, which are safe by design).
 * Every variable is optional so the site builds without accounts; features check for what they need.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default('claude-opus-5-5'),
  ANALYSIS_EFFORT: z.enum(['low', 'medium', 'high']).default('medium'),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  /** Hours to keep raw screenshots/voice notes after analysis. 0 = never stored. */
  RAW_MEDIA_RETENTION_HOURS: z.coerce.number().int().min(0).max(720).default(0),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  QSTASH_TOKEN: z.string().min(1).optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),

  FEATURE_VIBER: z.enum(['on', 'off']).default('off'),
  FEATURE_WHATSAPP: z.enum(['on', 'off']).default('off'),
  VIBER_AUTH_TOKEN: z.string().min(1).optional(),
  VIBER_BOT_NAME: z.string().default('ΑΛΤ!'),
  WHATSAPP_APP_SECRET: z.string().min(1).optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_GRAPH_VERSION: z.string().default('v21.0'),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().default('ΑΛΤ! <hello@alt.example>'),
  SUPPORT_EMAIL: z.string().default('hello@alt.example'),
  /** Where B2B / contact form submissions are emailed. */
  SALES_EMAIL: z.string().default('hello@alt.example'),

  EXPO_ACCESS_TOKEN: z.string().min(1).optional(),
  SMS_PROVIDER: z.enum(['twilio', 'console']).default('console'),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  SMS_SENDER_ID: z.string().default('ALT'),
  ALERT_ESCALATION_MINUTES: z.coerce.number().int().min(1).max(60).default(5),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;
export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}

/** For tests. */
export function resetEnv() {
  cached = null;
}
