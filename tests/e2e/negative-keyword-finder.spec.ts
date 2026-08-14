import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Negative Keyword Finder - paste path", () => {
  test("tokenizes pasted rows automatically and lets the user select negatives", async ({
    page,
    context,
    browserName,
  }) => {
    // Playwright can only grant clipboard permissions on Chromium - Firefox
    // and WebKit don't expose that automation surface. The write itself
    // (triggered by a real click below) still works everywhere; only the
    // read-back verification is Chromium-only.
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/negative-keyword-finder");

    await expect(
      page.getByRole("heading", { level: 1, name: "Negative Keyword Finder" }),
    ).toBeVisible();

    await page
      .getByLabel("Paste search terms")
      .fill("running shoes for men\nrunning shoes for women\nrunning boots");

    const runningRow = page.getByRole("button", {
      name: /^running, 3 occurrences/i,
    });
    await expect(runningRow).toBeVisible();
    // "for" is a stopword and hidden by default.
    await expect(page.getByRole("button", { name: /^for,/i })).toHaveCount(0);

    await runningRow.click();
    await expect(page.getByText("Selected negatives (1)")).toBeVisible();

    await page.getByRole("button", { name: "Copy" }).click();
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();

    if (browserName === "chromium") {
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboardText).toBe("running");
    }
  });

  test("has no critical or serious accessibility violations", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");
    await page.getByLabel("Paste search terms").fill("running shoes\nrunning boots");
    await expect(
      page.getByRole("button", { name: /^running,/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test("never sends keyword content over the network", async ({ page }) => {
    const observedTraffic: string[] = [];
    page.on("request", (request) => {
      observedTraffic.push(request.url());
      const postData = request.postData();
      if (postData) observedTraffic.push(postData);
    });

    await page.goto("/negative-keyword-finder");
    const canaryTerm = "zzzunlikely-canary-search-term-zzz";
    await page.getByLabel("Paste search terms").fill(canaryTerm);
    await expect(
      page.getByRole("button", { name: new RegExp(`^${canaryTerm},`, "i") }),
    ).toBeVisible();

    for (const entry of observedTraffic) {
      expect(entry).not.toContain(canaryTerm);
    }
  });
});

test.describe("Negative Keyword Finder - file upload path", () => {
  test("auto-detects the search-term column from an uploaded CSV", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");

    const csv = "Search Term,Clicks\nrunning shoes,10\nrunning boots,5\n";
    await page
      .getByLabel(/upload a search-terms file/i)
      .setInputFiles({
        name: "report.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csv),
      });

    await expect(
      page.getByText("Using 2 rows from your uploaded file."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^running, 2 occurrences/i }),
    ).toBeVisible();
  });

  test("rejects a file over the 10MB size cap", async ({ page }) => {
    await page.goto("/negative-keyword-finder");

    await page.getByLabel(/upload a search-terms file/i).setInputFiles({
      name: "big.csv",
      mimeType: "text/csv",
      buffer: Buffer.alloc(11 * 1024 * 1024, "a"),
    });

    // Next.js's built-in route announcer also has role="alert", so match by text.
    await expect(page.getByText(/max file size is 10mb/i)).toBeVisible();
  });
});

test.describe("Negative Keyword Finder - ambiguous column path", () => {
  test("blocks processing until the user manually picks a column", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");

    const csv = "Query,Search Term\nrunning shoes,alt text\n";
    await page.getByLabel(/upload a search-terms file/i).setInputFiles({
      name: "ambiguous.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    const picker = page.getByLabel(/couldn't automatically detect/i);
    await expect(picker).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^running,/i }),
    ).toHaveCount(0);

    await picker.selectOption("Query");

    await expect(
      page.getByRole("button", { name: /^running, 1 occurrence/i }),
    ).toBeVisible();
  });
});

test.describe("Negative Keyword Finder - export path", () => {
  test("downloads the selected negatives as a .txt file with the chosen match type", async ({
    page,
  }) => {
    await page.goto("/negative-keyword-finder");

    await page
      .getByLabel("Paste search terms")
      .fill("running shoes\nrunning boots");
    await page
      .getByRole("button", { name: /^running, 2 occurrences/i })
      .click();
    await page.locator("#match-type-exact").check();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .txt" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("negative-keywords.txt");
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).toString("utf-8")).toBe("[running]");
  });
});
