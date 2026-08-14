import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 5 full accessibility audit (Implementation Plan §Phase 5): every
 * route, not just the "happy path with results" states already covered by
 * each tool's own E2E spec (keyword-match-type.spec.ts and
 * negative-keyword-finder.spec.ts scan their results state; this file fills
 * in everything else, including keyword-merge-match which had no axe
 * coverage at all before this phase).
 */

async function expectNoSeriousOrCriticalViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(seriousOrCritical).toEqual([]);
}

test.describe("Accessibility - suite home", () => {
  test("home page has no critical or serious violations", async ({ page }) => {
    await page.goto("/");
    await expectNoSeriousOrCriticalViolations(page);
  });
});

test.describe("Accessibility - empty/initial states", () => {
  test("keyword-match-type empty state", async ({ page }) => {
    await page.goto("/keyword-match-type");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("keyword-merge-match empty state", async ({ page }) => {
    await page.goto("/keyword-merge-match");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("negative-keyword-finder empty state", async ({ page }) => {
    await page.goto("/negative-keyword-finder");
    await expectNoSeriousOrCriticalViolations(page);
  });
});

test.describe("Accessibility - keyword-merge-match with results", () => {
  test("no violations once a merge has been processed", async ({ page }) => {
    await page.goto("/keyword-merge-match");
    await page.getByLabel("Group 1 terms").fill("best\ncheap");
    await page.getByLabel("Group 2 terms").fill("running shoes");
    await page.getByRole("button", { name: "Merge & Process" }).click();
    await expect(page.getByTestId("output-block-broad")).toBeVisible();

    await expectNoSeriousOrCriticalViolations(page);
  });
});

test.describe("Accessibility - negative-keyword-finder column picker", () => {
  test("no violations while the manual column picker is blocking", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");
    const csv = "Query,Search Term\nrunning shoes,alt text\n";
    await page.getByLabel(/upload a search-terms file/i).setInputFiles({
      name: "ambiguous.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
    await expect(page.getByLabel(/couldn't automatically detect/i)).toBeVisible();

    await expectNoSeriousOrCriticalViolations(page);
  });
});
