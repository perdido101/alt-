import { cronRoute } from '@/server/jobs/cron';
import { runOrgStatsJob } from '@/server/jobs/orgStats';

export const runtime = 'nodejs';
export const GET = cronRoute(() => runOrgStatsJob());
