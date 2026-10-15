import { z } from 'zod';
import { sendInternalEmail } from '@/server/email/send';
import { env } from '@/server/env';
import { enforceLimit } from '@/server/rateLimit';
import { HttpError, errorResponse, supabaseAdmin } from '@/server/supabase';

const Body = z.object({
  kind: z.enum(['b2b', 'contact']),
  organisation: z.string().max(120).optional(),
  orgType: z.enum(['municipality', 'kapi', 'bank', 'telco', 'other']).optional(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
  locale: z.enum(['el', 'en']).default('el'),
  website: z.string().max(0).optional(), // honeypot must stay empty
});

/** B2B demo requests and contact form. Stored for the admin and emailed to us. */
export async function POST(req: Request) {
  try {
    await enforceLimit('publicForm', req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown');
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new HttpError(400, 'invalid_request');
    const b = parsed.data;
    if (env().SUPABASE_SERVICE_ROLE_KEY) {
      await supabaseAdmin().from('contact_requests').insert({
        kind: b.kind,
        organisation: b.organisation ?? null,
        org_type: b.orgType ?? null,
        name: b.name,
        email: b.email,
        phone: b.phone ?? null,
        message: b.message ?? null,
        locale: b.locale,
      });
    }
    await sendInternalEmail(`Νέο αίτημα (${b.kind}): ${b.organisation ?? b.name}`, [
      `${b.name} <${b.email}> ${b.phone ?? ''}`,
      `${b.orgType ?? ''} ${b.organisation ?? ''}`,
      b.message ?? '',
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
