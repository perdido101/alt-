# Permissions, roles and store declarations

Every permission ΑΛΤ! asks for, why it needs it, and what each store requires. The guiding rule is
**least privilege**: no call log, no SMS, no microphone outside the voice note, no contacts beyond the one
the user picks, and never the default-dialer role.

## Android

| Permission / role | Where | Why (as the parent sees it in setup step 2) | When asked | Play Console |
|---|---|---|---|---|
| `ROLE_CALL_SCREENING` (RoleManager) | Call Shield | "So it can see who is calling before you answer." Lets `AltCallScreeningService` label, silence or reject incoming calls. Gives the number only, never audio. | Setup step 2 | Fine: call screening is an approved role. Describe it in the Data safety form (phone numbers of incoming calls are processed on the device; only normalised numbers of non-family calls are sent to our server as `call_events`). |
| `READ_PHONE_STATE` | Call Shield | "So it can ask how it went when you hang up." Used only to see RINGING → OFFHOOK → IDLE to know an answered call ended. We do not read the number from it (that needs `READ_CALL_LOG`, which we don't request). | Setup step 2 | Not a restricted permission. Declare "phone state" use in Data safety. |
| `POST_NOTIFICATIONS` | Alerts, quiz, Call Shield | "So it can show you the warning." | Setup step 2 / first launch | — |
| `USE_FULL_SCREEN_INTENT` | Call Shield | "So the question appears straight away, even when the phone is locked." Used **only** for the after-call check-in, never while the phone is ringing (it would cover the answer/decline buttons). | Setup step 2 (Android 14+: system settings) | **Declaration required** (Android 14+ policy). Category: calling-related. If Google refuses, the module falls back to a high-priority notification automatically. |
| `SYSTEM_ALERT_WINDOW` | Call Shield | "So you see the warning on top of the call screen." A touch-through, non-focusable banner at the top while ringing; it can't block answering or declining. | Setup step 2 (system settings) | Optional. Can be removed with the module's config plugin (`{ overlay: false }`); the warning notification still works. |
| Battery optimisation exemption | Call Shield | "So the phone doesn't close it to save battery." We open the **system list** (`ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS`); we do **not** declare `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, which Play restricts. | Setup step 2 | — |
| `CAMERA` | Join (QR), message check (photo) | Reads the invite QR code; photographs a letter or SMS. | When the user taps the button | — |
| `RECORD_AUDIO` | Voice note | Only while the parent holds the microphone button. Audio is transcribed on the device when possible; otherwise sent once and deleted after analysis. | When the user taps the button | Declare in Data safety ("audio recordings, not stored"). |
| `READ_CONTACTS` | Setup step 3 | The system contact picker returns only the contact chosen. `WRITE_CONTACTS` is blocked in `app.config.ts`. | When the user taps "Διάλεξε από τις επαφές" | — |
| `INTERNET`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` | Expo / notifications / background sync | Standard. | — | — |

Not requested, on purpose: `READ_CALL_LOG`, `ANSWER_PHONE_CALLS`, `CALL_PHONE` (calls use `tel:` links that open
the dialer), `READ_SMS`/`RECEIVE_SMS`, `ACCESS_FINE_LOCATION`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, the
default-dialer role.

### Behaviour to validate on real devices (milestone 4 test plan)

- The `PHONE_STATE` broadcast reaching a manifest receiver while the app is in the background varies by
  vendor (Xiaomi, Huawei, Samsung "sleeping apps"). Test the after-call check-in on: Pixel (stock), Samsung
  One UI, Xiaomi HyperOS. If a vendor drops it, the fallback is the home button "Μόλις μου τηλεφώνησαν".
- `CallScreeningService` response time with a 50k-entry cache (target: < 200 ms).
- Silence/reject behaviour per protection level.
- Banner position on devices with large incoming-call UIs.

## iOS (milestone 6)

| Capability | Why |
|---|---|
| Call Directory Extension | Labels reported scam numbers ("⚠️ Πιθανή απάτη") and optionally blocks them. The parent turns it on in Settings > Apps > Phone > Call Blocking & Identification. |
| App Group | Shares the number list between the app and the extension. |
| Camera, microphone, speech recognition, photo library, contacts | Same uses as Android, each with a Greek and English usage string (`apps/mobile/locales`). |
| Push notifications (time-sensitive) | Family alerts for guardians. |

## Data the app never asks for

Bank codes, card numbers, PINs, passwords. This is stated on every setup screen and in the website footer.
