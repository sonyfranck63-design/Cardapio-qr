import { defineConfig, devices } from '@playwright/test'

/**
 * Configuração do Playwright para Testes End-to-End (E2E)
 * Suporta execução local (localhost:3000) e na nuvem (Vercel) via variável BASE_URL
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 8000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
