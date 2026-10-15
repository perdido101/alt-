'use server';

import { normalisePhone, OfficialCategory, ScamCategory } from '@alt/core';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/server/admin';
import { supabaseAdmin } from '@/server/supabase';

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
};

export async function saveOfficialNumber(f: FormData) {
  const { db } = await requireAdmin();
  const id = s(f, 'id');
  const raw = s(f, 'number');
  const key = raw ? normalisePhone(raw).key : null;
  const row = {
    organisation_el: z.string().min(1).parse(s(f, 'organisation_el')),
    organisation_en: z.string().min(1).parse(s(f, 'organisation_en')),
    category: OfficialCategory.parse(s(f, 'category')),
    number_key: key,
    display_number: s(f, 'display_number') ?? (raw ? normalisePhone(raw).display : null),
    source_url: s(f, 'source_url'),
    article_el: z.enum(['o', 'i', 'to', 'oi', 'ta']).parse(s(f, 'article_el') ?? 'i'),
    notes: s(f, 'notes'),
  };
  // Any edit to the number or its source needs re-verification.
  if (id) await db.from('official_numbers').update({ ...row, verified: false, active: false, verified_at: null, verified_by: null }).eq('id', id);
  else await db.from('official_numbers').insert(row);
  revalidatePath('/[locale]/admin', 'page');
}

export async function verifyOfficialNumber(f: FormData) {
  const { db, userId } = await requireAdmin();
  const id = z.string().uuid().parse(s(f, 'id'));
  await db.from('official_numbers').update({ verified: true, verified_by: userId, verified_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/[locale]/admin', 'page');
}

export async function setOfficialActive(f: FormData) {
  const { db } = await requireAdmin();
  const id = z.string().uuid().parse(s(f, 'id'));
  // The database refuses to activate an unverified number (official_active_requires_verified).
  await db.from('official_numbers').update({ active: s(f, 'active') === 'true' }).eq('id', id);
  revalidatePath('/[locale]/admin', 'page');
}

export async function moderateReport(f: FormData) {
  const { db, userId } = await requireAdmin();
  const id = z.string().uuid().parse(s(f, 'id'));
  const status = z.enum(['approved', 'rejected']).parse(s(f, 'status'));
  await db.from('number_reports').update({ status, moderated_by: userId, moderated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/[locale]/admin/reports', 'page');
}

export async function saveRadarItem(f: FormData) {
  const { db } = await requireAdmin();
  const id = s(f, 'id');
  const published = s(f, 'published') === 'on';
  const row = {
    slug: z.string().regex(/^[a-z0-9-]{2,80}$/).parse(s(f, 'slug')),
    category: ScamCategory.parse(s(f, 'category')),
    title_el: z.string().min(1).parse(s(f, 'title_el')),
    title_en: z.string().min(1).parse(s(f, 'title_en')),
    summary_el: z.string().min(1).parse(s(f, 'summary_el')),
    summary_en: z.string().min(1).parse(s(f, 'summary_en')),
    body_el: z.string().min(1).parse(s(f, 'body_el')),
    body_en: z.string().min(1).parse(s(f, 'body_en')),
    what_to_do_el: z.string().min(1).parse(s(f, 'what_to_do_el')),
    what_to_do_en: z.string().min(1).parse(s(f, 'what_to_do_en')),
    featured_week: s(f, 'featured_week'),
    published,
  };
  if (id) {
    const { data } = await db.from('scam_radar_items').select('published_at').eq('id', id).single();
    const publishedAt = (data as { published_at: string | null } | null)?.published_at;
    await db.from('scam_radar_items').update({ ...row, published_at: published ? (publishedAt ?? new Date().toISOString()) : publishedAt }).eq('id', id);
  } else {
    await db.from('scam_radar_items').insert({ ...row, published_at: published ? new Date().toISOString() : null });
  }
  revalidatePath('/[locale]/scam-radar', 'layout');
  revalidatePath('/[locale]/admin/radar', 'page');
}

export async function markRequestHandled(f: FormData) {
  const { db } = await requireAdmin();
  await db.from('contact_requests').update({ handled_at: new Date().toISOString() }).eq('id', z.string().uuid().parse(s(f, 'id')));
  revalidatePath('/[locale]/admin/requests', 'page');
}

export async function createOrganisation(f: FormData) {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from('organisations')
    .insert({
      slug: z.string().regex(/^[a-z0-9-]{2,60}$/).parse(s(f, 'slug')),
      kind: z.enum(['municipality', 'kapi', 'bank', 'telco', 'other']).parse(s(f, 'kind')),
      name_el: z.string().min(1).parse(s(f, 'name_el')),
      name_en: z.string().min(1).parse(s(f, 'name_en')),
      seats_total: z.coerce.number().int().min(0).parse(s(f, 'seats_total') ?? '0'),
      cobranding_enabled: s(f, 'cobranding') === 'on',
    })
    .select('id')
    .single();
  if (error || !data) return;
  const email = s(f, 'admin_email');
  if (email) {
    // Invite (or find) the org admin and link them. Needs the service role for auth admin APIs.
    const admin = supabaseAdmin();
    const { data: invited } = await admin.auth.admin.inviteUserByEmail(email, { data: { locale: 'el' } });
    let userId = invited?.user?.id;
    if (!userId) {
      const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
      userId = (existing as { id: string } | null)?.id;
    }
    if (userId) await db.from('org_members').insert({ org_id: (data as { id: string }).id, user_id: userId });
  }
  revalidatePath('/[locale]/admin/orgs', 'page');
}

export async function updateSeats(f: FormData) {
  const { db } = await requireAdmin();
  await db
    .from('organisations')
    .update({ seats_total: z.coerce.number().int().min(0).parse(s(f, 'seats_total')), cobranding_enabled: s(f, 'cobranding') === 'on' })
    .eq('id', z.string().uuid().parse(s(f, 'id')));
  revalidatePath('/[locale]/admin/orgs', 'page');
}
