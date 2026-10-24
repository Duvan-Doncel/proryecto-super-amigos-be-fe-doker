import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.FRONT_PORT ?? 5173);

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  retries: process.env.CI ? 1 : 0,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Playwright levanta el frontend; el backend y la BD los levantas tú antes.
  webServer: {
    command: `node node_modules/vite/bin/vite.js --port ${port} --strictPort`,
    cwd: '../fe',
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});