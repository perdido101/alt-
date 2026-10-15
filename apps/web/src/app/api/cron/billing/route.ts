import { cronRoute } from '@/server/jobs/cron';
import { runBillingJob } from '@/server/jobs/billing';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = cronRoute(() => runBillingJob());
