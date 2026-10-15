/**
 * Product analytics (PostHog EU) and error-report scrubbing, shared by web, mobile and server.
 *
 * Rules: only the events listed here, only the listed properties, never message text, phone numbers,
 * names, emails, safe words or IBANs. Distinct ids are random per install (or the Supabase user id on
 * the server), never an email or phone. Users can opt out (mobile settings / web consent banner).
 */
export const analyticsEvents = {
  app_opened: ['mode'],
  setup_step_completed: ['step', 'mode'],
  setup_completed: ['mode'],
  circle_created: [],
  invite_created: ['channel'],
  invite_accepted: [],
  message_checked: ['source', 'verdict', 'category', 'engine'],
  verdict_feedback: ['verdict', 'helpful'],
  family_alert_sent: ['source'],
  family_alert_answered: ['response', 'minutes'],
  family_alert_escalated: ['channel'],
  call_warning_shown: ['decision'],
  after_call_answered: ['answer'],
  number_reported: ['source'],
  quiz_answered: ['correct'],
  safe_word_set: [],
  checkout_started: ['plan', 'interval'],
  subscription_started: ['plan', 'interval'],
  gift_purchased: ['months'],
  licence_redeemed: [],
  radar_article_viewed: ['slug'],
  b2b_form_submitted: ['kind'],
  pin_set: [],
} as const satisfies Record<string, readonly string[]>;

export type AnalyticsEvent = keyof typeof analyticsEvents;
type Primitive = string | number | boolean | null;
export type AnalyticsProps = Record<string, Primitive>;

/** Drops properties not on the event's allow-list and any value that looks like personal data. */
export function sanitizeProps(event: AnalyticsEvent, props: AnalyticsProps = {}): AnalyticsProps {
  const allowed = new Set<string>(analyticsEvents[event]);
  const out: AnalyticsProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (!allowed.has(k)) continue;
    if (typeof v === 'string' && (v.length > 64 || looksPersonal(v))) continue;
    out[k] = v;
  }
  return out;
}

const PHONE = /\+?\d[\d\s().-]{6,}\d/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g;
const BEARER = /(bearer\s+|token=|key=|apikey=)[A-Za-z0-9._~+/-]+=*/gi;

export function looksPersonal(s: string): boolean {
  return [PHONE, EMAIL, IBAN].some((re) => {
    re.lastIndex = 0;
    return re.test(s);
  });
}

/** Masks phone numbers, emails, IBANs and tokens inside free text (error messages, breadcrumbs, URLs). */
export function scrubText(s: string): string {
  return s.replace(BEARER, '$1[token]').replace(EMAIL, '[email]').replace(IBAN, '[iban]').replace(PHONE, '[phone]');
}

/** Keys whose values are user content and are removed entirely from error reports. */
const SENSITIVE_KEYS = /^(text|message_text|content|transcript|body|safe_?word|phone|phone_number|number|e164|email|name|display_name|iban|password|token|authorization|cookie|image|audio)$/i;

/** Deep-scrubs any JSON-like value; used in Sentry beforeSend / beforeBreadcrumb on all platforms. */
export function scrubDeep<T>(value: T, depth = 0): T {
  if (depth > 8) return value;
  if (typeof value === 'string') return scrubText(value) as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v, depth + 1)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.test(k) ? '[removed]' : scrubDeep(v, depth + 1);
    }
    return out as T;
  }
  return value;
}

/** Minimal Sentry event shape we touch; avoids depending on @sentry/types here. */
export type ScrubbableEvent = {
  user?: unknown;
  request?: { cookies?: unknown; headers?: Record<string, string>; data?: unknown; query_string?: unknown; url?: string };
  [k: string]: unknown;
};

export function scrubSentryEvent<E extends object>(event: E): E {
  const e = scrubDeep({ ...event, user: undefined }) as unknown as ScrubbableEvent;
  if (e.request) {
    delete e.request.cookies;
    delete e.request.data;
    if (e.request.headers) {
      const { 'user-agent': ua, 'accept-language': al } = e.request.headers;
      e.request.headers = { ...(ua ? { 'user-agent': ua } : {}), ...(al ? { 'accept-language': al } : {}) };
    }
  }
  return e as unknown as E;
}

export const POSTHOG_EU_HOST = 'https://eu.i.posthog.com';

/** Builds a PostHog capture payload (works with fetch on every platform, no SDK). */
export function posthogPayload(apiKey: string, distinctId: string, event: AnalyticsEvent, props: AnalyticsProps = {}, extra: AnalyticsProps = {}) {
  return {
    api_key: apiKey,
    event,
    distinct_id: distinctId,
    properties: { ...sanitizeProps(event, props), ...extra, $process_person_profile: false, $ip: null },
    timestamp: new Date().toISOString(),
  };
}

export async function capture(opts: { apiKey?: string; host?: string; distinctId: string; event: AnalyticsEvent; props?: AnalyticsProps; extra?: AnalyticsProps; fetchImpl?: typeof fetch }) {
  if (!opts.apiKey) return;
  const f = opts.fetchImpl ?? fetch;
  try {
    await f(`${opts.host ?? POSTHOG_EU_HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(posthogPayload(opts.apiKey, opts.distinctId, opts.event, opts.props, opts.extra)),
    });
  } catch {
    // Analytics must never break the product.
  }
}
