import 'server-only';
import type { ScamCategory } from '@alt/core';
import type { Locale } from '@alt/i18n';
import { createClient } from '@supabase/supabase-js';
import { fallbackRadar, type RadarRow } from '@/content/radar';
import { env } from './env';

export type RadarItem = {
  slug: string;
  category: ScamCategory;
  title: string;
  summary: string;
  body: string;
  whatToDo: string;
  featuredWeek: string | null;
  publishedAt: string;
};

const COLUMNS = 'slug, category, title_el, title_en, summary_el, summary_en, body_el, body_en, what_to_do_el, what_to_do_en, featured_week, published_at';

function localise(r: RadarRow, l: Locale): RadarItem {
  return {
    slug: r.slug,
    category: r.category,
    title: l === 'el' ? r.title_el : r.title_en,
    summary: l === 'el' ? r.summary_el : r.summary_en,
    body: l === 'el' ? r.body_el : r.body_en,
    whatToDo: l === 'el' ? r.what_to_do_el : r.what_to_do_en,
    featuredWeek: r.featured_week,
    publishedAt: r.published_at,
  };
}

/** Published Scam Radar items (public RLS), newest first. Falls back to bundled content without Supabase. */
export async function radarRows(): Promise<RadarRow[]> {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) return fallbackRadar;
  const db = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await db.from('scam_radar_items').select(COLUMNS).eq('published', true).order('published_at', { ascending: false });
  if (error) return fallbackRadar;
  return (data ?? []) as RadarRow[];
}

export async function radarItems(locale: Locale): Promise<RadarItem[]> {
  return (await radarRows()).map((r) => localise(r, locale));
}

export async function radarItem(locale: Locale, slug: string): Promise<RadarItem | null> {
  return (await radarItems(locale)).find((i) => i.slug === slug) ?? null;
}

/** "Απάτη της εβδομάδας": the item featured for the most recent week, else the newest. */
export async function scamOfTheWeek(locale: Locale): Promise<RadarItem | null> {
  const items = await radarItems(locale);
  const featured = items.filter((i) => i.featuredWeek).sort((a, b) => (b.featuredWeek ?? '').localeCompare(a.featuredWeek ?? ''));
  return featured[0] ?? items[0] ?? null;
}
