-- Demo data for local development and tests. All people and phone numbers are fictional.
-- Demo circle: guardian Γιάννης, parent Μαρία, guardian Ελένη, backup neighbour κ. Νίκος.

-- Users (profiles are created by the on_auth_user_created trigger) -------------------------
insert into auth.users (id, email, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-4000-8000-000000000001', 'giannis@example.com', '{"display_name":"Γιάννης","locale":"el"}', false),
  ('00000000-0000-4000-8000-000000000002', 'eleni@example.com',   '{"display_name":"Ελένη","locale":"el"}', false),
  ('00000000-0000-4000-8000-000000000003', null,                  '{"display_name":"Μαρία","locale":"el"}', true),
  ('00000000-0000-4000-8000-000000000009', 'admin@example.com',   '{"display_name":"Admin","locale":"en"}', false),
  ('00000000-0000-4000-8000-000000000010', 'dimos@example.com',   '{"display_name":"Κοινωνική Υπηρεσία","locale":"el"}', false);

update public.profiles set is_admin = true where id = '00000000-0000-4000-8000-000000000009';

-- Organisation (fictional municipality) ---------------------------------------------------
insert into public.organisations (id, slug, kind, name_el, name_en, cobranding_enabled, seats_total) values
  ('00000000-0000-4000-8000-0000000000a1', 'demo', 'municipality', 'Δοκιμής', 'Dokimi', true, 50);
insert into public.org_members (org_id, user_id) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000010');

-- Circle ------------------------------------------------------------------------------------
insert into public.circles (id, name, plan, created_by, sponsor_org_id) values
  ('00000000-0000-4000-8000-0000000000c1', 'Οικογένεια Παπαδοπούλου', 'family',
   '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1');

insert into public.circle_members (circle_id, user_id, role, display_name, consented_at) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', 'guardian', 'Γιάννης', now() - interval '20 days'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000002', 'guardian', 'Ελένη', now() - interval '19 days'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003', 'protected', 'Μαρία', now() - interval '20 days');

insert into public.subscriptions (circle_id, plan, status, provider, current_period_end, trial_end) values
  ('00000000-0000-4000-8000-0000000000c1', 'family', 'active', 'org_licence', now() + interval '11 months', null);

insert into public.org_licence_codes (org_id, code, plan, created_by, redeemed_circle_id, redeemed_by, redeemed_at) values
  ('00000000-0000-4000-8000-0000000000a1', 'ALT-DEMO-0001', 'family', '00000000-0000-4000-8000-000000000010',
   '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', now() - interval '20 days'),
  ('00000000-0000-4000-8000-0000000000a1', 'ALT-DEMO-0002', 'family', '00000000-0000-4000-8000-000000000010', null, null, null);

insert into public.family_contacts (circle_id, name, phone, relation, is_guardian, is_backup, member_user_id, created_by) values
  ('00000000-0000-4000-8000-0000000000c1', 'Γιάννης', '+306900000001', 'son', true, false,
   '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-0000000000c1', 'Ελένη', '+306900000002', 'daughter', true, false,
   '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-0000000000c1', 'κ. Νίκος', '+302100000003', 'neighbour', false, true,
   null, '00000000-0000-4000-8000-000000000003');

-- Demo safe word: "λεμονόπιτα"
insert into public.safe_words (circle_id, word_hash, set_by, updated_at) values
  ('00000000-0000-4000-8000-0000000000c1',
   extensions.crypt(public.normalise_safe_word('λεμονόπιτα'), extensions.gen_salt('bf', 10)),
   '00000000-0000-4000-8000-000000000003', now() - interval '20 days');

insert into public.safe_word_quizzes (circle_id, user_id, scheduled_for, answered_at, result, attempts) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003',
   now() - interval '6 days', now() - interval '6 days' + interval '2 hours', 'correct', 1);

insert into public.devices (user_id, platform, app_version, os_version, health) values
  ('00000000-0000-4000-8000-000000000003', 'android', '0.1.0', 'Android 15',
   '{"callScreeningRole":true,"notifications":true,"overlay":true,"batteryExempt":false}');

-- Official numbers directory ----------------------------------------------------------------
-- Only universally known emergency short numbers are seeded as verified. Everything else is an
-- UNVERIFIED placeholder with no number: an admin must add the number + source URL and verify it.
insert into public.official_numbers
  (organisation_el, organisation_en, category, number_key, display_number, source_url, verified, verified_at, active, notes) values
  ('Ελληνική Αστυνομία', 'Hellenic Police', 'police', '100', '100', 'https://www.astynomia.gr/', true, now(), true, 'Emergency short number'),
  ('Ευρωπαϊκός αριθμός έκτακτης ανάγκης', 'European emergency number', 'emergency', '112', '112', 'https://www.112.gr/', true, now(), true, 'Emergency short number'),
  ('ΕΚΑΒ', 'National Ambulance Service (EKAB)', 'health', '166', '166', 'https://www.ekab.gr/', true, now(), true, 'Emergency short number'),
  ('Πυροσβεστική Υπηρεσία', 'Fire Service', 'emergency', '199', '199', 'https://www.fireservice.gr/', true, now(), true, 'Emergency short number');

