import type { ScamCategory } from '@alt/core';

/**
 * Bundled Scam Radar items, identical to supabase/seed.sql. Used when Supabase isn't configured
 * (local development, Playwright) so the site always renders. Production reads scam_radar_items.
 */
export type RadarRow = {
  slug: string;
  category: ScamCategory;
  title_el: string;
  title_en: string;
  summary_el: string;
  summary_en: string;
  body_el: string;
  body_en: string;
  what_to_do_el: string;
  what_to_do_en: string;
  featured_week: string | null;
  published_at: string;
};

export const fallbackRadar: RadarRow[] = [
  {
    slug: 'geia-sou-mama-neo-noumero',
    category: 'new_number',
    title_el: '«Γεια σου μαμά, άλλαξα νούμερο»',
    title_en: '"Hi Mum, I have a new number"',
    summary_el: 'Μήνυμα από άγνωστο αριθμό που λέει ότι είναι το παιδί σου και σε λίγο ζητά λεφτά για έναν «επείγοντα» λογαριασμό.',
    summary_en: 'A message from an unknown number claiming to be your child, which soon asks for money for an "urgent" bill.',
    body_el: 'Το μήνυμα έρχεται συνήθως σε Viber ή WhatsApp. Ο απατεώνας λέει ότι του χάλασε ή χάθηκε το κινητό. Μετά από λίγη κουβέντα ζητά να πληρώσεις κάτι για λογαριασμό του, «γιατί δεν μπορεί να μπει στην τράπεζα».',
    body_en: "The message usually arrives on Viber or WhatsApp. The scammer says their phone broke or was lost. After a little chat they ask you to pay something for them, \"because they can't get into their bank\".",
    what_to_do_el: 'Πάρε τηλέφωνο το παιδί σου στον παλιό του αριθμό. Ζήτα τη λέξη σας. Μην πληρώσεις τίποτα πριν μιλήσετε.',
    what_to_do_en: "Call your child on their old number. Ask for your family word. Don't pay anything before you have spoken.",
    featured_week: '2026-10-12',
    published_at: '2026-10-13T09:00:00Z',
  },
  {
    slug: 'elta-sms-dema',
    category: 'fake_courier',
    title_el: 'SMS για «δέμα που περιμένει» από τα ΕΛΤΑ',
    title_en: 'SMS about a "parcel waiting" from ELTA',
    summary_el: 'Ψεύτικο SMS λέει ότι ένα δέμα σου κρατείται και ζητά μικρή πληρωμή με σύνδεσμο.',
    summary_en: 'A fake SMS says your parcel is being held and asks for a small payment through a link.',
    body_el: 'Ο σύνδεσμος οδηγεί σε σελίδα που μοιάζει με των ΕΛΤΑ και ζητά τα στοιχεία της κάρτας σου. Το ποσό είναι μικρό για να μην το σκεφτείς πολύ.',
    body_en: "The link leads to a page that looks like ELTA's and asks for your card details. The amount is small so you don't think twice.",
    what_to_do_el: 'Μην πατήσεις τον σύνδεσμο. Αν περιμένεις δέμα, ρώτα την οικογένεια ή πήγαινε στο κατάστημα.',
    what_to_do_en: "Don't tap the link. If you are expecting a parcel, ask your family or go to the post office.",
    featured_week: null,
    published_at: '2026-10-05T09:00:00Z',
  },
  {
    slug: 'psevtikos-astynomikos-atyxima',
    category: 'fake_relative',
    title_el: '«Ο γιος σας είχε ατύχημα» — ψεύτικος αστυνομικός',
    title_en: '"Your son had an accident" — fake police officer',
    summary_el: 'Τηλεφωνούν και λένε ότι κάποιος δικός σου είχε ατύχημα και χρειάζονται μετρητά ή χρυσαφικά αμέσως.',
    summary_en: 'They call to say someone in your family had an accident and they need cash or gold straight away.',
    body_el: 'Μιλούν γρήγορα, σε πιέζουν και λένε να μην κλείσεις το τηλέφωνο. Συχνά στέλνουν «συνεργάτη» στο σπίτι να πάρει τα χρήματα.',
    body_en: 'They talk fast, pressure you and tell you not to hang up. Often they send a "colleague" to your home to collect the money.',
    what_to_do_el: 'Κλείσε. Πάρε τηλέφωνο τον δικό σου στον αριθμό που ξέρεις. Η αστυνομία δεν ζητά ποτέ χρήματα στο τηλέφωνο.',
    what_to_do_en: 'Hang up. Call your family member on the number you know. The police never ask for money on the phone.',
    featured_week: null,
    published_at: '2026-09-25T09:00:00Z',
  },
];
