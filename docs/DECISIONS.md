# Decisions to review

Choices made while building that need a product, legal or design call. Newest milestone first.

## Milestone 7: hardening

| # | Decision | Why | Alternative |
|---|---|---|---|
| 7.1 | **Parent PIN is optional** (offered once at the end of setup). Salted SHA-256 in the keystore; 5 wrong tries lock it for 1 minute; it asks again after 1 minute in the background. **The family-alert button works on the lock screen without the PIN.** | Asking for help must never be locked. A 4-digit PIN only stops casual access, so the lockout is short. | Biometrics; or no PIN at all. |
| 7.2 | Forgotten PIN = reinstall + new invite from a guardian. No reset by guardians remotely. | A remote reset is a takeover path for a scammer who has a guardian's phone. | Guardian-initiated reset after re-auth. |
| 7.3 | **Analytics without an SDK**: allow-listed events (`packages/core/src/telemetry.ts`), no person profiles, IP dropped, random install id. Web: id in memory until cookie consent. App: on by default with an opt-out in Settings; the opt-out also travels as a header so server events honour it. | Smallest data footprint; nothing PostHog could link to a person. | posthog-js / posthog-react-native SDKs (session replay, autocapture: deliberately not used). |
| 7.4 | **Sentry everywhere, scrubbed**: no user info, cookies, bodies, query strings, AI inputs/outputs, screenshots or replays; phone numbers, emails, IBANs and tokens are masked in every event and breadcrumb. | Error reports must never contain what a parent pasted. | Self-hosted GlitchTip. |
| 7.5 | **Account deletion**: guardians delete themselves (web + app); if they were the last guardian the circle (and the parent's data) is deleted too, and the Stripe subscription is cancelled. A parent can "leave" the circle. Data export as JSON (`export_my_data`). | GDPR Art. 15/17/20 self-service; no orphaned parents with nobody to alert. | Keep the circle for 30 days. |
| 7.6 | Abuse limits in Postgres: invites 20/day per guardian, licence/gift code redemption 10 failed tries/hour, reports 20/day, safe-word check 10/10 min. | Works even if Upstash is down. | Only Upstash. |
| 7.7 | Organisation invoices are **manual** until a myDATA-certified provider is chosen (`INVOICING_PROVIDER`). | Greek B2B/B2G invoices must be transmitted to myDATA; we shouldn't build that ourselves. | Direct myDATA integration. |
| 7.8 | CSP allows `'unsafe-inline'` scripts (Next.js hydration). | Nonce-based CSP makes every page dynamic. | Nonces via proxy.ts. |
| 7.9 | Logo uploads: PNG/JPEG/WebP only, no SVG. | SVG can carry scripts. | Sanitised SVG. |

## Milestone 6: organisation portal + iOS

| # | Decision | Why | Alternative |
|---|---|---|---|
| 6.1 | Licence codes give the redeeming circle an `org_licence` subscription for 12 months; the org sees only counts, never circles, names or messages (tested in SQL). Activity counts are hidden (stored as NULL by a trigger) in weeks with fewer than 5 protected people. | The brief: municipalities must not see who uses it. | Per-household reporting (no). |
| 6.2 | iOS has no live warning while ringing: Call Directory labels known scam numbers ("⚠️ Πιθανή απάτη") and can block them. After-call check-in on iOS is the manual "Μόλις μου τηλεφώνησαν" button. | Apple offers nothing else to third-party apps. | — |
| 6.3 | Co-branding ("Με τη στήριξη του Δήμου …") only when the org turns it on; the name is used as typed (no automatic genitive). | See TRANSLATION_NOTES. | `name_el_genitive` field. |
| 6.4 | Org portal demo data (`ALT_DEMO_MODE=1`) is only possible when Supabase is not configured. | Lets e2e tests run without accounts, impossible in production. | Seeded test project. |

## Milestone 5: dashboard, website, billing, quizzes

| # | Decision | Why | Alternative |
|---|---|---|---|
| 5.1 | Server endpoints live in the **Next.js app on Vercel (fra1)**, not Supabase Edge Functions. | One deployable, one place for secrets, Node SDKs (Stripe, Anthropic) without Deno shims. | Edge Functions. |
| 5.2 | 30-day free trial on paid plans; card required at checkout. | Common practice; reduces trial abuse. | No card trial. |
| 5.3 | **Safety basics are in every plan** (alert button, call warning, family numbers, safe word). Over the free check quota, messages are still checked by the rule-based analyser instead of being refused. | A parent asking "is this a scam?" must never get "upgrade". | Hard quota. |
| 5.4 | Failed payments: 7-day grace, then downgrade to Free at a safe moment (never while an alert is open). Nothing is deleted. | Don't drop protection during a scam. | Immediate downgrade. |
| 5.5 | Store (Apple/Google) billing is stubbed; the app sends guardians to the website to subscribe. | Allowed for "reader"-type/family-plan web purchases in the EU (DMA); needs a store-policy check before launch. | In-app purchase. |
| 5.6 | Safe-word quiz every 14 days by default; two misses in a row quietly notify **one** guardian, never the parent. | Practice without nagging or shaming. | Notify all guardians. |
| 5.7 | Weekly digest email (Monday 07:00 UTC, i.e. 09:00–10:00 in Greece) is opt-out. | Keeps guardians engaged without push spam. | Opt-in. |
| 5.8 | Locale: `/el` is default; `/` redirects by the saved language cookie, then `Accept-Language`. | Greek first. | Always Greek. |

## Milestone 4: Call Shield (Android)

| # | Decision | Why | Alternative |
|---|---|---|---|
| 4.1 | Ringing warning = heads-up notification + optional touch-through banner. **Never a full-screen intent while ringing** (it would cover answer/decline). Full-screen intent only for the after-call check-in. | Older people must still be able to answer or decline. | Full-screen warning. |
| 4.2 | Protection levels: warn (default), silence unknown suspicious calls, block reported scams. Family and official numbers always ring. | The brief; blocking is opt-in by the guardian. | — |
| 4.3 | A number becomes "reported" when **2+ different families** flag it. One report only affects that family. | Stops one person blocking a number for everyone. | Admin approval for every number. |
| 4.4 | No `READ_CALL_LOG`: the after-call flow uses `PHONE_STATE` transitions and the number the screening service saw. | Least privilege; Play restricts call-log access. | — |

## Milestones 2–3: scam check and family alert

| # | Decision | Why | Alternative |
|---|---|---|---|
| 2.1 | Only the verdict, category and short reasons are stored, never the message text. Raw screenshots/voice notes are kept 0 hours by default (`RAW_MEDIA_RETENTION_HOURS`). | Data minimisation. | Store text for review. |
| 2.2 | Without a model answer (no key, outage, refusal) the verdict is **never "safe"**; rule-based signals decide between "caution" and "scam". The model can never say anything is 100% safe (certainty guard). | False reassurance is the worst failure. | Show an error. |
| 2.3 | Voice notes are transcribed on the phone when possible; otherwise sent once to ElevenLabs Scribe and not stored. | Privacy + Greek accuracy. | Whisper. |
| 3.1 | **Every alert is confirmed first** ("Να ειδοποιήσω την οικογένεια;"), including from the home button. | Avoid accidental alarms that train guardians to ignore them. | One-tap alert. |
| 3.2 | All guardians are pushed at once; if none opens it within 5 minutes, SMS to all guardians (sender "ALT"). Repeated presses within 10 minutes are merged into one alert. | Speed matters more than ordering. | Call the first guardian. |
| 3.3 | Viber and WhatsApp bots are built but **off** (`FEATURE_VIBER`, `FEATURE_WHATSAPP`) until the business accounts are approved. | Approval takes weeks. | — |

## Milestone 1

| # | Decision | Why | Alternative |
|---|---|---|---|
| 1 | **Guardians can change the safe word but never view it.** | The brief asks for "only a salted hash" *and* "guardians can view it after re-auth"; both can't be true. Hash-only is the safer half. | Store it encrypted (e.g. pgsodium/Vault) so it can be shown after re-auth. |
| 2 | The safe word is hashed **server-side** (bcrypt via pgcrypto). The plaintext crosses TLS once and is never logged or stored. | Bcrypt on a phone is slow; the quiz check needs the server anyway (to nudge a guardian). | Client-side hashing with a per-circle salt. |
| 3 | First safe word: anyone in the circle can set it (setup runs on the parent's phone). After that only a guardian, within 10 minutes of signing in. The parent can't change it alone. | Prevents a scammer with the unlocked phone from resetting it. | Let the parent change it too. |
| 4 | **Free plan = 2 guardians + 1 parent.** Family = 4 + 2, Family+ = 4 + 4 (from the brief). | The brief doesn't size the Free plan. | Any other limits; change `planLimits` and `plan_max_members()`. |
| 5 | Parent phones use an **anonymous Supabase session** bound by the invite. | No password, no email for the parent. | Phone-number OTP for parents. |
| 6 | Consequence of 5: a reset/replaced phone loses the session. The guardian must remove the old parent membership and send a new invite. A "replace mum's phone" flow is planned for milestone 5. | — | Recovery code printed during setup. |
| 7 | A protected person belongs to exactly one circle; a guardian can be in up to 5 circles (e.g. both sides of the family). The same account can't be both. | Keeps parent data visibility unambiguous. | — |
| 8 | Invites expire after 72 h; max 10 pending per circle; tokens are 256-bit, stored as SHA-256. | Balance between "send it on Sunday, set up on Tuesday" and leaked links. | Shorter TTL. |
| 9 | Official directory: a DB constraint makes **active ⇒ verified with a number and source URL**. Seeded as verified: 100, 112, 166 (ΕΚΑΒ), 199 (Πυροσβεστική). Everything else is an inactive UNVERIFIED placeholder with no number. | The brief allows well-known emergency numbers; 166/199 are as well known as 100/112. | Seed only 100 and 112. |
| 10 | Setup step 3 needs at least one family number before continuing. | Without one, every family call would trigger a warning. | Allow skipping. |
| 11 | Gift prices are placeholders: 3 months €14.97, 6 months €29.94, 12 months €39 (= yearly). | Not in the brief. | Set real prices in `packages/core/src/plans.ts`. |
| 12 | Greeting switches from "Καλημέρα" to "Καλησπέρα" at 13:00. | Common Greek usage. | 12:00 or 14:00. |
| 13 | The wordmark stays "ΑΛΤ!" in Greek letters in the English UI. | It's the brand. | "ALT!" in English. |
| 14 | Placeholders for the domain (`alt.example`) and bundle id (`gr.alt.app`). | Not decided yet. | Set `EXPO_PUBLIC_WEB_URL` and `APP_BUNDLE_ID`. |
| 15 | Shared message catalogs use ICU MessageFormat (`{name}`); mobile uses `i18next-icu`. | next-intl and i18next must read the same files. | — |
| 16 | Stack versions: Expo SDK 57 / React Native 0.86, TypeScript 6, zod 4. | Current at the time of writing. | — |
| 17 | `check_safe_word()` is limited to 10 tries per user per 10 minutes, in Postgres. Upstash rate limits come with the edge endpoints. | Brute-force protection exists from day one. | — |
