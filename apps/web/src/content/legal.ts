import type { Locale } from '@alt/i18n';

/**
 * Plain-language privacy notice and terms. Long-form legal text lives here rather than in the UI catalogs.
 * Placeholders in [BRACKETS] must be filled in, and both texts need review by a Greek lawyer before launch.
 */
export type LegalDoc = { title: string; updated: string; sections: Array<{ id?: string; heading: string; body: string[] }> };

const privacyEl: LegalDoc = {
  title: 'Απόρρητο',
  updated: 'Τελευταία ενημέρωση: [ΗΜΕΡΟΜΗΝΙΑ]',
  sections: [
    {
      heading: 'Με λίγα λόγια',
      body: [
        'Η ΑΛΤ! υπάρχει για να προστατεύει τους γονείς σας από απάτες. Κρατάμε όσο λιγότερα στοιχεία γίνεται. Δεν κρατάμε τα μηνύματα, τις φωτογραφίες ή τις συνομιλίες που ελέγχετε, και δεν ακούμε ποτέ τηλεφωνήματα.',
        'Η ΑΛΤ! δεν θα σας ζητήσει ποτέ κωδικούς τράπεζας, αριθμό κάρτας, PIN ή συνθηματικά.',
      ],
    },
    {
      heading: 'Ποιοι είμαστε',
      body: ['Υπεύθυνος επεξεργασίας: [ΕΠΩΝΥΜΙΑ ΕΤΑΙΡΕΙΑΣ], [ΔΙΕΥΘΥΝΣΗ], ΑΦΜ [ΑΦΜ]. Επικοινωνία για θέματα απορρήτου: [EMAIL ΑΠΟΡΡΗΤΟΥ].'],
    },
    {
      heading: 'Τι στοιχεία χρησιμοποιούμε',
      body: [
        'Φροντιστές: email ή κινητό για τη σύνδεση, όνομα, γλώσσα, στοιχεία συνδρομής (η πληρωμή γίνεται από τη Stripe, εμείς δεν βλέπουμε την κάρτα σας).',
        'Προστατευόμενοι: όνομα, προαιρετικά ο αριθμός του κινητού τους, γλώσσα και μέγεθος γραμμάτων. Δεν χρειάζεται email ή κωδικός.',
        'Τηλέφωνα της οικογένειας που προσθέτετε στη ρύθμιση, για να μην εμφανίζονται προειδοποιήσεις όταν σας παίρνει η οικογένεια.',
        'Έλεγχοι μηνυμάτων: κρατάμε μόνο το αποτέλεσμα (π.χ. «Πιθανή απάτη», η κατηγορία και μια σύντομη εξήγηση). Το κείμενο, η φωτογραφία ή η ηχογράφηση αναλύονται και διαγράφονται αμέσως.',
        'Κλήσεις: για κλήσεις από αριθμούς που δεν είναι της οικογένειας κρατάμε τον αριθμό, την ώρα, πώς τον χαρακτηρίσαμε και τις απαντήσεις στην ερώτηση μετά την κλήση. Ποτέ τον ήχο ή το περιεχόμενο της κλήσης.',
        'Ειδοποιήσεις οικογένειας: πότε πατήθηκε το κουμπί, ποιος ειδοποιήθηκε και πότε το είδε.',
        'Η λέξη της οικογένειας: την κρατάμε μόνο κρυπτογραφημένη με τρόπο που δεν αντιστρέφεται. Ούτε εμείς δεν μπορούμε να τη δούμε.',
        'Στοιχεία συσκευής: αν η προστασία κλήσεων είναι ενεργή και ποιες άδειες έχουν δοθεί, για να σας ειδοποιούμε αν κάτι σταματήσει να δουλεύει.',
      ],
    },
    {
      heading: 'Ποιος τα βλέπει',
      body: [
        'Οι φροντιστές της οικογένειας βλέπουν τους ελέγχους, τις κλήσεις που χαρακτηρίστηκαν ύποπτες και τις ειδοποιήσεις του γονιού τους. Ο γονιός το βλέπει και το αποδέχεται κατά τη ρύθμιση, και μπορεί να το ξαναδεί από την οθόνη «Ποιος με προστατεύει».',
        'Δήμοι και άλλοι οργανισμοί που προσφέρουν την ΑΛΤ! βλέπουν μόνο ανώνυμους αριθμούς ανά εβδομάδα (π.χ. «42 έλεγχοι»). Ποτέ ονόματα, αριθμούς ή μηνύματα.',
      ],
    },
    {
      heading: 'Γιατί (νομική βάση)',
      body: [
        'Για να σας παρέχουμε την υπηρεσία που ζητήσατε (εκτέλεση σύμβασης).',
        'Η κοινή χρήση με την οικογένεια γίνεται με τη συγκατάθεση του γονιού, που μπορεί να την ανακαλέσει αφήνοντας την οικογένεια.',
        'Για την ασφάλεια της υπηρεσίας και την πρόληψη κατάχρησης (έννομο συμφέρον).',
      ],
    },
    {
      heading: 'Με ποιους συνεργαζόμαστε',
      body: [
        'Supabase (βάση δεδομένων, Ευρωπαϊκή Ένωση), Vercel (ιστότοπος, Ευρωπαϊκή Ένωση), Anthropic (ανάλυση μηνυμάτων· το περιεχόμενο στέλνεται μόνο για τον έλεγχο), ElevenLabs (μετατροπή φωνητικού σε κείμενο, όταν δεν γίνεται στο κινητό), Expo (ειδοποιήσεις), [ΠΑΡΟΧΟΣ SMS] (SMS), Resend (email), Stripe (πληρωμές), PostHog (ανώνυμα στατιστικά χρήσης, Ευρωπαϊκή Ένωση), Sentry (σφάλματα, χωρίς προσωπικά στοιχεία), Upstash (όρια χρήσης).',
        'Όπου δεδομένα μεταφέρονται εκτός ΕΕ, χρησιμοποιούμε τις Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής.',
      ],
    },
    {
      heading: 'Πόσο τα κρατάμε',
      body: [
        'Φωτογραφίες και ηχογραφήσεις: διαγράφονται αμέσως μετά τον έλεγχο.',
        'Ιστορικό ελέγχων, κλήσεων και ειδοποιήσεων: όσο υπάρχει ο λογαριασμός, ή λιγότερο αν το ρυθμίσετε.',
        'Στοιχεία πληρωμών: όσο ορίζει η φορολογική νομοθεσία.',
      ],
    },
    {
      heading: 'Τα δικαιώματά σας',
      body: [
        'Μπορείτε να δείτε, να κατεβάσετε ή να διαγράψετε τα στοιχεία σας από τις Ρυθμίσεις, ή να μας γράψετε στο [EMAIL ΑΠΟΡΡΗΤΟΥ]. Μπορείτε επίσης να υποβάλετε καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (www.dpa.gr).',
      ],
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: [
        'Ο ιστότοπος λειτουργεί χωρίς cookies παρακολούθησης. Μετράμε επισκέψεις ανώνυμα (Vercel Analytics, χωρίς cookies). Μόνο αν συμφωνήσετε, χρησιμοποιούμε ένα cookie στατιστικών (PostHog) για να καταλάβουμε πώς χρησιμοποιείται ο ιστότοπος. Η σύνδεση στον λογαριασμό χρησιμοποιεί απαραίτητα cookies.',
      ],
    },
  ],
};

