import { describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth', () => ({ supabaseServer: async () => ({ auth: { exchangeCodeForSession: vi.fn() } }) }));
const { GET } = await import('./route');

const location = async (next: string) => (await GET(new Request(`https://alt.example/api/auth/callback?code=x&next=${encodeURIComponent(next)}`))).headers.get('location');

describe('auth callback', () => {
  it('continues to known dashboard paths', async () => {
    expect(await location('/en/org/stats')).toBe('https://alt.example/en/org/stats');
  });
  it.each(['//evil.example', 'https://evil.example', '/\\evil.example', '/el/app/../../x', 'javascript:alert(1)'])('refuses %s', async (next) => {
    expect(await location(next)).toBe('https://alt.example/el/app');
  });
});
