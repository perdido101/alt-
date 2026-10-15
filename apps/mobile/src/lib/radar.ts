import type { Locale } from '@alt/i18n';
import { supabase } from './supabase';

export type WeeklyScam = { slug: string; title: string; summary: string; whatToDo: string };

/** "Απάτη της εβδομάδας" from Scam Radar (published items are public). */
export async function weeklyScam(locale: Locale): Promise<WeeklyScam | null> {
  const { data } = await supabase
    .from('scam_radar_items')
    .select('slug, title_el, title_en, summary_el, summary_en, what_to_do_el, what_to_do_en, featured_week, published_at')
    .eq('published', true)
    .order('featured_week', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(1);
  const r = (data as Array<Record<string, string>> | null)?.[0];
  if (!r) return null;
  return { slug: r.slug!, title: r[`title_${locale}`]!, summary: r[`summary_${locale}`]!, whatToDo: r[`what_to_do_${locale}`]! };
}
