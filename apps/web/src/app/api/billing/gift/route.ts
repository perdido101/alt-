import { isLocale } from '@alt/i18n';
import { z } from 'zod';
import { stripeBilling } from '@/server/billing/stripe';
import { env } from '@/server/env';
import { enforceLimit } from '@/server/rateLimit';
import { HttpError, errorResponse } from '@/server/supabase';

const Body = z.object({
  priceKey: z.enum(['gift_3m', 'gift_6m', 'gift_12m']),
  email: z.string().email().optional(),
  recipientName: z.string().max(60).optional(),
  locale: z.string().optional(),
});

/** "Χάρισε ασφάλεια": anyone can buy a gift code; no account needed. */
export async function POST(req: Request) {
  try {
    await enforceLimit('publicForm', req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown');
    const body = Body.safeParse(await req.json().catch(() => null));
    if (!body.success) throw new HttpError(400, 'invalid_request');
    const locale = isLocale(body.data.locale) ? body.data.locale : 'el';
    const site = env().NEXT_PUBLIC_SITE_URL;
    return Response.json(
      await stripeBilling.createGiftCheckout({
        priceKey: body.data.priceKey,
        email: body.data.email ?? null,
        recipientName: body.data.recipientName ?? null,
        locale,
        successUrl: `${site}/${locale}/gift/thanks`,
        cancelUrl: `${site}/${locale}/gift`,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
