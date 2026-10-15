import 'server-only';
import { supabaseAdmin } from '../supabase';

/** Monday job: recompute last week's and this week's anonymised aggregates for every organisation. */
export async function runOrgStatsJob(now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const weeks = [new Date(monday.getTime() - 7 * 86_400_000), monday].map((d) => d.toISOString().slice(0, 10));
  let rows = 0;
  for (const week of weeks) {
    const { data } = await supabaseAdmin().rpc('compute_org_stats', { p_week_start: week });
    rows += (data as number | null) ?? 0;
  }
  return { weeks, rows };
}
