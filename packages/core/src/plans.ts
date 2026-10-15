import type { Plan } from './enums';

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
