import { isLocale } from '@alt/i18n';
import { z } from 'zod';
import { assertGuardian, requestUser } from '@/server/auth';
import { stripeBilling } from '@/server/billing/stripe';
import { env } from '@/server/env';
import { HttpError, errorResponse, supabaseAdmin } from '@/server/supabase';

const Body = z.object({
  circleId: z.string().uuid(),
  priceKey: z.enum(['family_monthly', 'family_yearly', 'family_plus_monthly']),
  locale: z.string().optional(),
});

/** Starts Stripe Checkout for a circle's subscription (guardians only, on the website). */
export async function POST(req: Request) {
  try {
    const user = await requestUser(req);
    const body = Body.safeParse(await req.json().catch(() => null));
    if (!body.success) throw new HttpError(400, 'invalid_request');
    await assertGuardian(user.id, body.data.circleId);
    const locale = isLocale(body.data.locale) ? body.data.locale : 'el';
    const { data } = await supabaseAdmin().from('circles').select('stripe_customer_id').eq('id', body.data.circleId).single();
    const site = env().NEXT_PUBLIC_SITE_URL;
    const { url } = await stripeBilling.createCheckout({
      circleId: body.data.circleId,
      priceKey: body.data.priceKey,
      email: user.email ?? null,
      customerId: (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null,
      locale,
      successUrl: `${site}/${locale}/app/billing?status=success`,
      cancelUrl: `${site}/${locale}/app/billing?status=cancelled`,
    });
    return Response.json({ url });
  } catch (error) {
    return errorResponse(error);
  }
}
