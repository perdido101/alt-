# Decisions to review

Choices made while building that need a product, legal or design call. Newest milestone first.

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
