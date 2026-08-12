import { defineConfig, devices } from "@playwright/test";

const PORT = 4200;

export default defineConfig({
  testDir: "./tests/e2e",
  // A single worker against a production server keeps runs stable in this
  // environment — `next dev`'s on-demand per-route compilation stalls badly
  // when several tests hit an uncompiled route at once.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  // TRD §8 browser matrix: Chrome/Edge (chromium), Firefox, Safari (webkit).
  // `npm run test:e2e` targets chromium only for fast local iteration;
  // run `npx playwright test` (no filter) or `--project=firefox`/`webkit`
  // for a full cross-browser pass — heavier, so best run when the machine
  // isn't already under memory pressure from other apps.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
