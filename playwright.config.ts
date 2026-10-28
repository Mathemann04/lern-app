import { defineConfig } from '@playwright/test'

// Browser-Tests gegen den fertigen Build, unter demselben Unterordner wie auf GitHub Pages.
// Vorher bauen: `npm run e2e` erledigt beides.
const port = 4173
const baseURL = `http://localhost:${port}/lern-app/`

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL },
  webServer: {
    command: `npx vite preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { BASE_PATH: '/lern-app/' },
  },
  projects: [
    {
      name: 'handy',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'laptop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
  ],
})
