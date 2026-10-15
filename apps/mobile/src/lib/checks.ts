import type { AnalysisResult } from '@alt/core';
import type { Locale } from '@alt/i18n';
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import { create } from 'zustand';
import { apiFetch } from './server';

export type CheckResult = AnalysisResult & { checkId: string; transcript?: string };

/** The latest verdict, shown on the verdict screen. Content is never kept on the phone. */
export const useCheckStore = create<{ last: CheckResult | null; set: (r: CheckResult | null) => void }>((set) => ({
  last: null,
  set: (last) => set({ last }),
}));

export async function checkText(text: string, locale: Locale, kind: 'text' | 'voice' = 'text'): Promise<CheckResult> {
  const looksLikeLink = /^\s*(https?:\/\/|www\.)\S+\s*$/i.test(text);
  return apiFetch<CheckResult>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: kind === 'voice' ? 'voice' : looksLikeLink ? 'link' : 'text', text, locale }),
  });
}

/** Screenshots/photos are downscaled to 1600px JPEG before upload (enough to read, small to send). */
export async function checkImage(uri: string, width: number, locale: Locale, caption?: string): Promise<CheckResult> {
  const ctx = ImageManipulator.manipulate(uri);
  if (width > 1600) ctx.resize({ width: 1600 });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  return apiFetch<CheckResult>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'image', locale, text: caption || undefined, image: { mediaType: 'image/jpeg', base64: saved.base64 } }),
  });
}

/** Voice note without an on-device transcript: the server transcribes it, checks it, and drops the audio. */
export async function checkAudio(uri: string, locale: Locale): Promise<CheckResult> {
  const form = new FormData();
  form.append('kind', 'voice');
  form.append('locale', locale);
  const name = uri.split('/').pop() ?? 'voice.m4a';
  const type = name.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';
  form.append('audio', { uri, name, type } as unknown as Blob);
  return apiFetch<CheckResult>('/api/analyze', { method: 'POST', body: form });
}
