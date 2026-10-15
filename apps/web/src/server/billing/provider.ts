import 'server-only';
import type { Plan, PriceKey } from '@alt/core';
import type { Locale } from '@alt/i18n';

export type CheckoutRequest = {
  circleId: string;
  priceKey: Extract<PriceKey, 'family_monthly' | 'family_yearly' | 'family_plus_monthly'>;
  email: string | null;
  customerId: string | null;
  locale: Locale;
  successUrl: string;
  cancelUrl: string;
};

export type GiftCheckoutRequest = {
  priceKey: Extract<PriceKey, 'gift_3m' | 'gift_6m' | 'gift_12m'>;
  email: string | null;
  recipientName: string | null;
  locale: Locale;
  successUrl: string;
  cancelUrl: string;
};

/**
 * Payments. Stripe (website checkout + customer portal) is the implementation. App-store billing is a stub:
 * the apps never show purchase UI in parent mode, and guardian mode only displays the plan
 * (see docs/DECISIONS.md, "store billing").
 */
export interface BillingProvider {
  createCheckout(req: CheckoutRequest): Promise<{ url: string }>;
  createGiftCheckout(req: GiftCheckoutRequest): Promise<{ url: string }>;
  createPortal(customerId: string, returnUrl: string, locale: Locale): Promise<{ url: string }>;
}

export type StorePlatform = 'play' | 'app_store';

/** Placeholder for Google Play Billing / StoreKit if store policy ever requires in-app purchase. */
export const storeBillingStub = {
  async verifyPurchase(_platform: StorePlatform, _token: string): Promise<{ plan: Plan; expiresAt: Date } | null> {
    throw new Error('store_billing_not_implemented');
  },
};
