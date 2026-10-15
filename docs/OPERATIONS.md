# Operations

## Monitoring

| What | How | Alert when |
|---|---|---|
| Site + database | Uptime monitor on `GET /api/health` (1 min). 200 = ok, 503 = database down. `?deep=1` lists configured integrations (no secrets). | 2 failed checks in a row |
| Errors | Sentry `alt-web`, `alt-mobile` (EU). PII scrubbed in `beforeSend` (`packages/core/src/telemetry.ts`). | New issue, or > 20 events / 10 min |
| Family alerts not delivered | Server logs `alert_escalation_undelivered <alertId>` when every SMS failed. Add a Vercel log drain / Sentry alert on that string. | Any occurrence: **page someone** |
| Escalation cron | `/api/cron/escalations` runs every minute as a safety net for QStash. Vercel Cron dashboard. | Failed runs |
| Claude API | 5xx / refusals fall back to the rule-based analyser automatically. Watch `analysis_fallback` logs and Anthropic usage. | Fallback rate > 5 % for 15 min |
| Stripe webhooks | Stripe dashboard → webhook failures. Handler is idempotent (`stripe_events`). | Any failure for > 1 h |
| SMS | Twilio delivery reports, sender-ID status. | Delivery rate < 95 % |
| Costs | Anthropic, Twilio, Vercel spend limits. | 80 % of monthly budget |

## Severity

- **SEV1**: family alerts not reaching guardians, or a data leak. Fix or roll back immediately (Vercel
  "Promote previous deployment"; mobile: EAS Update for JS-only fixes). Notify the DPA within 72 h if
  personal data leaked (GDPR Art. 33); see `docs/SECURITY.md`.
- **SEV2**: checks or call warnings degraded (fallbacks working). Same day.
- **SEV3**: website, dashboard, digest. Next working day.

## Backups and retention

- Supabase Pro: daily backups + point-in-time recovery (7 days). Test a restore every quarter.
- Retention job (`/api/cron/retention`, daily 03:00 UTC): deletes raw media after `RAW_MEDIA_RETENTION_HOURS`,
  old verdicts/call events per the retention table in `docs/ROPA.md`, expired invites and link codes.

## Scheduled jobs (Vercel Cron, UTC)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/escalations` | every minute | SMS escalation safety net |
| `/api/cron/quizzes` | 08:00 daily | safe-word quizzes due |
| `/api/cron/billing` | 03:30 daily | grace period ends → downgrade at a safe moment |
| `/api/cron/retention` | 03:00 daily | data retention |
| `/api/cron/digest` | 07:00 Monday | weekly guardian email |
| `/api/cron/org-stats` | 04:00 daily | organisation aggregates |

All require `Authorization: Bearer $CRON_SECRET` (Vercel sends it automatically).

## Releases

- Web: every merge to `main` deploys to production on Vercel; previews per PR.
- Mobile: `eas build` + `eas submit`. JS-only fixes via `eas update` on the production channel. Anything
  touching `modules/call-shield`, permissions or `app.config.ts` plugins needs a store release.
- Database: `supabase db push` from CI after review. Migrations are forward-only; test with `pnpm db:test`.
