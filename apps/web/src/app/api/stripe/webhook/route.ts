import { stripe } from '@/server/billing/stripe';
import { handleStripeEvent } from '@/server/billing/webhook';
import { env } from '@/server/env';

export const runtime = 'nodejs';

/** Stripe webhook: signature-verified and idempotent (stripe_events). Subscription state lives in our DB. */
export async function POST(req: Request) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('not configured', { status: 400 });
  const raw = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response('invalid signature', { status: 400 });
  }
  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (error) {
    console.error('stripe_webhook_failed', event.type, error instanceof Error ? error.message : 'unknown');
    // 500 makes Stripe retry; processing is idempotent.
    return new Response('error', { status: 500 });
  }
}