insert into public.official_numbers (organisation_el, organisation_en, category, notes)
select o.el, o.en, o.cat::public.official_category,
       'UNVERIFIED placeholder: add the official number and a source URL, then verify before activating.'
from (values
  ('ΑΑΔΕ', 'AADE (Independent Authority for Public Revenue)', 'tax_social'),
  ('e-ΕΦΚΑ', 'e-EFKA (Social Security)', 'tax_social'),
  ('ΔΕΗ', 'PPC (Public Power Corporation)', 'utility'),
  ('ΕΥΔΑΠ', 'EYDAP (Athens Water)', 'utility'),
  ('ΕΛΤΑ', 'Hellenic Post (ELTA)', 'post_courier'),
  ('ΕΛΤΑ Courier', 'ELTA Courier', 'post_courier'),
  ('Εθνική Τράπεζα', 'National Bank of Greece', 'bank'),
  ('Τράπεζα Πειραιώς', 'Piraeus Bank', 'bank'),
  ('Alpha Bank', 'Alpha Bank', 'bank'),
  ('Eurobank', 'Eurobank', 'bank'),
  ('Cosmote', 'Cosmote', 'telco'),
  ('Vodafone', 'Vodafone', 'telco'),
  ('Nova', 'Nova', 'telco'),
  ('Ευαγγελισμός (νοσοκομείο)', 'Evangelismos Hospital', 'health'),
  ('Ελληνική Αστυνομία (Διεύθυνση Δίωξης Ηλεκτρονικού Εγκλήματος)', 'Hellenic Police Cyber Crime Division', 'police')
) as o (el, en, cat);

-- Greek article per organisation, for "ΔΕΝ ανήκει στην/στον/στα <Organisation>".
update public.official_numbers set article_el = case
  when organisation_el in ('ΕΛΤΑ', 'ΕΛΤΑ Courier') then 'ta'
  when organisation_el in ('e-ΕΦΚΑ') or organisation_el like 'Ευαγγελισμός%' then 'o'
  when organisation_el = 'ΕΚΑΒ' then 'to'
  else 'i' end;

-- Reputation (fictional numbers) ----------------------------------------------------------------
insert into public.number_reports (number_key, reporter_id, circle_id, claimed_category, status) values
  ('+306980000001', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000c1', 'police', 'approved'),
  ('+306980000004', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1', 'bank', 'pending');

-- Demo reputation as if many families had reported (reports above recompute it, so this comes after).
insert into public.number_reputation (number_key, approved_reports, flagged) values
  ('+306980000001', 5, false),
  ('+306980000003', 0, true)
on conflict (number_key) do update set approved_reports = excluded.approved_reports, flagged = excluded.flagged;

-- Activity --------------------------------------------------------------------------------------
insert into public.checks (circle_id, user_id, channel, input_kind, verdict, category, reason, action, suggest_alert, created_at) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003', 'in_app', 'image', 'scam', 'fake_courier',
   'Τα ΕΛΤΑ δεν ζητούν πληρωμή με σύνδεσμο σε SMS.', 'Μην πατήσεις τον σύνδεσμο. Σβήσ'' το.', true, now() - interval '9 days'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003', 'in_app', 'text', 'caution', 'new_number',
   'Κάποιος λέει ότι είναι δικός σου από καινούργιο αριθμό.', 'Πάρε τηλέφωνο στον παλιό του αριθμό πριν απαντήσεις.', false, now() - interval '4 days'),
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003', 'in_app', 'text', 'safe', 'none',
   'Είναι υπενθύμιση ραντεβού χωρίς αίτημα για χρήματα.', 'Αν αργότερα σου ζητήσουν πληρωμή ή κωδικό, στείλ'' το μου ξανά.', false, now() - interval '1 day');

insert into public.call_events (id, circle_id, user_id, number_key, number_kind, classification, protection_action,
                                started_at, ended_at, checkin_answer, claimed_category, official_match) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003',
   '+306980000001', 'domestic', 'reported_scam', 'warned', now() - interval '3 days', now() - interval '3 days' + interval '4 minutes',
   'yes', 'police', false),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003',
   null, 'hidden', 'risky', 'warned', now() - interval '2 days', now() - interval '2 days' + interval '1 minute',
   'no', null, null),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003',
   '+306900000001', 'domestic', 'family', 'none', now() - interval '1 day', now() - interval '1 day' + interval '12 minutes',
   null, null, null);

insert into public.alerts (id, circle_id, protected_user_id, source, call_event_id, caller_number, status,
                           escalate_at, resolved_at, resolved_by, created_at) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000003',
   'call', '00000000-0000-4000-8000-0000000000e1', '+306980000001', 'resolved',
   now() - interval '3 days' + interval '9 minutes', now() - interval '3 days' + interval '20 minutes',
   '00000000-0000-4000-8000-000000000001', now() - interval '3 days' + interval '4 minutes');

