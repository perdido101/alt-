import { cronRoute } from '@/server/jobs/cron';
import { runQuizJob } from '@/server/jobs/quizzes';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const GET = cronRoute(() => runQuizJob());
