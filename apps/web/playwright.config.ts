import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * Website e2e tests. Run without Supabase/Stripe keys: content falls back to the bundled Scam Radar items,
 * and the org-portal flow runs against the demo data source (see e2e/org-portal.spec.ts).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Most visitors browse in Greek; English is covered by explicit /en URLs and one Accept-Language test.
    locale: 'el-GR',
    // Use a pre-installed Chromium when the bundled one isn't available (CI containers, sandboxes).
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { NEXT_TELEMETRY_DISABLED: '1', ALT_DEMO_MODE: '1' },
  },
});