const privacyEn: LegalDoc = {
  title: 'Privacy',
  updated: 'Last updated: [DATE]',
  sections: [
    {
      heading: 'In short',
      body: [
        "ΑΛΤ! exists to protect your parents from scams. We keep as little data as possible. We don't keep the messages, photos or conversations you check, and we never listen to phone calls.",
        'ΑΛΤ! will never ask you for bank codes, card numbers, PINs or passwords.',
      ],
    },
    { heading: 'Who we are', body: ['Controller: [COMPANY NAME], [ADDRESS], VAT no. [VAT]. Privacy contact: [PRIVACY EMAIL].'] },
    {
      heading: 'What we use',
      body: [
        "Guardians: email or mobile number to sign in, name, language, subscription details (payments are handled by Stripe; we never see your card).",
        "Protected people: name, optionally their mobile number, language and text size. No email or password needed.",
        'Family phone numbers you add during setup, so calls from family never show a warning.',
        'Message checks: we keep only the result (e.g. "Possible scam", the category and a short reason). The text, photo or recording is analysed and deleted straight away.',
        "Calls: for calls from non-family numbers we keep the number, the time, how we classified it and the answers to the after-call question. Never the audio or content of a call.",
        'Family alerts: when the button was pressed, who was notified and when they saw it.',
        "Your family word: stored only as a one-way hash. Not even we can read it.",
        "Device status: whether call protection is on and which permissions are granted, so we can tell you if something stops working.",
      ],
    },
    {
      heading: 'Who sees it',
      body: [
        "The family's guardians see their parent's checks, suspicious calls and alerts. The parent sees and accepts this during setup, and can review it any time on the \"Who protects me\" screen.",
        'Municipalities and other organisations that offer ΑΛΤ! only see anonymous weekly counts (e.g. "42 checks"). Never names, numbers or messages.',
      ],
    },
    {
      heading: 'Why (legal basis)',
      body: [
        'To provide the service you asked for (contract).',
        "Sharing with the family is based on the parent's consent, which they can withdraw by leaving the family.",
        'To keep the service secure and prevent abuse (legitimate interest).',
      ],
    },
    {
      heading: 'Who we work with',
      body: [
        'Supabase (database, EU), Vercel (website, EU), Anthropic (message analysis; content is sent only to perform the check), ElevenLabs (speech-to-text when it can’t be done on the phone), Expo (notifications), [SMS PROVIDER] (SMS), Resend (email), Stripe (payments), PostHog (anonymous usage statistics, EU), Sentry (errors, no personal data), Upstash (rate limits).',
        "Where data leaves the EU, we rely on the European Commission's Standard Contractual Clauses.",
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'Photos and recordings: deleted straight after the check.',
        'Check, call and alert history: for as long as the account exists, or shorter if you choose.',
        'Payment records: as long as tax law requires.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can view, download or delete your data from Settings, or write to [PRIVACY EMAIL]. You can also complain to the Hellenic Data Protection Authority (www.dpa.gr).',
      ],
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: [
        'The website works without tracking cookies. We count visits anonymously (Vercel Analytics, cookieless). Only if you agree do we use an analytics cookie (PostHog) to understand how the site is used. Signing in uses strictly necessary cookies.',
      ],
    },
  ],
};

