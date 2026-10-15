# Records of processing (GDPR Art. 30) — draft

Draft for the controller's lawyer and DPO. Fill in the bracketed items. It describes what the code does
today; if the code changes, update this file in the same pull request.

**Controller:** [ΕΠΩΝΥΜΙΑ ΕΤΑΙΡΕΙΑΣ], [ΔΙΕΥΘΥΝΣΗ], ΑΦΜ [ΑΦΜ]. **Contact / DPO:** [EMAIL ΑΠΟΡΡΗΤΟΥ].
**Data subjects:** guardians (adult children), protected people (older parents, a group needing extra
care), backup contacts (neighbours/friends: name + phone only), organisation staff, website visitors.

A **DPIA is recommended** before launch: older people, call screening, AI analysis of private messages.

## Processing activities

| # | Purpose | Data | Subjects | Legal basis | Retention |
|---|---|---|---|---|---|
| 1 | Accounts and family circle | guardian email/phone, display names, roles, circle name, consent timestamp | guardians, protected | contract (6(1)(b)) | until account deletion |
| 2 | Parent's consent | consent text version + time | protected | consent (6(1)(a)) and contract | while a member |
| 3 | Scam check of a message, screenshot or voice note | content sent once for analysis; **only verdict, category and short reasons stored** | protected (and the unknown sender) | contract; legitimate interest for third-party content (6(1)(f)) | content: not stored (raw media 0 h by default, max `RAW_MEDIA_RETENTION_HOURS`); verdicts 24 months |
| 4 | Call Shield | incoming number (normalised), classification, action taken, after-call answers. No audio, no call log. Family numbers never leave the phone as call events. | protected, callers | legitimate interest (fraud prevention) | 12 months |
| 5 | Number reputation | normalised number + count of families reporting it | callers | legitimate interest | while active; reviewed by admin |
| 6 | Family alert | who pressed, when, source, delivery status per guardian, guardian phone for SMS | protected, guardians | vital/legitimate interest; contract | 24 months (audit) |
| 7 | Family numbers | name, relation, phone of relatives/backup contacts | relatives, backup contacts | legitimate interest (so their calls aren't flagged) | until removed |
| 8 | Safe word | **bcrypt hash only**; quiz results (correct/incorrect) | protected | contract | until changed / deleted |
| 9 | Billing | Stripe customer id, plan, status; card data stays at Stripe | guardians | contract; legal obligation (invoices 5+ years, Greek tax law) | invoices per tax law; rest until deletion |
| 10 | Organisation licences | org staff emails, licence codes, **weekly aggregate counts** (hidden below 5 people) | org staff | contract | contract term + 1 year |
| 11 | Product analytics | allow-listed events, random install id, platform. No names, numbers, messages or IP. | all users who don't opt out | consent (web, banner) / legitimate interest with opt-out (app) | 12 months in PostHog |
| 12 | Error reports | stack traces, app version, device model; PII scrubbed | all | legitimate interest | 90 days in Sentry |
| 13 | Security audit log | actor id, action, entity id | all | legitimate interest; legal obligation | 24 months |
| 14 | B2B contact form | name, organisation, email, phone, message | prospects | pre-contract steps | 24 months |

## Processors (DPA needed with each)

| Processor | Purpose | Region | Transfer mechanism |
|---|---|---|---|
| Supabase | database, auth, storage | EU (Frankfurt) | — (sub-processors: AWS EU) |
| Vercel | website and API | EU (fra1 functions); global CDN for static files | SCCs / DPF |
| Anthropic | AI analysis of the message | US | SCCs / DPF; zero data retention to be confirmed |
| ElevenLabs | speech-to-text fallback | US/EU | SCCs; zero-retention mode |
| Expo (650 Industries) | push notifications | US | SCCs |
| Twilio | SMS | US/EU | SCCs / DPF / BCR |
| Stripe | payments | EU (Ireland) | — |
| Resend | email | US | SCCs |
| Upstash | rate limits, job queue | EU | — |
| PostHog | analytics | EU | — |
| Sentry | error reports | EU (Germany) | — |
| [myDATA provider] | invoices | Greece | — |
| Viber / Meta (when enabled) | chat bot | EU/US | SCCs / DPF |

## Data subject rights (self-service)

- Access/portability: **Settings → Λήψη των δεδομένων μου** (app and web) → JSON from `export_my_data()`.
- Erasure: **Settings → Διαγραφή λογαριασμού**. Last guardian → the circle and the parent's data go too, and
  the subscription is cancelled. Parent: **Ποιος με προστατεύει → Αποχώρηση** deletes their checks, calls,
  alerts and quiz results.
- Objection to analytics: app opt-out in Settings; web consent banner.
- Everything else by email to [EMAIL ΑΠΟΡΡΗΤΟΥ]; respond within one month.

## Store privacy declarations

**Google Play Data safety / Apple privacy labels** — collected: contact info (email/phone, guardians), user
content (messages for analysis, not stored; voice notes, not stored), phone numbers of incoming calls
(processed for fraud prevention), app activity (allow-listed analytics, opt-out), diagnostics (crash
reports). Not collected: location, contacts list (only the contacts the user picks), call log, SMS,
financial info. Not used for tracking or advertising. Data encrypted in transit; users can request deletion.
