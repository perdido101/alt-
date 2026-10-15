import type { Locale } from '@alt/i18n';
import type { ScamCategory, Verdict } from '../enums';

/**
 * Test messages for analyzeMessage (§9). All names, numbers and links are invented.
 * `categories` lists every category we accept for the sample (the first is the best answer).
 * `verdicts` lists acceptable verdicts: scams must be "scam" (or "caution" where the message is
 * ambiguous on its own); safe messages must never be "scam".
 */
export type Sample = {
  id: string;
  locale: Locale;
  text: string;
  verdicts: Verdict[];
  categories: ScamCategory[];
};

export const scamSamplesEl: Sample[] = [
  {
    id: 'el-new-number-1',
    locale: 'el',
    text: 'Γεια σου μαμά, αυτό είναι το νέο μου νούμερο, μου έπεσε το κινητό. Μπορείς να μου κάνεις μια χάρη; Πρέπει να πληρώσω έναν λογαριασμό σήμερα και δεν μπαίνω στην τράπεζα.',
    verdicts: ['scam', 'caution'],
    categories: ['new_number', 'fake_relative'],
  },
  {
    id: 'el-new-number-2',
    locale: 'el',
    text: 'Μπαμπά άλλαξα αριθμό, σβήσε τον παλιό. Χρειάζομαι 850 ευρώ επειγόντως, στείλε μου σε αυτό το IBAN GR12 0110 1250 0000 0001 2300 695 και θα σου τα δώσω αύριο.',
    verdicts: ['scam'],
    categories: ['new_number', 'fake_relative'],
  },
  {
    id: 'el-accident-call',
    locale: 'el',
    text: 'Με πήραν τηλέφωνο και είπαν ότι ο γιος μου είχε ατύχημα και είναι στο νοσοκομείο. Ζήτησαν 5.000 ευρώ μετρητά για το χειρουργείο και ότι θα στείλουν άνθρωπο να τα πάρει από το σπίτι.',
    verdicts: ['scam'],
    categories: ['fake_relative', 'fake_police'],
  },
  {
    id: 'el-fake-police',
    locale: 'el',
    text: 'Είμαι ο αστυνόμος Παπαδάκης. Η κόρη σας συνελήφθη μετά από τροχαίο και για να μην πάει φυλακή πρέπει να καταβάλετε εγγύηση σήμερα. Μην κλείσετε το τηλέφωνο και μην το πείτε σε κανέναν.',
    verdicts: ['scam'],
    categories: ['fake_police', 'fake_relative'],
  },
  {
    id: 'el-fake-lawyer',
    locale: 'el',
    text: 'Καλησπέρα, είμαι δικηγόρος του εγγονού σας. Βρίσκεται στο κρατητήριο. Χρειάζεται να μου δώσετε χρυσαφικά ή μετρητά για να αφεθεί ελεύθερος απόψε.',
    verdicts: ['scam'],
    categories: ['fake_police', 'fake_relative'],
  },
  {
    id: 'el-elta-sms',
    locale: 'el',
    text: 'ΕΛΤΑ: Το δέμα σας κρατείται λόγω μη πληρωμής τελών αποστολής (1,99€). Πληρώστε εδώ: https://elta-paradosi-gr.info/pay εντός 24 ωρών.',
    verdicts: ['scam'],
    categories: ['fake_courier'],
  },
  {
    id: 'el-courier-customs',
    locale: 'el',
    text: 'ACS Courier: Η αποστολή σας χρειάζεται εκτελωνισμό. Καταβάλετε 3,45€ στο bit.ly/acs-delivery-gr για να γίνει η παράδοση.',
    verdicts: ['scam'],
    categories: ['fake_courier'],
  },
  {
    id: 'el-bank-block',
    locale: 'el',
    text: 'Αγαπητέ πελάτη, η κάρτα σας θα μπλοκαριστεί λόγω ύποπτης κίνησης. Επιβεβαιώστε τα στοιχεία σας άμεσα: https://ebanking-secure-verify.com',
    verdicts: ['scam'],
    categories: ['fake_bank'],
  },
  {
    id: 'el-bank-code',
    locale: 'el',
    text: 'Καλημέρα, σας καλώ από το τμήμα ασφαλείας της τράπεζας. Για να ακυρώσουμε τη συναλλαγή θα σας έρθει ένας κωδικός με SMS, πείτε μου τον κωδικό που σας ήρθε.',
    verdicts: ['scam'],
    categories: ['fake_bank', 'identity_request'],
  },
  {
    id: 'el-dei-refund',
    locale: 'el',
    text: 'ΔΕΗ: Δικαιούστε επιστροφή 86,40€ από υπερχρέωση λογαριασμού ρεύματος. Συμπληρώστε τα στοιχεία της κάρτας σας στο dei-epistrofi.online για να λάβετε το ποσό.',
    verdicts: ['scam'],
    categories: ['fake_utility_refund'],
  },
  {
    id: 'el-tax-refund',
    locale: 'el',
    text: 'ΑΑΔΕ: Έχετε εκκρεμή επιστροφή φόρου 312€. Πατήστε εδώ https://aade-epistrofi.top για να την παραλάβετε πριν λήξει η προθεσμία.',
    verdicts: ['scam'],
    categories: ['fake_utility_refund'],
  },
  {
    id: 'el-prize',
    locale: 'el',
    text: 'Συγχαρητήρια! Κερδίσατε ένα iPhone στην κλήρωση του σούπερ μάρκετ. Πληρώστε μόνο 2€ για τα έξοδα αποστολής εδώ: https://dwro-klirosi.shop',
    verdicts: ['scam'],
    categories: ['prize'],
  },
  {
    id: 'el-investment',
    locale: 'el',
    text: 'Επένδυσε 250€ σε κρυπτονομίσματα με την πλατφόρμα μας και κέρδισε μέχρι 3.000€ τον μήνα. Εγγυημένη απόδοση. Ο σύμβουλός μας θα σε καλέσει.',
    verdicts: ['scam'],
    categories: ['investment'],
  },
  {
    id: 'el-romance',
    locale: 'el',
    text: 'Αγάπη μου, σε σκέφτομαι συνέχεια. Θέλω πολύ να έρθω να σε δω αλλά δεν έχω λεφτά για το εισιτήριο. Μπορείς να μου στείλεις 600 ευρώ; Θα σου τα επιστρέψω μόλις φτάσω.',
    verdicts: ['scam'],
    categories: ['romance'],
  },
  {
    id: 'el-id-request',
    locale: 'el',
    text: 'Για να ολοκληρωθεί η επιδότηση του ΟΠΕΚΑ στείλτε μας φωτογραφία της ταυτότητάς σας από τις δύο πλευρές και μια selfie με την ταυτότητα.',
    verdicts: ['scam'],
    categories: ['identity_request'],
  },
  {
    id: 'el-remote-access',
    locale: 'el',
    text: 'Σας καλούμε από την Cosmote. Ο υπολογιστής σας έχει ιό. Εγκαταστήστε την εφαρμογή AnyDesk για να σας βοηθήσουμε αμέσως.',
    verdicts: ['scam'],
    categories: ['identity_request', 'other'],
  },
];