const termsEl: LegalDoc = {
  title: 'Όροι χρήσης',
  updated: 'Τελευταία ενημέρωση: [ΗΜΕΡΟΜΗΝΙΑ]',
  sections: [
    { heading: 'Η υπηρεσία', body: ['Η ΑΛΤ! προειδοποιεί για ύποπτες κλήσεις και μηνύματα και ειδοποιεί την οικογένεια. Βοηθά, αλλά δεν μπορεί να εντοπίσει κάθε απάτη. Σε έκτακτη ανάγκη καλέστε το 112 ή το 100.'] },
    { heading: 'Λογαριασμοί', body: ['Ο φροντιστής δημιουργεί την οικογένεια και είναι υπεύθυνος να ενημερώσει τον γονιό. Ο γονιός αποδέχεται την κοινή χρήση στην εφαρμογή.'] },
    {
      heading: 'Πληρωμές',
      body: [
        'Το πρόγραμμα Οικογένεια έχει 30 μέρες δωρεάν. Η συνδρομή ανανεώνεται αυτόματα και ακυρώνεται οποτεδήποτε από τη Διαχείριση συνδρομής. Αν αποτύχει μια πληρωμή, η προστασία συνεχίζει για 7 μέρες.',
        'Η ειδοποίηση οικογένειας και οι προειδοποιήσεις κλήσεων δεν απενεργοποιούνται ποτέ λόγω πληρωμής.',
        'Οι κωδικοί δώρου ισχύουν για 2 χρόνια από την αγορά. Τα παραστατικά εκδίδονται σύμφωνα με την ελληνική νομοθεσία (myDATA).',
      ],
    },
    { heading: 'Χρήση', body: ['Δεν επιτρέπεται η χρήση της ΑΛΤ! για παρακολούθηση άλλου προσώπου χωρίς τη γνώση του, ή η αναφορά αριθμών με κακή πρόθεση.'] },
    { heading: 'Ευθύνη', body: ['[ΚΕΙΜΕΝΟ ΠΕΡΙΟΡΙΣΜΟΥ ΕΥΘΥΝΗΣ ΠΡΟΣ ΝΟΜΙΚΟ ΕΛΕΓΧΟ]'] },
    { heading: 'Εφαρμοστέο δίκαιο', body: ['Ελληνικό δίκαιο. Αρμόδια τα δικαστήρια [ΠΟΛΗ].'] },
  ],
};

const termsEn: LegalDoc = {
  title: 'Terms of use',
  updated: 'Last updated: [DATE]',
  sections: [
    { heading: 'The service', body: ['ΑΛΤ! warns about suspicious calls and messages and alerts the family. It helps, but it cannot catch every scam. In an emergency call 112 or 100.'] },
    { heading: 'Accounts', body: ['The guardian creates the family and is responsible for informing the parent. The parent accepts the sharing in the app.'] },
    {
      heading: 'Payments',
      body: [
        'The Family plan includes 30 days free. Subscriptions renew automatically and can be cancelled any time in Manage subscription. If a payment fails, protection continues for 7 days.',
        'Family alerts and call warnings are never switched off because of payment.',
        'Gift codes are valid for 2 years from purchase. Invoices are issued under Greek law (myDATA).',
      ],
    },
    { heading: 'Use', body: ["You may not use ΑΛΤ! to monitor someone without their knowledge, or report numbers in bad faith."] },
    { heading: 'Liability', body: ['[LIMITATION OF LIABILITY TEXT FOR LEGAL REVIEW]'] },
    { heading: 'Governing law', body: ['Greek law. Courts of [CITY].'] },
  ],
};

export const legal: Record<'privacy' | 'terms', Record<Locale, LegalDoc>> = {
  privacy: { el: privacyEl, en: privacyEn },
  terms: { el: termsEl, en: termsEn },
};
