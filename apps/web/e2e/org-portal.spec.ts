import { expect, test } from '@playwright/test';

/**
 * Organisation portal licence flow against the demo data source (ALT_DEMO_MODE=1 and no Supabase configured):
 * see seats → generate codes → print A4 sheets in Greek → revoke → export anonymous CSV.
 */
test.describe.configure({ mode: 'serial' });

test('org admin issues, prints and revokes licence codes', async ({ page }) => {
  await page.goto('/el/org');
  await expect(page.getByRole('heading', { level: 1, name: 'Δοκιμής' })).toBeVisible();
  const seats = page.getByTestId('seats');
  await expect(seats).toContainText(/Θέσεις: \d+ από 10/);
  const before = Number((await seats.textContent())!.match(/Θέσεις: (\d+)/)![1]);

  await page.getByLabel('Πόσους κωδικούς;').fill('3');
  await page.getByRole('button', { name: 'Δημιουργία' }).click();
  await expect(seats).toContainText(`Θέσεις: ${before + 3} από 10`);
  const available = page.getByTestId('codes').getByRole('row').filter({ hasText: 'Διαθέσιμος' });
  await expect(available).toHaveCount(4);

  // Asking for more than the remaining seats is refused.
  await page.getByLabel('Πόσους κωδικούς;').fill('50');
  await page.getByRole('button', { name: 'Δημιουργία' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Δεν υπάρχουν αρκετές θέσεις' })).toBeVisible();

  await page.getByRole('link', { name: 'Εκτύπωση διαθέσιμων κωδικών' }).click();
  const sheets = page.getByTestId('sheet');
  await expect(sheets).toHaveCount(4);
  await expect(sheets.first()).toContainText('Η ΑΛΤ! για τους ηλικιωμένους της περιοχής μας');
  await expect(sheets.first()).toContainText('Δήμος Δοκιμής');
  await expect(sheets.first()).toContainText(/DEMO-[A-Z0-9]{4}-[A-Z0-9]{4}/);
  await expect(sheets.first()).toContainText('Η ΑΛΤ! δεν θα σου ζητήσει ποτέ κωδικούς, κάρτα ή PIN.');

  await page.goto('/el/org');
  const firstAvailable = page.getByTestId('codes').getByRole('row').filter({ hasText: 'Διαθέσιμος' }).first();
  await firstAvailable.getByRole('button', { name: 'Ακύρωση' }).click();
  await expect(page.getByTestId('codes').getByRole('row').filter({ hasText: 'Ακυρώθηκε' })).toHaveCount(1);
});

test('stats are anonymous and export as CSV', async ({ page }) => {
  await page.goto('/el/org/stats');
  await expect(page.getByText('Μόνο ανώνυμα στοιχεία ανά εβδομάδα')).toBeVisible();
  const res = await page.request.get('/api/org/stats?locale=el');
  expect(res.headers()['content-type']).toContain('text/csv');
  const csv = await res.text();
  expect(csv.split('\r\n')[0]).toContain('Εβδομάδα');
  expect(csv).toContain('2026-10-05,8,25,7,2,11');
  expect(csv).toContain('2026-09-21,3,,,,');
  expect(csv).not.toMatch(/@|\+30|Μαρία/);
});

test('co-branded landing page', async ({ page }) => {
  await page.goto('/el/d/demo');
  await expect(page.getByText('Με τη στήριξη του Δήμου Δοκιμής')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Η μαμά σου θα πάρει κάποτε αυτό το τηλέφωνο.');
  expect((await page.goto('/el/d/unknown-org'))?.status()).toBe(404);
});
