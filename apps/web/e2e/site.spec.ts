import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('marketing site', () => {
  test('redirects / to Greek', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/el\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'el');
  });

  test('an English browser lands on /en', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-GB' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/en\/?$/);
    await context.close();
  });

  test('Greek home has the canonical hero, sections and footer line', async ({ page }) => {
    await page.goto('/el');
    await expect(page.getByText('ΓΙΑ ΤΟΥΣ ΓΟΝΕΙΣ ΣΟΥ')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Η μαμά σου θα πάρει κάποτε αυτό το τηλέφωνο.');
    await expect(page.getByRole('link', { name: 'Προστάτεψέ τη δωρεάν' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Δες πώς δουλεύει' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Πώς δουλεύει' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Σύνδεσε το κινητό της' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ασπίδα κλήσεων' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Για δήμους, ΚΑΠΗ, τράπεζες και εταιρείες τηλεπικοινωνιών' })).toBeVisible();
    await expect(page.getByText('Η ΑΛΤ! δεν θα σου ζητήσει ποτέ κωδικούς, κάρτα ή PIN.')).toBeVisible();
    await expect(page.getByRole('img', { name: /προειδοποίηση/ })).toBeVisible();
  });

  test('English home', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('One day, your mum will get that phone call.');
    await expect(page.getByText('ΑΛΤ! will never ask you for codes, cards or PINs.')).toBeVisible();
  });

  test('switches language on the same page', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'switch lives in the menu on mobile');
    await page.goto('/el/pricing');
    await page.getByRole('navigation').first().getByRole('link', { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/pricing$/);
  });

  test('no horizontal scroll and no serious accessibility violations', async ({ page }) => {
    for (const path of ['/el', '/en', '/el/pricing', '/el/scam-radar']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, path).toBe(false);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`), path).toEqual([]);
    }
  });
});

test.describe('pricing', () => {
  test('Greek prices, trial and gift', async ({ page }) => {
    await page.goto('/el/pricing');
    await expect(page.getByTestId('plan-free')).toContainText('0 €');
    await expect(page.getByTestId('plan-family')).toContainText('4,99 €');
    await expect(page.getByTestId('plan-family')).toContainText('39 €');
    await expect(page.getByTestId('plan-family')).toContainText('30 μέρες δωρεάν');
    await expect(page.getByTestId('plan-family-plus')).toContainText('7,99 €');
    await expect(page.getByRole('heading', { name: 'Χάρισε ασφάλεια' })).toBeVisible();
  });

  test('English prices', async ({ page }) => {
    await page.goto('/en/pricing');
    await expect(page.getByTestId('plan-family')).toContainText('€4.99');
    await expect(page.getByTestId('plan-family-plus')).toContainText('€7.99');
  });

  test('gift page offers 3, 6 and 12 months', async ({ page }) => {
    await page.goto('/el/gift');
    for (const m of [3, 6, 12]) await expect(page.getByText(`${m} μήνες`)).toBeVisible();
  });
});

test.describe('scam radar', () => {
  test('lists items and opens an article with share buttons (el)', async ({ page }) => {
    await page.goto('/el/scam-radar');
    await expect(page.getByRole('heading', { level: 1, name: 'Scam Radar' })).toBeVisible();
    await page.getByRole('link', { name: /ΕΛΤΑ/ }).first().click();
    await expect(page).toHaveURL(/\/el\/scam-radar\/elta-sms-dema$/);
    await expect(page.getByRole('heading', { name: 'Τι να κάνεις' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me/);
    await expect(page.getByRole('link', { name: 'Viber' })).toHaveAttribute('href', /^viber:\/\/forward/);
    await expect(page.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', /facebook\.com\/sharer/);
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld!)['@type']).toBe('Article');
  });

  test('article exists in English with its own metadata', async ({ page }) => {
    await page.goto('/en/scam-radar/geia-sou-mama-neo-noumero');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('"Hi Mum, I have a new number"');
    await expect(page).toHaveTitle(/Hi Mum/);
    await expect(page.getByRole('heading', { name: 'What to do' })).toBeVisible();
  });

  test('unknown slug is a 404', async ({ page }) => {
    const res = await page.goto('/el/scam-radar/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});

test.describe('invites and app links', () => {
  test('invite fallback page', async ({ page }) => {
    const token = 'abcDEF0123456789_-abcDEF0123456789_-abcdef';
    await page.goto(`/j/${token}`);
    await expect(page.getByRole('heading', { name: 'Σε προσκάλεσαν στην ΑΛΤ!' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Άνοιγμα στην εφαρμογή' })).toHaveAttribute('href', `alt://join/${token}`);
  });

  test('assetlinks.json is served', async ({ request }) => {
    const res = await request.get('/.well-known/assetlinks.json');
    expect(res.ok()).toBe(true);
    expect((await res.json())[0].target.namespace).toBe('android_app');
  });
});

test.describe('operations', () => {
  test('health check answers without secrets', async ({ request }) => {
    const res = await request.get('/api/health?deep=1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.integrations.analysis).toBe('boolean');
    expect(JSON.stringify(body)).not.toMatch(/sk_|key|token/i);
  });

  test('security headers are set', async ({ request }) => {
    const res = await request.get('/el');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers()['strict-transport-security']).toContain('max-age=');
  });
});
