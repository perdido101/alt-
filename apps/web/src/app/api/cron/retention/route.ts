import { cronRoute } from '@/server/jobs/cron';
import { runRetentionJob } from '@/server/jobs/retention';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = cronRoute(() => runRetentionJob());
