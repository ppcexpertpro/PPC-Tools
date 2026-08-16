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

/**
 * Entrance animations fade elements in from `opacity: 0`, and axe composites
 * whatever opacity it finds at the moment it samples. Scanning a card that is
 * 94% faded in reports a colour nobody ever sees and fails on a contrast
 * ratio that the settled page passes - so wait for every animation to reach
 * its end state first. All animations here are finite, so this always
 * resolves.
 */
async function waitForAnimationsToSettle(
  page: import("@playwright/test").Page,
) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState === "finished"),
  );
}

async function expectNoSeriousOrCriticalViolations(
  page: import("@playwright/test").Page,
) {
  await waitForAnimationsToSettle(page);
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

test.describe("Accessibility - skip link", () => {
  test("first tab reveals a skip link that jumps focus past the chrome", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");

    // `sr-only` clips the link to 1x1 rather than removing it from the layout,
    // so Playwright still counts it "visible" - the box is what distinguishes
    // the two states.
    const skipLink = page.getByRole("link", { name: "Skip to content" });
    const clipped = await skipLink.boundingBox();
    expect(clipped?.width ?? 0).toBeLessThan(4);

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    const revealed = await skipLink.boundingBox();
    expect(revealed?.width ?? 0).toBeGreaterThan(80);
    expect(revealed?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("Accessibility - legal pages", () => {
  test("privacy policy has no critical or serious violations", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await expectNoSeriousOrCriticalViolations(page);
  });

  test("terms of use has no critical or serious violations", async ({
    page,
  }) => {
    await page.goto("/terms");
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
    await expect(
      page.getByLabel(/couldn't automatically detect/i),
    ).toBeVisible();

    await expectNoSeriousOrCriticalViolations(page);
  });
});