export const scamSamplesEn: Sample[] = [
  {
    id: 'en-hi-mum',
    locale: 'en',
    text: "Hi Mum, it's me, this is my new number, my phone broke. Can you send me some money for a bill today? I'll pay you back tomorrow.",
    verdicts: ['scam'],
    categories: ['new_number', 'fake_relative'],
  },
  {
    id: 'en-parcel',
    locale: 'en',
    text: 'Royal Mail: your parcel is waiting for delivery. Please pay the outstanding fee of £1.45 at https://parcel-redelivery-uk.info within 24 hours.',
    verdicts: ['scam'],
    categories: ['fake_courier'],
  },
  {
    id: 'en-bank-otp',
    locale: 'en',
    text: "This is your bank's fraud team. Someone is trying to use your card. Please tell me the verification code we just sent you so we can block it.",
    verdicts: ['scam'],
    categories: ['fake_bank', 'identity_request'],
  },
  {
    id: 'en-police-bail',
    locale: 'en',
    text: 'Police officer here. Your grandson was arrested after an accident. He needs bail money today. Do not hang up and do not tell anyone.',
    verdicts: ['scam'],
    categories: ['fake_police', 'fake_relative'],
  },
  {
    id: 'en-prize',
    locale: 'en',
    text: 'Congratulations! You have won a £500 gift card. Claim your prize now at https://claim-winner-now.xyz before it expires.',
    verdicts: ['scam'],
    categories: ['prize'],
  },
  {
    id: 'en-crypto',
    locale: 'en',
    text: 'Invest just €250 in our crypto trading platform and get guaranteed returns of 40% a month. Our advisor will call you to set up your account.',
    verdicts: ['scam'],
    categories: ['investment'],
  },
  {
    id: 'en-tax-refund',
    locale: 'en',
    text: 'HMRC: You are eligible for a tax refund of £264.80. Submit your card details at https://hmrc-refund-claim.online to receive it.',
    verdicts: ['scam'],
    categories: ['fake_utility_refund'],
  },
];

export const safeSamples: Sample[] = [
  {
    id: 'safe-el-appointment',
    locale: 'el',
    text: 'Υπενθύμιση: Το ραντεβού σας με τον καρδιολόγο είναι την Τρίτη 14/10 στις 11:30. Για αλλαγή καλέστε στο ιατρείο.',
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-el-family',
    locale: 'el',
    text: 'Μαμά θα έρθουμε την Κυριακή για φαγητό με τα παιδιά. Να φέρω γλυκό;',
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-el-delivery',
    locale: 'el',
    text: 'ACS: Η αποστολή σας θα παραδοθεί αύριο μεταξύ 10:00 και 14:00. Δεν απαιτείται καμία ενέργεια.',
    verdicts: ['safe', 'caution'],
    categories: ['none', 'fake_courier'],
  },
  {
    id: 'safe-el-pharmacy',
    locale: 'el',
    text: 'Φαρμακείο Γεωργίου: Τα φάρμακά σας είναι έτοιμα για παραλαβή. Ωράριο 8:00-14:00.',
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-el-grandchild',
    locale: 'el',
    text: 'Γιαγιά καλημέρα! Πήρα 19 στο διαγώνισμα των μαθηματικών! Σε φιλώ πολύ.',
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-el-municipality',
    locale: 'el',
    text: 'Δήμος: Την Πέμπτη 16/10 δεν θα γίνει αποκομιδή απορριμμάτων λόγω αργίας. Ευχαριστούμε για την κατανόηση.',
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-en-family',
    locale: 'en',
    text: "Hi Dad, landed safely in Athens. I'll call you tonight after dinner. Love you.",
    verdicts: ['safe'],
    categories: ['none'],
  },
  {
    id: 'safe-en-delivery',
    locale: 'en',
    text: 'Your order has been dispatched and will arrive on Thursday. No action is needed.',
    verdicts: ['safe', 'caution'],
    categories: ['none', 'fake_courier'],
  },
  {
    id: 'safe-en-doctor',
    locale: 'en',
    text: 'Reminder from the surgery: your flu vaccination is booked for Monday at 9:15.',
    verdicts: ['safe'],
    categories: ['none'],
  },
];

export const allSamples: Sample[] = [...scamSamplesEl, ...scamSamplesEn, ...safeSamples];
