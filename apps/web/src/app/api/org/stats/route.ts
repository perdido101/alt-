import { isLocale, translate } from '@alt/i18n';
import { currentUser } from '@/server/auth';
import { demoMode, orgRepo, statsCsv } from '@/server/org';

/** CSV of the organisation's weekly aggregates (UTF-8 with BOM so Excel shows Greek correctly). */
export async function GET(req: Request) {
  if (!demoMode() && !(await currentUser())) return new Response('unauthorized', { status: 401 });
  const org = await orgRepo().current();
  if (!org) return new Response('forbidden', { status: 403 });
  const l = new URL(req.url).searchParams.get('locale');
  const locale = isLocale(l) ? l : 'el';
  const header = ['week', 'protectedPeople', 'checks', 'checksScam', 'alerts', 'flaggedCalls'].map((k) => translate(locale, `org.${k}`));
  const csv = statsCsv(await orgRepo().stats(org.id), header);
  return new Response(`﻿${csv}`, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="alt-${org.slug}-stats.csv"` },
  });
}
