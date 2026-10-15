'use server';

import { entitlements, ProtectionLevel } from '@alt/core';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseServer } from '@/server/auth';

/** Dashboard writes go through the user's own session, so RLS decides what's allowed. */
export async function updateCircleSettings(formData: FormData) {
  const circleId = z.string().uuid().parse(formData.get('circleId'));
  const db = await supabaseServer();
  const { data: circle } = await db.from('circles').select('plan').eq('id', circleId).single();
  const allowed = entitlements[(circle as { plan: 'free' | 'family' | 'family_plus' }).plan].protectionLevels;
  const level = ProtectionLevel.parse(formData.get('protectionLevel'));
  const days = z.coerce.number().int().min(7).max(90).parse(formData.get('quizIntervalDays'));
  await db
    .from('circles')
    .update({ protection_level: allowed.includes(level) ? level : 'warn', quiz_interval_days: days })
    .eq('id', circleId);
  revalidatePath('/[locale]/app', 'layout');
}

export async function updateNotificationPrefs(formData: FormData) {
  const db = await supabaseServer();
  const { data: user } = await db.auth.getUser();
  if (!user.user) return;
  await db
    .from('profiles')
    .update({ notify_digest_email: formData.get('digest') === 'on', notify_quiz_nudges: formData.get('nudges') === 'on' })
    .eq('id', user.user.id);
  revalidatePath('/[locale]/app', 'layout');
}

export async function redeemCode(_prev: string | null, formData: FormData): Promise<string> {
  const circleId = z.string().uuid().parse(formData.get('circleId'));
  const code = z.string().trim().min(4).max(40).parse(formData.get('code'));
  const db = await supabaseServer();
  // Gift codes and municipality licence codes share one box; the RPC tries both and rate-limits guessing.
  const { data } = await db.rpc('redeem_code', { p_circle: circleId, p_code: code });
  revalidatePath('/[locale]/app', 'layout');
  const status = (data as { status?: string } | null)?.status;
  if (status === 'ok') return 'ok';
  if (status === 'already_subscribed') return 'already';
  return 'invalid';
}
