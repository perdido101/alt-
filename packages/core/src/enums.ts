import { z } from 'zod';

/** Every enum here mirrors a Postgres enum in supabase/migrations. Keep them in sync. */
export const MemberRole = z.enum(['guardian', 'protected']);
export type MemberRole = z.infer<typeof MemberRole>;

export const Plan = z.enum(['free', 'family', 'family_plus']);
export type Plan = z.infer<typeof Plan>;

export const Verdict = z.enum(['safe', 'caution', 'scam']);
export type Verdict = z.infer<typeof Verdict>;

export const ScamCategory = z.enum([
  'fake_relative',
  'fake_police',
  'fake_bank',
  'fake_courier',
  'fake_utility_refund',
  'new_number',
  'prize',
  'romance',
  'investment',
  'identity_request',
  'other',
  'none',
]);
export type ScamCategory = z.infer<typeof ScamCategory>;

export const CheckChannel = z.enum(['in_app', 'viber', 'whatsapp']);
export type CheckChannel = z.infer<typeof CheckChannel>;

export const CheckInputKind = z.enum(['text', 'link', 'image', 'voice']);
export type CheckInputKind = z.infer<typeof CheckInputKind>;

/** Categories the parent can pick in "who did they say they were". */
export const OfficialCategory = z.enum([
  'police',
  'health',
  'bank',
  'tax_social',
  'post_courier',
  'utility',
  'telco',
  'emergency',
]);
export type OfficialCategory = z.infer<typeof OfficialCategory>;

export const CallClassification = z.enum(['family', 'official', 'reported_scam', 'risky', 'unknown']);
export type CallClassification = z.infer<typeof CallClassification>;

export const ProtectionLevel = z.enum(['warn', 'silence', 'block']);
export type ProtectionLevel = z.infer<typeof ProtectionLevel>;

export const AlertSource = z.enum(['button', 'call', 'message']);
export type AlertSource = z.infer<typeof AlertSource>;

export const Relation = z.enum(['son', 'daughter', 'grandchild', 'sibling', 'spouse', 'neighbour', 'friend', 'other']);
export type Relation = z.infer<typeof Relation>;