insert into public.alert_deliveries (alert_id, recipient_user_id, channel, status, sent_at, delivered_at, seen_at) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-000000000001', 'push', 'delivered',
   now() - interval '3 days' + interval '4 minutes', now() - interval '3 days' + interval '4 minutes', now() - interval '3 days' + interval '6 minutes'),
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-000000000002', 'push', 'delivered',
   now() - interval '3 days' + interval '4 minutes', now() - interval '3 days' + interval '4 minutes', null);

-- Scam Radar ------------------------------------------------------------------------------------
insert into public.scam_radar_items (slug, category, title_el, title_en, summary_el, summary_en, body_el, body_en,
                                     what_to_do_el, what_to_do_en, featured_week, published, published_at) values
  ('geia-sou-mama-neo-noumero', 'new_number',
   '«Γεια σου μαμά, άλλαξα νούμερο»', '"Hi Mum, I have a new number"',
   'Μήνυμα από άγνωστο αριθμό που λέει ότι είναι το παιδί σου και σε λίγο ζητά λεφτά για έναν «επείγοντα» λογαριασμό.',
   'A message from an unknown number claiming to be your child, which soon asks for money for an "urgent" bill.',
   'Το μήνυμα έρχεται συνήθως σε Viber ή WhatsApp. Ο απατεώνας λέει ότι του χάλασε ή χάθηκε το κινητό. Μετά από λίγη κουβέντα ζητά να πληρώσεις κάτι για λογαριασμό του, «γιατί δεν μπορεί να μπει στην τράπεζα».',
   'The message usually arrives on Viber or WhatsApp. The scammer says their phone broke or was lost. After a little chat they ask you to pay something for them, "because they can''t get into their bank".',
   'Πάρε τηλέφωνο το παιδί σου στον παλιό του αριθμό. Ζήτα τη λέξη σας. Μην πληρώσεις τίποτα πριν μιλήσετε.',
   'Call your child on their old number. Ask for your family word. Don''t pay anything before you have spoken.',
   date_trunc('week', now())::date, true, now() - interval '2 days'),
  ('elta-sms-dema', 'fake_courier',
   'SMS για «δέμα που περιμένει» από τα ΕΛΤΑ', 'SMS about a "parcel waiting" from ELTA',
   'Ψεύτικο SMS λέει ότι ένα δέμα σου κρατείται και ζητά μικρή πληρωμή με σύνδεσμο.',
   'A fake SMS says your parcel is being held and asks for a small payment through a link.',
   'Ο σύνδεσμος οδηγεί σε σελίδα που μοιάζει με των ΕΛΤΑ και ζητά τα στοιχεία της κάρτας σου. Το ποσό είναι μικρό για να μην το σκεφτείς πολύ.',
   'The link leads to a page that looks like ELTA''s and asks for your card details. The amount is small so you don''t think twice.',
   'Μην πατήσεις τον σύνδεσμο. Αν περιμένεις δέμα, ρώτα την οικογένεια ή πήγαινε στο κατάστημα.',
   'Don''t tap the link. If you are expecting a parcel, ask your family or go to the post office.',
   null, true, now() - interval '10 days'),
  ('psevtikos-astynomikos-atyxima', 'fake_relative',
   '«Ο γιος σας είχε ατύχημα» — ψεύτικος αστυνομικός', '"Your son had an accident" — fake police officer',
   'Τηλεφωνούν και λένε ότι κάποιος δικός σου είχε ατύχημα και χρειάζονται μετρητά ή χρυσαφικά αμέσως.',
   'They call to say someone in your family had an accident and they need cash or gold straight away.',
   'Μιλούν γρήγορα, σε πιέζουν και λένε να μην κλείσεις το τηλέφωνο. Συχνά στέλνουν «συνεργάτη» στο σπίτι να πάρει τα χρήματα.',
   'They talk fast, pressure you and tell you not to hang up. Often they send a "colleague" to your home to collect the money.',
   'Κλείσε. Πάρε τηλέφωνο τον δικό σου στον αριθμό που ξέρεις. Η αστυνομία δεν ζητά ποτέ χρήματα στο τηλέφωνο.',
   'Hang up. Call your family member on the number you know. The police never ask for money on the phone.',
   null, true, now() - interval '20 days');

-- Org aggregates (anonymised counts only) -----------------------------------------------------
insert into public.org_stats_weekly (org_id, week_start, protected_people, checks, checks_scam, alerts, flagged_calls) values
  ('00000000-0000-4000-8000-0000000000a1', (date_trunc('week', now()) - interval '2 weeks')::date, 7, 21, 6, 1, 9),
  ('00000000-0000-4000-8000-0000000000a1', (date_trunc('week', now()) - interval '1 week')::date, 8, 25, 7, 2, 11);
