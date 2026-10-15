import { isLocale } from '@alt/i18n';
import { z } from 'zod';
import { assertGuardian, requestUser } from '@/server/auth';
import { stripeBilling } from '@/server/billing/stripe';
import { env } from '@/server/env';
import { HttpError, errorResponse, supabaseAdmin } from '@/server/supabase';

/** Stripe Customer Portal: plan changes, cancellation, card updates. */
export async function POST(req: Request) {
  try {
    const user = await requestUser(req);
    const body = z.object({ circleId: z.string().uuid(), locale: z.string().optional() }).safeParse(await req.json().catch(() => null));
    if (!body.success) throw new HttpError(400, 'invalid_request');
    await assertGuardian(user.id, body.data.circleId);
    const { data } = await supabaseAdmin().from('circles').select('stripe_customer_id').eq('id', body.data.circleId).single();
    const customer = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
    if (!customer) throw new HttpError(404, 'no_customer');
    const locale = isLocale(body.data.locale) ? body.data.locale : 'el';
    return Response.json(await stripeBilling.createPortal(customer, `${env().NEXT_PUBLIC_SITE_URL}/${locale}/app/billing`, locale));
  } catch (error) {
    return errorResponse(error);
  }
}
