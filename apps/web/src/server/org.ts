import 'server-only';
import { supabaseServer } from './auth';
import { env } from './env';
import { HttpError, supabaseAdmin } from './supabase';

export type Org = { id: string; slug: string; kind: string; nameEl: string; nameEn: string; seatsTotal: number; cobranding: boolean; logoPath: string | null };
export type LicenceCode = { code: string; status: 'available' | 'redeemed' | 'revoked'; expiresAt: string | null; createdAt: string };
export type WeekStat = { weekStart: string; protectedPeople: number; checks: number; checksScam: number; alerts: number; flaggedCalls: number };

/**
 * Organisation portal data. The Supabase implementation runs as the org admin (RLS: their org's codes and
 * aggregates only). The demo implementation exists for e2e tests and local previews and is only reachable
 * when Supabase isn't configured at all, so it can never shadow real data.
 */
export interface OrgRepo {
  current(): Promise<Org | null>;
  codes(orgId: string): Promise<LicenceCode[]>;
  generate(orgId: string, count: number): Promise<string[]>;
  revoke(code: string): Promise<void>;
  stats(orgId: string): Promise<WeekStat[]>;
}

export function demoMode(): boolean {
  return process.env.ALT_DEMO_MODE === '1' && !env().NEXT_PUBLIC_SUPABASE_URL;
}

const supabaseRepo: OrgRepo = {
  async current() {
    const db = await supabaseServer();
    const { data: user } = await db.auth.getUser();
    if (!user.user) return null;
    const { data: m } = await db.from('org_members').select('org_id').eq('user_id', user.user.id).limit(1);
    const orgId = (m as Array<{ org_id: string }> | null)?.[0]?.org_id;
    if (!orgId) return null;
    const { data } = await db.from('organisations').select('id, slug, kind, name_el, name_en, seats_total, cobranding_enabled, logo_path').eq('id', orgId).single();
    const o = data as Record<string, string | number | boolean | null>;
    return { id: o.id as string, slug: o.slug as string, kind: o.kind as string, nameEl: o.name_el as string, nameEn: o.name_en as string, seatsTotal: o.seats_total as number, cobranding: !!o.cobranding_enabled, logoPath: (o.logo_path as string | null) ?? null };
  },
  async codes(orgId) {
    const db = await supabaseServer();
    const { data } = await db.from('org_licence_codes').select('code, redeemed_at, revoked_at, expires_at, created_at').eq('org_id', orgId).order('created_at', { ascending: false });
    return ((data ?? []) as Array<Record<string, string | null>>).map((c) => ({
      code: c.code!,
      status: c.revoked_at ? 'revoked' : c.redeemed_at ? 'redeemed' : 'available',
      expiresAt: c.expires_at ?? null,
      createdAt: c.created_at!,
    }));
  },
  async generate(orgId, count) {
    const db = await supabaseServer();
    const { data, error } = await db.rpc('generate_licence_codes', { p_org: orgId, p_count: count });
    if (error) throw new HttpError(error.message.includes('not_enough_seats') ? 409 : 400, error.message.includes('not_enough_seats') ? 'not_enough_seats' : 'failed');
    return (data ?? []) as string[];
  },
  async revoke(code) {
    const db = await supabaseServer();
    await db.rpc('revoke_licence_code', { p_code: code });
  },
  async stats(orgId) {
    const db = await supabaseServer();
    const { data } = await db.from('org_stats_weekly').select('week_start, protected_people, checks, checks_scam, alerts, flagged_calls').eq('org_id', orgId).order('week_start', { ascending: false }).limit(104);
    return ((data ?? []) as Array<Record<string, string | number>>).map((r) => ({
      weekStart: r.week_start as string,
      protectedPeople: r.protected_people as number,
      checks: r.checks as number,
      checksScam: r.checks_scam as number,
      alerts: r.alerts as number,
      flaggedCalls: r.flagged_calls as number,
    }));
  },
};

// ---- Demo (in-memory, per server process) -------------------------------------------------
const demoOrg: Org = { id: 'demo-org', slug: 'demo', kind: 'municipality', nameEl: 'Δοκιμής', nameEn: 'Dokimi', seatsTotal: 10, cobranding: true, logoPath: null };
const demoCodes: LicenceCode[] = [
  { code: 'DEMO-7KQ2-M9XD', status: 'redeemed', expiresAt: '2027-10-15T00:00:00Z', createdAt: '2026-09-01T09:00:00Z' },
  { code: 'DEMO-H4PZ-2WLC', status: 'available', expiresAt: '2027-10-15T00:00:00Z', createdAt: '2026-09-01T09:00:00Z' },
];
const demoStats: WeekStat[] = [
  { weekStart: '2026-10-05', protectedPeople: 1, checks: 2, checksScam: 0, alerts: 1, flaggedCalls: 1 },
  { weekStart: '2026-09-28', protectedPeople: 1, checks: 3, checksScam: 1, alerts: 0, flaggedCalls: 2 },
];
const demoRepo: OrgRepo = {
  async current() {
    return demoOrg;
  },
  async codes() {
    return [...demoCodes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async generate(_orgId, count) {
    const used = demoCodes.filter((c) => c.status !== 'revoked').length;
    if (used + count > demoOrg.seatsTotal) throw new HttpError(409, 'not_enough_seats');
    const part = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    const created = Array.from({ length: count }, () => `DEMO-${part()}-${part()}`);
    const now = new Date().toISOString();
    for (const code of created) demoCodes.push({ code, status: 'available', expiresAt: '2027-10-15T00:00:00Z', createdAt: now });
    return created;
  },
  async revoke(code) {
    const c = demoCodes.find((x) => x.code === code && x.status === 'available');
    if (c) c.status = 'revoked';
  },
  async stats() {
    return demoStats;
  },
};

export function orgRepo(): OrgRepo {
  return demoMode() ? demoRepo : supabaseRepo;
}

export function logoUrl(path: string | null): string | null {
  if (!path) return null;
  const base = env().NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/org-logos/${path}` : null;
}

/** Org logo upload (service role after confirming the caller administers this org). */
export async function uploadLogo(orgId: string, file: File): Promise<void> {
  if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) throw new HttpError(400, 'invalid_file');
  const org = await orgRepo().current();
  if (!org || org.id !== orgId) throw new HttpError(403, 'forbidden');
  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1];
  const path = `${org.slug}/logo-${Date.now()}.${ext}`;
  const admin = supabaseAdmin();
  const { error } = await admin.storage.from('org-logos').upload(path, new Uint8Array(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new HttpError(500, 'upload_failed');
  await admin.from('organisations').update({ logo_path: path }).eq('id', orgId);
}

export function statsCsv(stats: WeekStat[], header: string[]): string {
  const rows = stats.map((s) => [s.weekStart, s.protectedPeople, s.checks, s.checksScam, s.alerts, s.flaggedCalls].join(','));
  return [header.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\r\n') + '\r\n';
}
