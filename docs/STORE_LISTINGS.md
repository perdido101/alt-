# Store listings (draft)

Greek is the primary listing; English for the EU. Have a native speaker and the lawyer review before
submitting. Character limits: Play title 30, short description 80, full 4000; App Store name 30,
subtitle 30, promotional text 170, keywords 100.

## Greek (el-GR)

**Όνομα / Title:** ΑΛΤ! Προστασία από απάτες

**Υπότιτλος (iOS) / Short description (Play):**
- iOS (30): Πριν πληρώσεις, ρώτα.
- Play (80): Προστασία από τηλεφωνικές απάτες για τους γονείς σας. Πριν πληρώσεις, ρώτα.

**Promotional text (iOS):** Ένα κουμπί που ειδοποιεί την οικογένεια όταν κάποιος ζητάει λεφτά. Έλεγχος
μηνυμάτων, προειδοποίηση για ύποπτες κλήσεις, οικογενειακή λέξη ασφαλείας.

**Περιγραφή:**

Η ΑΛΤ! προστατεύει τους μεγαλύτερους από τις απάτες στο τηλέφωνο και στα μηνύματα. Το παιδί τη στήνει,
ο γονιός απλώς τη χρησιμοποιεί.

ΠΩΣ ΒΟΗΘΑΕΙ
• «Κάποιος μου ζητάει λεφτά»: ένα μεγάλο κουμπί που ειδοποιεί αμέσως όλη την οικογένεια. Αν δεν απαντήσει
  κανείς σε 5 λεπτά, στέλνουμε και SMS.
• Έλεγχος μηνύματος: φωτογραφία, φωνητικό ή επικόλληση. Η απάντηση έρχεται σε λίγα δευτερόλεπτα, με απλά
  λόγια: «Πολύ πιθανή απάτη», «Πρόσεξε» ή «Μάλλον ασφαλές».
• Προειδοποίηση κλήσεων (Android): όταν χτυπάει άγνωστος ή αναφερμένος αριθμός, εμφανίζεται μήνυμα.
  Στο iPhone, οι γνωστοί αριθμοί απάτης φαίνονται ως «Πιθανή απάτη».
• «Ποιος σου είπε ότι είναι;»: μετά από ύποπτη κλήση, η εφαρμογή βοηθά να ελέγξετε αν ήταν πράγματι η
  αστυνομία, η τράπεζα ή συγγενής.
• Οικογενειακή λέξη ασφαλείας: μια λέξη που ξέρει μόνο η οικογένεια, για να ξεσκεπάζετε όποιον παριστάνει
  τον συγγενή.

ΓΙΑ ΤΟΝ ΓΟΝΙΟ
Μεγάλα γράμματα, μεγάλα κουμπιά, ανάγνωση φωναχτά, ελληνικά παντού. Χωρίς κωδικούς και χωρίς λογαριασμό.

ΓΙΑ ΤΑ ΠΑΙΔΙΑ
Ειδοποίηση τη στιγμή που χρειάζεται, ιστορικό ελέγχων, κατάσταση προστασίας και εβδομαδιαία σύνοψη.

ΙΔΙΩΤΙΚΟΤΗΤΑ
Δεν διαβάζουμε τα μηνύματα του γονιού σας: ελέγχουμε μόνο όσα μας στέλνει, και κρατάμε μόνο το
αποτέλεσμα. Δεν έχουμε πρόσβαση στις κλήσεις ή στα SMS του. Η ΑΛΤ! ποτέ δεν ζητάει κωδικούς τράπεζας,
αριθμούς κάρτας ή PIN.

Δωρεάν για 2 φροντιστές και 1 γονιό. Οικογενειακό πακέτο με δοκιμή 30 ημερών.

**Λέξεις-κλειδιά (iOS, 100):** απάτη,απατεώνες,ηλικιωμένοι,γονείς,ασφάλεια,κλήσεις,SMS,τράπεζα,οικογένεια,προστασία

## English (en)

**Title:** ΑΛΤ! Scam protection

**Subtitle (iOS):** Before you pay, ask.
**Short description (Play):** Protect your parents from phone and message scams. Before you pay, ask.

**Description:**

ΑΛΤ! protects older people from phone and message scams. The adult child sets it up; the parent just uses it.

• "Someone is asking me for money": one big button that alerts the whole family at once, with SMS if
  nobody answers in 5 minutes.
• Check a message: photo, voice note or paste. A plain answer in seconds.
• Call warnings (Android) for unknown and reported numbers; on iPhone, known scam numbers are labelled.
• After a suspicious call, ΑΛΤ! helps check whether it was really the police, the bank or a relative.
• A family safe word that unmasks anyone pretending to be a relative.

Large text, large buttons, read-aloud, Greek and English. We never read your parent's messages: we only
check what they send us and keep only the verdict. ΑΛΤ! never asks for bank codes, card numbers or PINs.

## Screenshots (both stores, both languages)

1. Parent home with the big "Κάποιος μου ζητάει λεφτά" button.
2. Red verdict "Πολύ πιθανή απάτη" for a fake ΕΛΤΑ SMS.
3. Ringing warning on Android.
4. Guardian alert banner "Μαρία ζήτησε βοήθεια".
5. Safe word setup.
6. Guardian dashboard with protection status.

Use the demo family from `supabase/seed.sql`; never real numbers.

## Review notes for Apple / Google

- Demo: guardian account `review@<domain>` (magic-link code shown in the review notes), plus an invite QR
  for the parent side.
- Explain the call-screening role, full-screen intent (after-call question only) and overlay
  (`docs/PERMISSIONS.md`).
- Subscriptions are sold on the website (EU); the app shows plan status only.
- Category: Lifestyle (or Utilities). Age rating: 4+ / Everyone.
