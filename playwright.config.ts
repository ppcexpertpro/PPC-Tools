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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
