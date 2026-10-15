# Security review (milestone 7)

What was checked, what was fixed, and what is left. Re-run this list before every major release.

## Threat model in one paragraph

The valuable things are: the ability to **silence a family's alarm** (remove guardians, change numbers,
downgrade protection), the **safe word**, the parent's **verdict history** (it reveals who targets them), and
**phone numbers**. The attackers are scammers who briefly hold the parent's unlocked phone or talk them
through actions, strangers probing the API, and curious organisation staff.

## Controls

| Area | Control | Where |
|---|---|---|
| Data access | RLS on every table; security-definer RPCs with `search_path = ''`; tests per role (guardian, parent, stranger, org admin, anon, admin) | `supabase/migrations/*0300_rls*`, `supabase/db-tests` |
| Organisations | Org admins never see circles, members, names or messages; weekly counts hidden below 5 people (trigger) | `0800_organisations`, `0900_hardening` |
| Safe word | bcrypt hash only; check limited to 10/10 min; changing it needs a guardian signed in within 10 minutes | `0200_functions` |
| Parent phone | anonymous device-bound session; optional PIN (salted hash, lockout); alert button never locked | `apps/mobile/src/lib/pin.ts` |
| Brute force | invite tokens 256-bit (stored hashed), 20 invites/day; licence/gift codes 10 failures/hour; reports 20/day; API per-user and per-circle limits (Upstash) | `0900_hardening`, `apps/web/src/server/rateLimit.ts` |
| AI prompt injection | message content in delimited untrusted blocks; JSON-schema output validated with zod; certainty guard; never "safe" without a model answer | `packages/core/src/analysis` |
| Webhooks | Stripe signature + idempotency table; Viber/WhatsApp HMAC; QStash signature; cron bearer secret | `apps/web/src/server/billing`, `channels` |
| Web | CSP, HSTS (preload), `X-Frame-Options: DENY`, nosniff, strict referrer, Permissions-Policy | `apps/web/next.config.ts` |
| Redirects | auth callback only accepts same-site relative paths (no `//`, no backslashes) | `api/auth/callback` + test |
| Uploads | org logos PNG/JPEG/WebP ≤ 1 MB, no SVG; check media in a private bucket | `server/org.ts`, `0700` |
| Secrets | server-only env (`server-only` import), only `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` are public; nothing committed | `server/env.ts` |
| Telemetry | allow-listed analytics; Sentry PII scrubbing; no replays/screenshots | `packages/core/src/telemetry.ts` |
| Deletion | self-service export/delete; parent "leave" removes their data | `server/account.ts`, `0900_hardening` |

## Fixed in this milestone

1. Open redirect in `/api/auth/callback` (`next=//evil.example`).
2. SVG logo upload (stored XSS via the co-branded page).
3. Licence/gift codes could be guessed without limit.
4. Invite creation had no daily cap.
5. Missing CSP/HSTS headers.
6. Organisation statistics could reveal single households.

## Open items (need a decision or a person)

- **External penetration test** before launch (focus: RLS, RPCs, alert flow, Android module).
- `'unsafe-inline'` in the CSP (Next.js hydration). Nonces would make every page dynamic.
- Enable Supabase **CAPTCHA** for anonymous and email sign-ins; leaked-password protection is not relevant
  (no passwords).
- Turn on GitHub secret scanning + Dependabot. `pnpm audit` runs in CI as a report: the current high findings
  (`@xmldom/xmldom` via `@bacons/apple-targets`, `braces`/`node-forge` via Expo CLI) are build-time tools
  that never ship in the app or website; revisit when upstream releases fixes.
- Play Integrity / App Attest for the API to make scripted abuse harder (not built).
- Incident response: name an owner; the GDPR breach clock is 72 hours (Art. 33).
