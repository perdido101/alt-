import type { Plan, ProtectionLevel } from './enums';

export type PlanLimits = { guardians: number; protected: number };

/**
 * Circle size per plan. Family and Family+ come from the product spec; Free is our assumption
 * (1 parent, 2 guardians) and is flagged for review in docs/DECISIONS.md.
 * Must match public.plan_limits() in the database.
 */
export const planLimits: Record<Plan, PlanLimits> = {
  free: { guardians: 2, protected: 1 },
  family: { guardians: 4, protected: 2 },
  family_plus: { guardians: 4, protected: 4 },
};

/** Prices in euro cents, VAT included. Stripe prices are created from this by scripts/stripe-setup.ts. */
export const pricing = {
  currency: 'eur',
  free: { monthly: 0 },
  family: { monthly: 499, yearly: 3900, trialDays: 30 },
  family_plus: { monthly: 799 },
  gift: { months3: 1497, months6: 2994, months12: 3900 },
} as const;

export type Entitlements = {
  maxGuardians: number;
  maxProtected: number;
  /** AI-reviewed message checks per circle per calendar month (null = unlimited). Over the limit, checks still
   * run on the rule-based analyser: a parent is never refused a check. */
  monthlyModelChecks: number | null;
  /** SMS escalation after 5 minutes (costs us per message). Push alerts are always included. */
  smsEscalation: boolean;
  protectionLevels: ProtectionLevel[];
};

/**
 * What each plan includes. Safety basics (family alert by push, call warnings, safe word and quizzes,
 * after-call check-in) are in every plan, including Free, and are never switched off by a downgrade.
 * Free's limits are our assumption (docs/DECISIONS.md).
 */
export const entitlements: Record<Plan, Entitlements> = {
  free: { maxGuardians: 2, maxProtected: 1, monthlyModelChecks: 15, smsEscalation: false, protectionLevels: ['warn'] },
  family: { maxGuardians: 4, maxProtected: 2, monthlyModelChecks: null, smsEscalation: true, protectionLevels: ['warn', 'silence', 'block'] },
  family_plus: { maxGuardians: 4, maxProtected: 4, monthlyModelChecks: null, smsEscalation: true, protectionLevels: ['warn', 'silence', 'block'] },
};

/** Stripe price lookup keys created by scripts/stripe-setup.ts. */
export const priceLookupKeys = {
  family_monthly: 'alt_family_monthly',
  family_yearly: 'alt_family_yearly',
  family_plus_monthly: 'alt_family_plus_monthly',
  gift_3m: 'alt_gift_family_3m',
  gift_6m: 'alt_gift_family_6m',
  gift_12m: 'alt_gift_family_12m',
} as const;
export type PriceKey = keyof typeof priceLookupKeys;

export function planForLookupKey(key: string | null | undefined): Plan | null {
  if (key === priceLookupKeys.family_monthly || key === priceLookupKeys.family_yearly) return 'family';
  if (key === priceLookupKeys.family_plus_monthly) return 'family_plus';
  return null;
}

export const GRACE_DAYS = 7;

/** Formats euro cents the Greek way: 4,99 € / €4.99. */
export function formatPrice(cents: number, locale: 'el' | 'en'): string {
  return new Intl.NumberFormat(locale === 'el' ? 'el-GR' : 'en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
