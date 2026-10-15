import 'server-only';
import { pricing, priceLookupKeys, type PriceKey } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import Stripe from 'stripe';
import { env } from '../env';
import { HttpError } from '../supabase';
import type { BillingProvider } from './provider';

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, 'billing_not_configured');
  client ??= new Stripe(key, { maxNetworkRetries: 2, appInfo: { name: 'alt-web' } });
  return client;
}

const priceCache = new Map<string, string>();

/** Price ids are looked up by lookup_key, so test and live modes need no code changes. */
export async function priceId(key: PriceKey): Promise<string> {
  const lookup = priceLookupKeys[key];
  const cached = priceCache.get(lookup);
  if (cached) return cached;
  const { data } = await stripe().prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  const id = data[0]?.id;
  if (!id) throw new HttpError(503, `price_missing_${lookup}`);
  priceCache.set(lookup, id);
  return id;
}

const stripeLocale = (l: Locale) => (l === 'el' ? 'el' : 'en') as Stripe.Checkout.SessionCreateParams.Locale;

export const stripeBilling: BillingProvider = {
  async createCheckout(req) {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: await priceId(req.priceKey), quantity: 1 }],
      customer: req.customerId ?? undefined,
      customer_email: req.customerId ? undefined : (req.email ?? undefined),
      client_reference_id: req.circleId,
      metadata: { circle_id: req.circleId },
      subscription_data: {
        metadata: { circle_id: req.circleId },
        ...(req.priceKey.startsWith('family_') && req.priceKey !== 'family_plus_monthly' ? { trial_period_days: pricing.family.trialDays } : {}),
      },
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      locale: stripeLocale(req.locale),
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
    });
    if (!session.url) throw new HttpError(502, 'checkout_failed');
    return { url: session.url };
  },

  async createGiftCheckout(req) {
    const months = req.priceKey === 'gift_3m' ? 3 : req.priceKey === 'gift_6m' ? 6 : 12;
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: await priceId(req.priceKey), quantity: 1 }],
      customer_email: req.email ?? undefined,
      customer_creation: 'if_required',
      metadata: { kind: 'gift', months: String(months), plan: 'family', recipient_name: req.recipientName ?? '', locale: req.locale },
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      locale: stripeLocale(req.locale),
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
    });
    if (!session.url) throw new HttpError(502, 'checkout_failed');
    return { url: session.url };
  },

  async createPortal(customerId, returnUrl, locale) {
    const session = await stripe().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl, locale: stripeLocale(locale) });
    return { url: session.url };
  },
};

export const localeTag = (l: Locale) => localeTags[l];
