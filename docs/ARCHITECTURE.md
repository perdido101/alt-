# ΑΛΤ! architecture

This is the plan the build follows. Decisions that need product or legal review are listed separately in
[`DECISIONS.md`](./DECISIONS.md).

## 1. Repository layout

```
alt/
├─ apps/
│  ├─ mobile/                 Expo (React Native, TS) with a dev client. One app, two modes.
│  │  ├─ app/                 expo-router routes
│  │  │  ├─ index.tsx         mode router (welcome / guardian / parent)
│  │  │  ├─ welcome.tsx
│  │  │  ├─ join/             parent joins: QR scan, pasted link, deep link alt://join/<token>
│  │  │  ├─ (parent)/         parent mode: consent, setup ritual, home, check, alert, quiz, call flows
│  │  │  └─ (guardian)/       guardian mode: sign-in, circle, invites, tabs (Αρχική/Ιστορικό/Οικογένεια/Ρυθμίσεις)
│  │  ├─ src/                 components, theme, i18n, Supabase client, stores, native-module wrappers
│  │  ├─ modules/
│  │  │  └─ call-shield/      Expo module: Kotlin CallScreeningService (+ iOS Call Directory, milestone 6)
│  │  └─ plugins/             config plugins (Android manifest entries, iOS extension target)
│  └─ web/                    Next.js App Router: marketing, Scam Radar, guardian dashboard, org portal, admin
├─ packages/
│  ├─ core/                   zod schemas, enums, phone normalisation, call classification, safe-word
│  │                          normalisation, invite links, plans/prices; analyzeMessage (milestone 2)
│  ├─ i18n/                   el.json / en.json (ICU MessageFormat) shared by mobile and web
│  └─ tokens/                 colours, type, radii, spacing for RN + generated tokens.css for the web
├─ supabase/
│  ├─ migrations/             schema, functions/RPCs, RLS
│  ├─ functions/              Edge Functions (analyze, alerts, sync) from milestone 2
│  ├─ tests/                  SQL tests for RLS and RPCs (run with `pnpm db:test`)
│  └─ seed.sql                demo circle, directory placeholders, Scam Radar
├─ scripts/                   db-test.sh, stripe-setup.ts (milestone 5)
└─ docs/                      this file, DECISIONS.md, SETUP.md, PERMISSIONS.md, privacy/ROPA
```

Tooling: pnpm workspaces (hoisted linker, which Expo/Metro handles best) + Turborepo. Internal packages ship
TypeScript source (no build step); Metro and Next (`transpilePackages`) compile them.

### i18n format

Mobile uses i18next and the web uses next-intl. They interpolate differently (`{{name}}` vs `{name}`), so the
shared catalogs are written in **ICU MessageFormat** and mobile loads them through `i18next-icu`. A test
checks both catalogs have the same keys and placeholders, every message parses as ICU, and the canonical
Greek copy from the brief is verbatim.

## 2. Accounts and auth

| Who | How they sign in | Notes |
|---|---|---|
| Guardian | Supabase magic link (email) or SMS OTP (phone) | Creates the circle with `create_circle()`. |
| Parent | **Anonymous Supabase session** on their phone, bound to the circle by `accept_invite(token)` | No password. Session lives in SecureStore. Optional 4-digit app PIN, stored only on the device. |
| Org admin | Magic link on the web | Linked through `org_members`. |
| Admin | Magic link on the web | `profiles.is_admin` (set by hand / service role only). |

Invites: `create_invite()` returns a random 256-bit token once and stores only its SHA-256. Links are
`https://<site>/j/<token>` (Android App Link / iOS Universal Link, falling back to a web page with store
buttons) and `alt://join/<token>`. The guardian shows a QR code of the link on their phone; the parent's
phone scans it. Invites expire after 72 h, can be revoked, and acceptance is checked against plan limits.

Mode: a device is in parent mode if its user is the `protected` member of a circle, guardian mode if it is a
guardian anywhere, otherwise it shows the welcome screen. The mode is cached locally so the parent home
screen opens instantly and offline.

## 3. Data model

All tables have RLS. Full DDL: `supabase/migrations/`.

