/** Phrases that claim certainty. The product must never say "100% safe" or similar. */
const CERTAINTY = [
  /100\s*%/,
  /\bdefinitely\b/i,
  /\bcertainly\b/i,
  /\bguarantee/i,
  /\bcompletely safe\b/i,
  /\babsolutely\b/i,
  /\bno doubt\b/i,
  /\b(?:totally|entirely|perfectly) safe\b/i,
  /σίγουρα/i,
  /σιγουρα/i,
  /σίγουρο/i,
  /εντελώς\s+ασφαλ/i,
  /απόλυτα\s+ασφαλ/i,
  /απολύτως/i,
  /εγγυημέν/i,
  /χωρίς\s+(?:καμία\s+)?αμφιβολία/i,
  /100\s*τοις\s*εκατό/i,
];

export function claimsCertainty(text: string): boolean {
  return CERTAINTY.some((re) => re.test(text));
}
