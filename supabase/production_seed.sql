-- Production reference data: verified emergency numbers, placeholders for the official directory, and
-- the first Scam Radar items. No people, no demo family, no safe word. Safe to run once on a new project.

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
