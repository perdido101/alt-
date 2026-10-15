import type { ScamCategory } from '../enums';

/**
 * Deterministic scam signals for Greek and English messages. They are a safety net under the model:
 * they never decide "safe", they only stop a strongly suspicious message from being called safe,
 * and they give a sensible verdict when the model is unavailable.
 */
export type Signal =
  | 'link'
  | 'short_link'
  | 'payment_request'
  | 'money_request'
  | 'code_request'
  | 'card_request'
  | 'id_request'
  | 'urgency'
  | 'secrecy'
  | 'new_number'
  | 'accident'
  | 'police'
  | 'bank'
  | 'courier'
  | 'utility_refund'
  | 'prize'
  | 'investment'
  | 'romance'
  | 'remote_access'
  | 'amount';

export type HeuristicResult = {
  signals: Signal[];
  strength: 'none' | 'weak' | 'strong';
  category: ScamCategory;
};

/**
 * Lowercase and strip Greek accents so patterns can be written without tonos.
 * Note: JS `\w` is ASCII-only, so patterns use [a-zα-ω0-9_] to match Greek word characters.
 */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');
}

const PATTERNS: Record<Signal, RegExp[]> = {
  link: [/https?:\/\/\S+/, /\bwww\.\S+/, /\b[a-z0-9-]+\.(?:com|gr|net|org|info|xyz|top|link|site|online|shop|app|io|me|cc)\b(?:\/\S*)?/],
  short_link: [/\b(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|is\.gd|rb\.gy|shorturl\.at|t\.ly|tiny\.cc)\b/],
  payment_request: [
    /πληρωσ|πληρωμ|καταβολ|καταβαλ|εξοφλ|τελη\s+(?:αποστολ|εκτελωνισ|παραδοσ)|εκτελωνισ|οφειλ/,
    /\bpay(?:ment)?\b|\bfee\b|customs|outstanding|settle/,
  ],
  money_request: [
    /(?:στειλ|δωσ|βαλ|μεταφερ|καταθεσ|δανεισ)[a-zα-ω0-9_]*\s+(?:μου\s+)?(?:λιγα\s+)?(?:λεφτα|χρηματα|ευρω|μετρητα|€)/,
    /(?:στειλ|δωσ|βαλ|μεταφερ|καταθεσ|δανεισ)[a-zα-ω0-9_]*\s+(?:μου\s+)?\d[\d.,]*\s*(?:ευρω|€)/,
    /χρειαζομαι\s+(?:λεφτα|χρηματα|\d+\s*(?:ευρω|€))/,
    /(?:λεφτα|χρηματα|μετρητα|χρυσαφικ)[a-zα-ω0-9_]*\s+(?:αμεσα|τωρα|σημερα|γρηγορα)/,
    /μετρητα|χρυσαφικα|κοσμηματα/,
    /\biban\b|γρ\d{2}\s?\d{4}/,
    /send (?:me )?(?:some )?money|transfer (?:the )?money|wire (?:the )?money|need (?:some )?money|lend me|gift cards?/,
  ],
  code_request: [
    /κωδικ[a-zα-ω0-9_]*\s+(?:που\s+)?(?:σου\s+|σασ\s+)?(?:ηρθε|ηλθε|εστειλαν|λαβεσ|λαβατε)|(?:πεσ|πειτε|στειλ[a-zα-ω0-9_]*|δωσ[a-zα-ω0-9_]*|διαβασ[a-zα-ω0-9_]*)\s+(?:μου\s+)?(?:τον\s+)?κωδικ|\bpin\b|\botp\b|κωδικο\s+(?:μιασ\s+χρησησ|επιβεβαιωσησ)/,
    /επιβεβαιωσ[a-zα-ω0-9_]*\s+(?:τα\s+)?στοιχει|συνδεθειτε\s+για\s+να/,
    /(?:send|tell|give|share) (?:me )?(?:the |your )?(?:code|pin|password|otp)|verification code/,
  ],
  card_request: [/(?:αριθμ[a-zα-ω0-9_]*|στοιχει[a-zα-ω0-9_]*)\s+(?:τησ\s+)?καρτ|cvv|cvc|ημερομηνια\s+ληξησ/, /card (?:number|details)|expiry date/],
  id_request: [/(?:φωτογραφι[a-zα-ω0-9_]*|αντιγραφ[a-zα-ω0-9_]*)\s+(?:τησ\s+|του\s+)?(?:ταυτοτητ|διαβατηρ)|selfie\s+με\s+την\s+ταυτοτητα/, /photo of (?:your )?(?:id|passport)|id card photo/],
  urgency: [
    /αμεσα|επειγ|σημερα\s+κιολασ|εντοσ\s+\d+\s*(?:ωρ|λεπτ)|τελευταια\s+ειδοποιηση|θα\s+(?:μπλοκαρ|απενεργοποι|κλειδω|ακυρω|επιστραφ)|γρηγορα/,
    /urgent|immediately|within \d+ hours|last (?:notice|chance)|will be (?:blocked|suspended|returned|cancelled)|right now/,
  ],
  secrecy: [/μην\s+(?:το\s+)?(?:πεισ|πειτε)\s+σε\s+κανεναν|μην\s+κλεισ(?:εισ|ετε)|μυστικο\s+μασ/, /don'?t tell anyone|keep (?:this|it) (?:a )?secret|do not hang up/],
  new_number: [
    /(?:νεο|καινουργιο|καινουριο)\s+(?:μου\s+)?(?:νουμερο|αριθμο|κινητο)|αλλαξα\s+(?:νουμερο|αριθμο|κινητο)|χαλασε\s+το\s+κινητο|μου\s+επεσε\s+το\s+κινητο/,
    /new (?:phone )?number|changed my number|my phone (?:broke|is broken)/,
  ],
  accident: [/ατυχημα|τρακαρ|νοσοκομει|χειρουργει|τραυματισ|κρατητηρι|συνελαβαν|εγγυηση/, /accident|hospital|surgery|arrested|bail/],
  police: [/αστυνομ|αστυνομικ|εισαγγελ|δικηγορ|ελ\.?\s?ασ\b/, /police|officer|lawyer|prosecutor/],
  bank: [/τραπεζ|λογαριασμο[a-zα-ω0-9_]*\s+σασ|καρτα\s+σασ|web\s?banking|e-banking|πειραιωσ|εθνικη|eurobank|alpha\s?bank|viva/, /\bbank\b|your account|online banking/],
  courier: [/ελτα|acs|γενικη\s+ταχυδρομικη|speedex|courier|δεμα|δεματοσ|αποστολη\s+σασ|παραδοσ/, /parcel|package|delivery|courier|dhl|fedex|ups\b/],
  utility_refund: [/επιστροφη\s+(?:φορου|χρηματων|ποσου)|δεη|ενφια|ααδε|εφορια|e-?εφκα|εφκα|δικαιουστε\s+επιστροφη|λογαριασμο[a-zα-ω0-9_]*\s+ρευματ/, /tax refund|refund|utility|electricity bill|hmrc/],
  prize: [/κερδισ|νικητ|δωρο|κληρωσ|επαθλο|δωροκαρτ/, /you(?:'ve| have)? won|winner|prize|lottery|congratulations/],
  investment: [/επενδυσ|κρυπτο|bitcoin|εγγυημενη\s+αποδοση|κερδη\s+(?:καθε|μεχρι)|διπλασιασ|trading/, /invest|crypto|bitcoin|guaranteed returns|trading platform/],
  romance: [/αγαπη\s+μου|σε\s+σκεφτομαι|να\s+(?:ερθω|συναντηθουμε)\s+(?:να\s+σε\s+δω)?|εισιτηριο|στρατιωτ[a-zα-ω0-9_]*\s+(?:γιατρ|σε\s+αποστολη)/, /my love|darling|plane ticket|deployed overseas/],
  remote_access: [/anydesk|teamviewer|εγκαταστησ[a-zα-ω0-9_]*\s+(?:την\s+)?εφαρμογη/, /anydesk|teamviewer|install (?:this|the) app/],
  amount: [/\d[\d.,]*\s*(?:€|ευρω|eur\b|£|\$)|[€£$]\s*\d/],
};

const HIGH_RISK: Signal[] = ['money_request', 'code_request', 'card_request', 'id_request', 'remote_access'];

export function detectSignals(text: string): Signal[] {
  const t = foldText(text);
  return (Object.keys(PATTERNS) as Signal[]).filter((s) => PATTERNS[s].some((re) => re.test(t)));
}

function pickCategory(s: Set<Signal>): ScamCategory {
  if (s.has('new_number')) return 'new_number';
  if (s.has('accident') && (s.has('money_request') || s.has('police'))) return 'fake_relative';
  if (s.has('police')) return 'fake_police';
  if (s.has('courier') && (s.has('payment_request') || s.has('link'))) return 'fake_courier';
  if (s.has('utility_refund')) return 'fake_utility_refund';
  if (s.has('investment')) return 'investment';
  if (s.has('bank') && (s.has('link') || s.has('code_request') || s.has('card_request') || s.has('urgency'))) return 'fake_bank';
  if (s.has('prize')) return 'prize';
  if (s.has('romance')) return 'romance';
  if (s.has('id_request')) return 'identity_request';
  if (s.has('accident')) return 'fake_relative';
  if (s.has('code_request') || s.has('card_request') || s.has('remote_access')) return 'identity_request';
  return 'other';
}

export function assessHeuristics(text: string): HeuristicResult {
  const signals = detectSignals(text);
  const set = new Set(signals);
  const highRisk = signals.some((s) => HIGH_RISK.includes(s));
  const lure =
    set.has('new_number') ||
    set.has('accident') ||
    set.has('police') ||
    set.has('prize') ||
    set.has('investment') ||
    set.has('utility_refund') ||
    set.has('romance');
  const payByLink = set.has('payment_request') && (set.has('link') || set.has('short_link'));
  const pressure = set.has('urgency') || set.has('secrecy');

  let strength: HeuristicResult['strength'] = 'none';
  const bankPressure = set.has('bank') && set.has('link') && set.has('urgency');
  if (highRisk || payByLink || bankPressure || set.has('short_link') || (lure && (set.has('link') || set.has('payment_request') || set.has('amount') || pressure))) {
    strength = 'strong';
  } else if (lure || (set.has('bank') && set.has('link')) || (set.has('courier') && set.has('link')) || (pressure && set.has('link'))) {
    strength = 'weak';
  }
  return { signals, strength, category: strength === 'none' ? 'none' : pickCategory(set) };
}
