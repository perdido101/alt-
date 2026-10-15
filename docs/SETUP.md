# Setup: accounts, keys and environment variables

This grows with each milestone. **Never commit secrets.** Each app has a `.env.example`; real values live in
EAS environment variables (mobile), Vercel (web) and Supabase secrets (Edge Functions).

## Accounts needed now (milestone 1)

### Supabase (EU)

1. Create a project in an **EU region** (Frankfurt, `eu-central-1`).
2. Link and push the schema: `supabase link --project-ref <ref>` then `supabase db push`.
3. Authentication → Providers:
   - **Email**: on. Edit the "Magic Link" template so it contains both the link and the code
     (`{{ .ConfirmationURL }}` and `{{ .Token }}`), in Greek and English.
   - **Phone**: on, with an SMS provider that covers Greece (Twilio, MessageBird/Bird, Vonage).
   - **Anonymous sign-ins**: on (parent phones). Keep CAPTCHA / rate limits on.
4. Authentication → URL configuration: add redirect URLs `alt://auth-callback` and
   `https://<site>/auth/callback`.
5. Copy the project URL and **anon** key for the mobile app. The service-role key is for servers only.

### Expo / EAS

1. `npx eas-cli login`, then `cd apps/mobile && npx eas-cli init` to create the project.
2. Set EAS environment variables (development / preview / production):

| Variable | Visibility | Example |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | plain | `https://<ref>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | plain (public by design) | `eyJ…` |
| `EXPO_PUBLIC_WEB_URL` | plain | `https://alt.gr` |
| `APP_BUNDLE_ID` | plain | `gr.alt.app` |

3. Development build: `npx eas-cli build --profile development --platform android`.
   Never ship native-module changes via EAS Update.

## Coming in later milestones

| Service | Milestone | Keys |
|---|---|---|
| Anthropic Claude API | 2 | `ANTHROPIC_API_KEY` (Supabase secret), `ANTHROPIC_MODEL` |
| Speech-to-text provider | 2 | provider key (Supabase secret) |
| Upstash Redis + QStash | 2–3 | `UPSTASH_REDIS_REST_URL/TOKEN`, `QSTASH_TOKEN`, signing keys |
| SMS provider (alerts, alphanumeric sender "ALT") | 3 | provider keys; sender-ID registration with Greek carriers |
| Expo push | 3 | `EXPO_ACCESS_TOKEN` |
| Vercel | 5 | Vercel ↔ Supabase integration |
| Stripe (+ Tax, Customer Portal) | 5 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Resend | 5 | `RESEND_API_KEY` |
| PostHog EU, Sentry | 5 / 7 | `NEXT_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_KEY`, Sentry DSNs + auth token |
| myDATA-certified e-invoicing provider | 6 | provider credentials |
| Viber / WhatsApp business accounts | after approval | webhook secrets; adapters stay behind feature flags |

## Running the database tests

`pnpm db:test` needs Postgres 15+ binaries (`initdb`, `pg_ctl`, `psql`) on the PATH or under
`/usr/lib/postgresql/*/bin`. It starts a throwaway cluster on port 55432, loads a small stub of Supabase's
`auth` schema (`supabase/db-tests/00_supabase_stub.sql`), applies the migrations and seed, and runs the tests.
