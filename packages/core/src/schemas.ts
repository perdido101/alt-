import { z } from 'zod';
import { Relation, ScamCategory, Verdict } from './enums';
import { isDiallableContact } from './phone';
import { SAFE_WORD_MIN_LENGTH, normaliseSafeWord } from './safeWord';

/** Output contract of analyzeMessage (milestone 2). */
export const AnalysisResult = z.object({
  verdict: Verdict,
  reason: z.string().min(1).max(240),
  action: z.string().min(1).max(240),
  category: ScamCategory,
  suggestAlert: z.boolean(),
});
export type AnalysisResult = z.infer<typeof AnalysisResult>;

export const FamilyContactInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().refine((v) => isDiallableContact(v), { message: 'errors.phoneInvalid' }),
  relation: Relation,
  isGuardian: z.boolean().default(false),
  isBackup: z.boolean().default(false),
});
export type FamilyContactInput = z.infer<typeof FamilyContactInput>;

export const SafeWordInput = z
  .object({ word: z.string(), confirm: z.string() })
  .refine((v) => normaliseSafeWord(v.word).length >= SAFE_WORD_MIN_LENGTH, {
    message: 'errors.safeWordTooShort',
    path: ['word'],
  })
  .refine((v) => normaliseSafeWord(v.word) === normaliseSafeWord(v.confirm), {
    message: 'errors.safeWordMismatch',
    path: ['confirm'],
  });

export const CreateCircleInput = z.object({
  name: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(60),
});

export const EmailInput = z.string().trim().email({ message: 'errors.emailInvalid' });
