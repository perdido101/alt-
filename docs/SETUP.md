# Setup: accounts, keys and environment variables

Everything ΑΛΤ! needs before launch, in the order to do it. **Never commit secrets.** Each app has a
`.env.example`. Real values live in **Vercel** (web + server routes), **EAS** (mobile builds) and
**GitHub Actions secrets** (CI source maps only).

Everything is optional for local development: without keys the site and app run, checks fall back to the
rule-based analyser, SMS is printed to the console, and billing/email/analytics are switched off.

## 0. Decide first

| Item | Where it's used | Placeholder today |
|---|---|---|
| Company legal name, address, ΑΦΜ, privacy email | privacy notice, terms, invoices, store listings | `[ΕΠΩΝΥΜΙΑ ΕΤΑΙΡΕΙΑΣ]` etc. in `apps/web/src/content/legal.ts` |
| Domain (e.g. `alt.gr`) | website, App Links, emails, invite links | `alt.example` |
| Bundle / package id | iOS + Android | `gr.alt.app` (`APP_BUNDLE_ID`) |
| Prices | Stripe, website, app | `packages/core/src/plans.ts` (Family €4.99/month, €39/year; gifts are placeholders) |

## 1. Supabase (EU) — database, auth, storage

1. Create a project in **Frankfurt (eu-central-1)**. Pro plan for daily backups + PITR.
2. `supabase link --project-ref <ref>` then `supabase db push` (applies `supabase/migrations`).
   Do **not** run `seed.sql` in production (demo family and demo safe word).
3. Authentication → Providers:
   - **Email** on. Edit the Magic Link template to include `{{ .ConfirmationURL }}` and `{{ .Token }}`, in Greek and English.
   - **Custom SMTP**: use Resend (step 7) so magic links come from your domain.
   - **Phone** on, with Twilio (step 5) for guardians who sign in by SMS.
   - **Anonymous sign-ins** on (parent phones). Turn on CAPTCHA (hCaptcha/Turnstile) and keep rate limits.
4. Authentication → URL configuration: Site URL `https://<domain>`; redirect URLs `alt://auth-callback` and
   `https://<domain>/api/auth/callback`.
5. Make yourself admin: `update public.profiles set is_admin = true where id = '<your user id>';`
6. Copy: project URL, **anon** key (public), **service-role** key (server only).

## 2. Anthropic (Claude API) — scam analysis

1. Create an organisation at console.anthropic.com, add billing, set a monthly spend limit.
2. Create an API key for production → `ANTHROPIC_API_KEY`. Model is `claude-opus-5-5` (`ANTHROPIC_MODEL`).
3. Check the data-retention terms match the privacy notice (messages are sent only for the check).
4. Optional: `ALT_LIVE_EVAL=1 ANTHROPIC_API_KEY=… pnpm --filter @alt/core test` runs the live Greek/English evaluation.

## 3. ElevenLabs — voice-note transcription fallback

API key → `ELEVENLABS_API_KEY`. Used only when the phone could not transcribe on-device. Turn on
zero-retention mode if your plan allows it.

## 4. Upstash — rate limits and delayed jobs

1. Redis database in **eu-central-1** → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
2. QStash (EU region) → `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.
3. Generate `CRON_SECRET` (`openssl rand -hex 32`); the same value goes in Vercel.

## 5. Twilio — SMS escalation and guardian sign-in

1. Account + Greek messaging. Register the **alphanumeric sender ID "ALT"** (Greek carriers need
   registration; it can take 1–3 weeks). Until approved, set `SMS_SENDER_ID` to a Twilio number.
2. `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.
3. Use the same account as the Supabase phone-auth provider.

## 6. Stripe — subscriptions and gifts

1. Account for the **Greek legal entity**; turn on **Stripe Tax** (register for Greek VAT) and the Customer Portal.
2. `STRIPE_SECRET_KEY=sk_live_… pnpm stripe:setup` creates products, prices (lookup keys from
   `packages/core/src/plans.ts`) and the portal configuration. Run it once in test mode first.
3. Webhook endpoint `https://<domain>/api/stripe/webhook` with events: `checkout.session.completed`,
   `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed` →
   `STRIPE_WEBHOOK_SECRET`.
4. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## 7. Resend — email

Verify the sending domain (SPF, DKIM, DMARC) → `RESEND_API_KEY`, `EMAIL_FROM` (`ΑΛΤ! <hello@domain>`),
`SUPPORT_EMAIL`, `SALES_EMAIL`. Also configure it as Supabase's custom SMTP.

## 8. Vercel — website and server routes

1. Import the repo, root directory `apps/web`, framework Next.js. Region is pinned to `fra1` (`vercel.json`).
2. **Pro plan** (the escalation cron runs every minute; Hobby allows daily crons only).
3. Add every variable from `apps/web/.env.example` for Production and Preview (use Stripe test keys and a
   separate Supabase project for Preview).
