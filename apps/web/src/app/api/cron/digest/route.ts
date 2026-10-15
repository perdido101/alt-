import { cronRoute } from '@/server/jobs/cron';
import { runDigestJob } from '@/server/jobs/digest';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = cronRoute(() => runDigestJob());
