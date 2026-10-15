import { normalisePhone, type FamilyContactInput, type MemberRole, type Relation } from '@alt/core';
import { supabase } from './supabase';

/** Thin typed wrappers over the RPCs and tables defined in supabase/migrations. */

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export type Membership = { circleId: string; circleName: string; role: MemberRole; displayName: string; consentedAt: string | null };

export async function myMemberships(): Promise<Membership[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];
  const rows = unwrap(
    await supabase
      .from('circle_members')
      .select('circle_id, role, display_name, consented_at, circles(name)')
      .eq('user_id', user.user.id),
  ) as unknown as Array<{ circle_id: string; role: MemberRole; display_name: string; consented_at: string | null; circles: { name: string } | null }>;
  return rows.map((r) => ({
    circleId: r.circle_id,
    circleName: r.circles?.name ?? '',
    role: r.role,
    displayName: r.display_name,
    consentedAt: r.consented_at,
  }));
}

export type Member = { userId: string; role: MemberRole; displayName: string; consentedAt: string | null; joinedAt: string; phone: string | null };

export async function circleMembers(circleId: string): Promise<Member[]> {
  const rows = unwrap(
    await supabase.from('circle_members').select('user_id, role, display_name, consented_at, joined_at, phone').eq('circle_id', circleId).order('joined_at'),
  ) as Array<{ user_id: string; role: MemberRole; display_name: string; consented_at: string | null; joined_at: string; phone: string | null }>;
  return rows.map((r) => ({ userId: r.user_id, role: r.role, displayName: r.display_name, consentedAt: r.consented_at, joinedAt: r.joined_at, phone: r.phone }));
}

export async function createCircle(name: string, displayName: string): Promise<string> {
  return unwrap(await supabase.rpc('create_circle', { p_name: name, p_display_name: displayName })) as string;
}

export type CreatedInvite = { inviteId: string; token: string; expiresAt: string };

export async function createInvite(circleId: string, role: MemberRole, inviteeName?: string): Promise<CreatedInvite> {
  const rows = unwrap(
    await supabase.rpc('create_invite', { p_circle: circleId, p_role: role, p_invitee_name: inviteeName ?? null }),
  ) as Array<{ invite_id: string; token: string; expires_at: string }>;
  const row = rows[0];
  if (!row) throw new Error('generic');
  return { inviteId: row.invite_id, token: row.token, expiresAt: row.expires_at };
}

export async function acceptInvite(token: string): Promise<{ circleId: string; role: MemberRole }> {
  const rows = unwrap(await supabase.rpc('accept_invite', { p_token: token })) as Array<{ circle_id: string; role: MemberRole }>;
  const row = rows[0];
  if (!row) throw new Error('invite_invalid');
  return { circleId: row.circle_id, role: row.role };
}

export async function recordConsent(circleId: string): Promise<void> {
  unwrap(await supabase.rpc('record_consent', { p_circle: circleId }));
}

export async function setSafeWord(circleId: string, word: string): Promise<void> {
  unwrap(await supabase.rpc('set_safe_word', { p_circle: circleId, p_word: word }));
}

export async function safeWordStatus(circleId: string): Promise<{ isSet: boolean; updatedAt: string | null }> {
  const rows = unwrap(await supabase.rpc('safe_word_status', { p_circle: circleId })) as Array<{ is_set: boolean; updated_at: string | null }>;
  return { isSet: rows[0]?.is_set ?? false, updatedAt: rows[0]?.updated_at ?? null };
}

export type FamilyContact = { id: string; name: string; phone: string; relation: Relation; isGuardian: boolean; isBackup: boolean };

export async function familyContacts(circleId: string): Promise<FamilyContact[]> {
  const rows = unwrap(
    await supabase.from('family_contacts').select('id, name, phone, relation, is_guardian, is_backup').eq('circle_id', circleId).order('created_at'),
  ) as Array<{ id: string; name: string; phone: string; relation: Relation; is_guardian: boolean; is_backup: boolean }>;
  return rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, relation: r.relation, isGuardian: r.is_guardian, isBackup: r.is_backup }));
}

export async function addFamilyContact(circleId: string, input: FamilyContactInput): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  const phone = normalisePhone(input.phone).e164;
  if (!phone) throw new Error('errors.phoneInvalid');
  unwrap(
    await supabase.from('family_contacts').upsert(
      {
        circle_id: circleId,
        name: input.name,
        phone,
        relation: input.relation,
        is_guardian: input.isGuardian,
        is_backup: input.isBackup,
        created_by: user.user?.id,
      },
      { onConflict: 'circle_id,phone' },
    ),
  );
}

export async function removeFamilyContact(id: string): Promise<void> {
  unwrap(await supabase.from('family_contacts').delete().eq('id', id));
}

export async function updateProfile(patch: { display_name?: string; locale?: string; text_scale?: string }): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;
  unwrap(await supabase.from('profiles').update(patch).eq('id', user.user.id));
}

/** Saves this member's own phone number (the parent's number, so guardians can call back). */
export async function setOwnPhone(circleId: string, phone: string): Promise<void> {
  const e164 = normalisePhone(phone).e164;
  if (!e164) throw new Error('errors.phoneInvalid');
  const { data: user } = await supabase.auth.getUser();
  unwrap(await supabase.from('circle_members').update({ phone: e164 }).eq('circle_id', circleId).eq('user_id', user.user!.id));
}
