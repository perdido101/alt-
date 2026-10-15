'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { HttpError } from '@/server/supabase';
import { orgRepo, uploadLogo } from '@/server/org';

export async function generateCodes(_prev: string | null, form: FormData): Promise<string> {
  const org = await orgRepo().current();
  if (!org) return 'forbidden';
  const count = z.coerce.number().int().min(1).max(500).safeParse(form.get('count'));
  if (!count.success) return 'invalid';
  try {
    await orgRepo().generate(org.id, count.data);
  } catch (e) {
    return e instanceof HttpError ? e.code : 'failed';
  }
  revalidatePath('/[locale]/org', 'page');
  return 'ok';
}

export async function revokeCode(form: FormData) {
  await orgRepo().revoke(z.string().min(4).parse(form.get('code')));
  revalidatePath('/[locale]/org', 'page');
}

export async function uploadOrgLogo(form: FormData) {
  const org = await orgRepo().current();
  const file = form.get('logo');
  if (!org || !(file instanceof File)) return;
  await uploadLogo(org.id, file);
  revalidatePath('/[locale]/org/branding', 'page');
}