| Table | Purpose | Who can read | Who writes |
|---|---|---|---|
| `profiles` | name, locale, text size, analytics opt-out, `is_admin` | self, people sharing a circle, admin | self (narrow columns) |
| `circles` | family circle, effective `plan`, protection level, quiz interval, sponsor org | members | guardians (narrow columns); created via RPC |
| `circle_members` | (circle, user, role guardian/protected, display name, consent time) | members | RPCs; guardians remove; anyone leaves |
| `invites` | hashed token, role, expiry, acceptance | guardians | RPCs; guardians revoke |
| `family_contacts` | name, E.164 phone, relation, guardian/backup flags | members | members (setup runs on the parent's phone) |
| `devices` | push token, app version, **setup health** JSON | owner, guardians of that parent | owner |
| `safe_words` | bcrypt hash of the normalised word | **nobody** (RPC only) | `set_safe_word()` |
| `safe_word_quizzes` | schedule, result, attempts, guardian nudged | parent, guardians | service role / RPC |
| `checks` | verdict, category, reason, action, channel, input kind (no content) | parent, guardians | analysis endpoint (service role) |
| `alerts` / `alert_deliveries` | alert, escalation time, per-recipient channel/status/seen | parent, guardians | alert pipeline (service role / RPC) |
| `call_events` | normalised number, classification, action taken, check-in answers (no audio) | parent, guardians | parent's device |
| `number_reports` | reported number, claimed org, note, moderation status | reporter, admin | members insert `pending`; admin moderates |
| `number_reputation` | approved report count, flagged, first seen | signed-in users | service role |
| `official_numbers` | org (el/en), category, number, source URL, verified by/at, active | public (active rows) | admin; **active ⇒ verified** (DB constraint) |
| `scam_radar_items` | el/en title, summary, body, what to do, featured week | public (published) | admin |
| `subscriptions` | one per circle: plan, status, provider ids, trial, grace | guardians | Stripe webhook (service role) |
| `gift_codes` | code, plan, months, purchaser, redemption | nobody (RPC) | webhook / RPC |
| `organisations`, `org_members` | municipality etc., seats, co-branding | org admins, admin | admin |
| `org_licence_codes` | printable codes, redemption | org admins | RPC (milestone 6) |
| `org_stats_weekly` | **aggregate counts only** | org admins | cron (service role) |
| `audit_log` | who did what (never content or the safe word) | admin | `audit()` from RPCs |

Number keys: every phone number is stored as a `number_key` domain, either E.164 (`+302101234567`) or a
Greek short code (`112`). Clients normalise with `@alt/core` (`libphonenumber-js`, default region GR); the
database enforces the shape.

Safe word: normalised (trim, collapse spaces, lowercase, strip tonos/dialytika, ς→σ) identically in TS and
SQL, then bcrypt-hashed server-side. The hash is never readable by clients; `check_safe_word()` is rate
limited (10 tries per 10 minutes). Anyone in the circle may set it the first time (setup on the parent's
phone); after that only guardians can change it, within 10 minutes of signing in.

## 4. Server side

- **Supabase** (EU region): Postgres + RLS, Auth, Storage (short-lived uploads for screenshots/voice notes,
  deleted after analysis), Edge Functions (Deno) for `analyze`, `alerts`, `call-cache-sync`, channel webhooks.
- **Next.js route handlers** on Vercel for Stripe webhook, org portal, admin and cron.
- **Provider interfaces** in `packages/core` with implementations wired by env: `TranscriptionProvider`,
  `Notifier` (Expo push), `SmsProvider`, `BillingProvider` (Stripe; store billing stub), `InvoicingProvider`
  (myDATA-certified provider stub), `Analytics` (PostHog EU), `ChannelAdapter` (InApp, Viber, WhatsApp).
- **Escalation**: each alert schedules its own delayed job (Upstash QStash, +5 min), idempotent on
  `alerts.escalated_at`. Vercel Cron only for daily/weekly work.

## 5. Native modules (Android first)

All native code lives in a local Expo module, `apps/mobile/modules/call-shield`, with a config plugin that
adds manifest entries. It is a dev-client build (no Expo Go).

### Android: `CallScreeningService` (milestone 4)

```
Incoming call
  └─ AltCallScreeningService.onScreenCall(details)
       ├─ normalise number (libphonenumber-android, region GR)       ┐ pure Kotlin,
       ├─ look up on-device cache (family / official / reputation)    │ ScreeningDecider,
       ├─ classify (same rules + same JSON fixtures as @alt/core)     │ unit-tested
       ├─ decide response from protection level (warn/silence/block) ┘
       ├─ respondToCall(...) well inside the system time limit, never blocks answer/decline
       ├─ post high-priority full-screen-intent notification (+ overlay if granted) with the label
       └─ if not family: start call-end tracking → after-call check-in
```

- **Role**: `RoleManager.ROLE_CALL_SCREENING` requested in setup step 2. No default-dialer role needed.
- **Cache**: JS fetches family contacts, active official numbers and reputation, and writes a compact
  snapshot file in the app's private storage; the service memory-maps it on each call, so screening works
  offline and fast. Synced on app start, on push ("cache changed") and every 6 h via WorkManager.
- **Call-end detection** (least privilege, to validate on devices in milestone 4): the screening service
  starts a short-lived foreground service that registers a `TelephonyCallback` (needs `READ_PHONE_STATE`)
  and fires the check-in notification when the call returns to idle. No call log, no microphone, no
  `ANSWER_PHONE_CALLS`, no default-dialer role. Fallback if a vendor kills it: the home button
  "Μόλις μου τηλεφώνησαν".
- **Health**: the module reports role held, notification permission, full-screen intent permission (Android
  14+), overlay permission, battery-optimisation exemption. JS uploads this to `devices.health`; guardians
  see warnings when anything is lost.
- Permissions and Play Console declarations are documented in `docs/PERMISSIONS.md` (milestone 4).

### iOS (milestone 6)

- **Call Directory Extension** target added by a config plugin, sharing an App Group container with the app.
  The app writes reported scam numbers (labelled "⚠️ Πιθανή απάτη") and optional blocks, then asks
  `CXCallDirectoryManager` to reload.
- No real-time warning or call-end detection; the parent uses "Μόλις μου τηλεφώνησαν".
- README will note newer caller-ID lookup options (Live Caller ID Lookup, iOS 18+) for later.

### Other native capabilities (existing Expo modules)

`expo-camera` (QR), `expo-contacts` (pick family numbers; only selected contacts are read),
`expo-speech` (Διάβασέ το μου), `expo-audio` (voice notes), `expo-image-picker`, `expo-notifications`,
`expo-secure-store`, `expo-haptics`, `expo-local-authentication` is **not** used (the PIN is simpler for
older users).

## 6. Mobile app structure

- **Theme**: parent mode always uses the light parent scheme; guardian mode follows the system (light/dark).
  All sizes come from `@alt/tokens`; parent text is scaled by the chosen text size and never below 17 px.
- **Parent UI rules** baked into components: `BigButton` (≥ 64 px, strong haptics), `Tile`, `SetupFrame`
  (progress + never-asks footer), every icon has a text label, no menus.
- **State**: Supabase client with SecureStore session storage; React Query for server data; a tiny local
  store for mode, locale, text size and PIN.
