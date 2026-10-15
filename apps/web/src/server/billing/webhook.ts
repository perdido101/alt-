import 'server-only';
import { GRACE_DAYS, planForLookupKey, type Plan } from '@alt/core';
import { isLocale } from '@alt/i18n';
import { randomBytes } from 'node:crypto';
import type Stripe from 'stripe';
import { sendGiftCodeEmail, sendPaymentFailedEmail } from '../email/send';
import { supabaseAdmin } from '../supabase';
import { stripe } from './stripe';

type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';

function mapStatus(s: Stripe.Subscription.Status): SubStatus {
  switch (s) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

/** Gift codes: 12 characters from an unambiguous alphabet, e.g. ALT-7KQ2-M9XD. */
export function newGiftCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `ALT-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/** Writes the subscription and the circle's effective plan. Paid status never removes protection mid-incident. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const circleId = sub.metadata.circle_id;
  if (!circleId) return;
  const db = supabaseAdmin();
  const item = sub.items.data[0];
  const lookup = item?.price.lookup_key ?? null;
  const plan: Plan = planForLookupKey(lookup) ?? 'family';
  const status = mapStatus(sub.status);
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const { data: existing } = await db.from('subscriptions').select('grace_until').eq('circle_id', circleId).maybeSingle();
  const graceUntil =
    status === 'past_due'
      ? ((existing as { grace_until: string | null } | null)?.grace_until ?? new Date(Date.now() + GRACE_DAYS * 86_400_000).toISOString())
      : null;

  await db.from('subscriptions').upsert(
    {
      circle_id: circleId,
      plan,
      status,
      provider: 'stripe',
      provider_customer_id: customer,
      provider_subscription_id: sub.id,
      stripe_price_lookup: lookup,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      grace_until: graceUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'circle_id' },
  );
  await db.from('circles').update({ stripe_customer_id: customer }).eq('id', circleId);
  // Upgrades apply immediately. Downgrades (canceled, grace expired) are applied by the daily billing job
  // at a safe moment: never while an alert is open.
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    await db.from('circles').update({ plan }).eq('id', circleId);
  }
}

async function createGift(session: Stripe.Checkout.Session): Promise<void> {
  const db = supabaseAdmin();
  const { data: already } = await db.from('gift_codes').select('id').eq('stripe_checkout_session_id', session.id).maybeSingle();
  if (already) return;
  const months = Number(session.metadata?.months ?? 12);
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  let code = newGiftCode();
  for (let i = 0; i < 3; i++) {
    const { error } = await db.from('gift_codes').insert({
      code,
      plan: (session.metadata?.plan as Plan) ?? 'family',
      months,
      purchaser_email: email,
      stripe_checkout_session_id: session.id,
    });
    if (!error) break;
    code = newGiftCode();
  }
  const locale = isLocale(session.metadata?.locale) ? session.metadata.locale : 'el';
  if (email) await sendGiftCodeEmail({ to: email, code, months, recipientName: session.metadata?.recipient_name || null, locale });
}

async function guardiansEmails(circleId: string): Promise<Array<{ email: string; locale: 'el' | 'en' }>> {
  const db = supabaseAdmin();
  const { data } = await db.from('circle_members').select('user_id').eq('circle_id', circleId).eq('role', 'guardian');
  const ids = ((data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
  if (!ids.length) return [];
  const { data: profiles } = await db.from('profiles').select('email, locale').in('id', ids);
  return ((profiles ?? []) as Array<{ email: string | null; locale: string }>).filter((p) => p.email).map((p) => ({ email: p.email!, locale: isLocale(p.locale) ? p.locale : 'el' }));
}

/** Handles one verified Stripe event exactly once (stripe_events is the idempotency log). */
export async function handleStripeEvent(event: Stripe.Event): Promise<'processed' | 'duplicate' | 'ignored'> {
  const db = supabaseAdmin();
  const { error: dup } = await db.from('stripe_events').insert({ id: event.id, type: event.type });
  if (dup) {
    const { data } = await db.from('stripe_events').select('processed_at').eq('id', event.id).single();
    if ((data as { processed_at: string | null } | null)?.processed_at) return 'duplicate';
  }

  let handled = true;
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'payment' && session.metadata?.kind === 'gift' && session.payment_status === 'paid') await createGift(session);
      else if (session.mode === 'subscription' && session.subscription) {
        const id = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        await syncSubscription(await stripe().subscriptions.retrieve(id));
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object);
      break;
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subRef = invoice.parent?.subscription_details?.subscription;
      if (!subRef) break;
      const sub = await stripe().subscriptions.retrieve(typeof subRef === 'string' ? subRef : subRef.id);
      await syncSubscription(sub);
      if (event.type === 'invoice.payment_failed' && sub.metadata.circle_id) {
        for (const g of await guardiansEmails(sub.metadata.circle_id)) await sendPaymentFailedEmail({ to: g.email, locale: g.locale, graceDays: GRACE_DAYS });
      }
      break;
    }
    default:
      handled = false;
  }
  await db.from('stripe_events').update({ processed_at: new Date().toISOString() }).eq('id', event.id);
  return handled ? 'processed' : 'ignored';
}
