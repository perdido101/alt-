/**
 * Creates (or updates) ΑΛΤ! products, prices and the Customer Portal in Stripe from packages/core/src/plans.ts.
 * Idempotent: prices are found by lookup_key; a changed amount creates a new price and moves the lookup key.
 *
 *   STRIPE_SECRET_KEY=sk_test_... pnpm stripe:setup     (test mode)
 *   STRIPE_SECRET_KEY=sk_live_... pnpm stripe:setup     (live mode)
 */
import Stripe from 'stripe';
import { priceLookupKeys, pricing } from '../packages/core/src/plans';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY');
  process.exit(1);
}
const stripe = new Stripe(key);
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alt.example';

type PriceSpec = { lookup: string; amount: number; recurring?: Stripe.PriceCreateParams.Recurring; nickname: string };
type ProductSpec = { id: string; name: string; description: string; prices: PriceSpec[] };

const products: ProductSpec[] = [
  {
    id: 'alt_family',
    name: 'ΑΛΤ! Οικογένεια',
    description: 'Προστασία από απάτες για 2 γονείς και 4 φροντιστές.',
    prices: [
      { lookup: priceLookupKeys.family_monthly, amount: pricing.family.monthly, recurring: { interval: 'month' }, nickname: 'Family monthly' },
      { lookup: priceLookupKeys.family_yearly, amount: pricing.family.yearly, recurring: { interval: 'year' }, nickname: 'Family yearly' },
    ],
  },
  {
    id: 'alt_family_plus',
    name: 'ΑΛΤ! Οικογένεια+',
    description: 'Προστασία από απάτες για έως 4 γονείς.',
    prices: [{ lookup: priceLookupKeys.family_plus_monthly, amount: pricing.family_plus.monthly, recurring: { interval: 'month' }, nickname: 'Family+ monthly' }],
  },
  {
    id: 'alt_gift',
    name: 'ΑΛΤ! Δώρο (Οικογένεια)',
    description: 'Κωδικός δώρου για το πρόγραμμα Οικογένεια.',
    prices: [
      { lookup: priceLookupKeys.gift_3m, amount: pricing.gift.months3, nickname: 'Gift 3 months' },
      { lookup: priceLookupKeys.gift_6m, amount: pricing.gift.months6, nickname: 'Gift 6 months' },
      { lookup: priceLookupKeys.gift_12m, amount: pricing.gift.months12, nickname: 'Gift 12 months' },
    ],
  },
];

async function ensureProduct(p: ProductSpec): Promise<string> {
  try {
    const existing = await stripe.products.retrieve(p.id);
    await stripe.products.update(p.id, { name: p.name, description: p.description, active: true });
    return existing.id;
  } catch {
    const created = await stripe.products.create({ id: p.id, name: p.name, description: p.description, tax_code: 'txcd_10103001' });
    return created.id;
  }
}

async function ensurePrice(productId: string, spec: PriceSpec): Promise<string> {
  const { data } = await stripe.prices.list({ lookup_keys: [spec.lookup], active: true, limit: 1 });
  const current = data[0];
  const same =
    current &&
    current.unit_amount === spec.amount &&
    current.product === productId &&
    (current.recurring?.interval ?? null) === (spec.recurring?.interval ?? null);
  if (same) return `${spec.lookup}: unchanged (${current.id})`;
  const created = await stripe.prices.create({
    product: productId,
    currency: pricing.currency,
    unit_amount: spec.amount,
    recurring: spec.recurring,
    lookup_key: spec.lookup,
    transfer_lookup_key: true,
    nickname: spec.nickname,
    // Greek consumer prices are shown VAT-inclusive.
    tax_behavior: 'inclusive',
  });
  if (current) await stripe.prices.update(current.id, { active: false });
  return `${spec.lookup}: ${current ? 'replaced' : 'created'} (${created.id})`;
}

async function ensurePortal(subscriptionPrices: Array<{ product: string; prices: string[] }>) {
  const config: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: { headline: 'ΑΛΤ! · Πριν πληρώσεις, ρώτα.', privacy_policy_url: `${SITE}/el/privacy`, terms_of_service_url: `${SITE}/el/terms` },
    features: {
      customer_update: { enabled: true, allowed_updates: ['email', 'address', 'tax_id'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      subscription_update: { enabled: true, default_allowed_updates: ['price'], proration_behavior: 'create_prorations', products: subscriptionPrices },
    },
  };
  const { data } = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
  if (data[0]) await stripe.billingPortal.configurations.update(data[0].id, config);
  else await stripe.billingPortal.configurations.create(config);
}

const results: string[] = [];
const portalProducts: Array<{ product: string; prices: string[] }> = [];
for (const p of products) {
  const productId = await ensureProduct(p);
  for (const price of p.prices) results.push(await ensurePrice(productId, price));
  if (p.id !== 'alt_gift') {
    const { data } = await stripe.prices.list({ product: productId, active: true, limit: 10 });
    portalProducts.push({ product: productId, prices: data.map((d) => d.id) });
  }
}
await ensurePortal(portalProducts);
console.log(results.join('\n'));
console.log('Customer Portal configured. Remember: enable Stripe Tax and add your EU VAT registration in the Dashboard.');
