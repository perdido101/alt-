import { escalateAlert } from '@/server/alerts';
import { verifyJobRequest } from '@/server/jobs/schedule';
import { errorResponse, supabaseAdmin } from '@/server/supabase';

export const runtime = 'nodejs';

/**
 * Safety net (Vercel Cron, every minute): escalates any open alert whose delayed job was lost.
 * The primary path is the per-alert QStash job; escalation is idempotent, so overlap is harmless.
 * Also reports a backlog, which means the job queue is unhealthy.
 */
export async function GET(req: Request) {
  if (!(await verifyJobRequest(req, ''))) return new Response('unauthorized', { status: 401 });
  try {
    const overdue = new Date(Date.now() - 60_000).toISOString();
    const { data } = await supabaseAdmin()
      .from('alerts')
      .select('id')
      .eq('status', 'open')
      .is('escalated_at', null)
      .lt('escalate_at', overdue)
      .limit(50);
    const ids = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
    const results = await Promise.all(ids.map((id) => escalateAlert(id)));
    if (ids.length) console.error('alert_escalation_backlog', ids.length);
    return Response.json({ checked: ids.length, escalated: results.filter((r) => r.escalated).length });
  } catch (error) {
    return errorResponse(error);
  }
}