4. Domain: add `<domain>` and `www`. Then fill in App Links (step 10).

## 9. Expo / EAS — mobile builds

1. `npx eas-cli login`, `cd apps/mobile && npx eas-cli init`.
2. EAS environment variables (development / preview / production):

| Variable | Notes |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | public by design |
| `EXPO_PUBLIC_WEB_URL` | `https://<domain>` |
| `APP_BUNDLE_ID` | e.g. `gr.alt.app` |
| `APPLE_TEAM_ID` | for the App Group and Associated Domains |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_SENTRY_DSN` | optional |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (secret) | source maps, optional |

3. Push: create an Expo access token → `EXPO_ACCESS_TOKEN` in Vercel. Upload the FCM v1 service-account key
   (Android) and let EAS create the APNs key (iOS).
4. Builds: `eas build --profile development|preview|production --platform android|ios`. Native-module
   changes always need a new build (never EAS Update).

## 10. Apple and Google

**Apple Developer (organisation account, D-U-N-S needed):**
- App ID with App Groups (`group.<bundle id>`), Associated Domains, Push Notifications.
- The Call Directory extension target (`targets/calldirectory`) gets its own App ID; EAS creates it.
- `apple-app-site-association` is served from `/.well-known/`; set `APPLE_TEAM_ID` and `APP_BUNDLE_ID` in Vercel too.
- App Store Connect listing (text in `docs/STORE_LISTINGS.md`), privacy nutrition labels (`docs/ROPA.md`).

**Google Play (organisation account):**
- Upload key: put the **SHA-256 of the app signing key** in `ANDROID_CERT_SHA256` (Vercel, comma-separated; add the upload key too for internal testing) for
  `assetlinks.json`.
- Declarations: call screening role, **full-screen intent** (calling-related), `READ_PHONE_STATE`,
  `SYSTEM_ALERT_WINDOW` (optional), Data safety form. Details in `docs/PERMISSIONS.md`.
- Listing text in `docs/STORE_LISTINGS.md`.

## 11. PostHog (EU) and Sentry

- PostHog **EU cloud** project → `NEXT_PUBLIC_POSTHOG_KEY` (web), `POSTHOG_KEY` (server),
  `EXPO_PUBLIC_POSTHOG_KEY` (app). Turn off autocapture, session replay and IP capture in project settings
  (we don't use the SDKs, but be safe). Event list: `packages/core/src/telemetry.ts`.
- Sentry organisation in the **EU (de) region**: projects `alt-web` and `alt-mobile` → `SENTRY_DSN`,
  `NEXT_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_DSN`; auth token for source maps. Turn on "Data Scrubber"
  and "Prevent storing of IP addresses" in project settings as a second layer.

## 12. Uptime monitoring

BetterStack or UptimeRobot on `https://<domain>/api/health` every minute (alert on non-200 for 2 checks),
and a keyword monitor on the home page. See `docs/OPERATIONS.md`.

## 13. Organisations: invoicing (myDATA)

Pick a **myDATA-certified e-invoicing provider** (e.g. Epsilon Smart, Prosvasis, SoftOne, Elorus) and your
accountant. Until it is wired in, `INVOICING_PROVIDER=manual`. See `docs/INVOICING.md`.

## 14. Viber and WhatsApp (later)

- **Viber**: apply for a Viber bot / business account. Then `VIBER_AUTH_TOKEN`, `VIBER_BOT_NAME`, set the
  webhook to `https://<domain>/api/channels/viber`, and `FEATURE_VIBER=on`.
- **WhatsApp**: Meta Business verification + WhatsApp Cloud API number. Then `WHATSAPP_ACCESS_TOKEN`,
  `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, webhook
  `https://<domain>/api/channels/whatsapp`, `FEATURE_WHATSAPP=on`.

## 15. Before launch (non-technical)

- Greek lawyer: privacy notice, terms, consent wording, DPA with each processor (`docs/ROPA.md`), DPIA.
- Verify every official number in **Admin → Αριθμοί** (only 100, 112, 166, 199 are pre-verified).
- Native Greek review of `TRANSLATION_NOTES.md`.
- Real-device test plan in `docs/PERMISSIONS.md` (Pixel, Samsung, Xiaomi; iPhone).

## Running the tests

| Command | What |
|---|---|
| `pnpm test` | Vitest (packages, web) + Jest/RNTL (mobile) |
| `pnpm typecheck` | every workspace |
| `pnpm db:test` | migrations + seed + RLS/RPC tests on a throwaway Postgres 15+ (port 55432) |
| `gradle -p apps/mobile/modules/call-shield/logic test` (Gradle 8.14) | Kotlin screening logic |
| `apps/mobile/modules/call-shield/ios-tests/run.sh` | Swift Call Directory builder |
| `PW_CHROMIUM_PATH=… pnpm --filter @alt/web test:e2e` | Playwright (site, dashboard, org portal) |
