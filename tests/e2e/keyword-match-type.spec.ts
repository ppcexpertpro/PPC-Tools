import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Keyword Match Type - golden path", () => {
  test("formats a pasted list into the selected match types and copies the result", async ({
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
    await page.goto("/keyword-match-type");

    await expect(
      page.getByRole("heading", { level: 1, name: "Keyword Match Type Tool" }),
    ).toBeVisible();

    await page
      .getByLabel("Keywords")
      .fill("running shoes\nRunning Shoes\nhiking boots");
    await page.locator("#match-type-phrase").check();
    await page.locator("#match-type-exact").check();

    await page.getByRole("button", { name: "Process" }).click();

    const broadBlock = page.getByTestId("output-block-broad");
    const phraseBlock = page.getByTestId("output-block-phrase");
    const exactBlock = page.getByTestId("output-block-exact");

    await expect(broadBlock.getByText("Broad (2)")).toBeVisible();
    await expect(phraseBlock.getByText("Phrase (2)")).toBeVisible();
    await expect(exactBlock.getByText("Exact (2)")).toBeVisible();

    // Case-insensitive dedupe kept the first occurrence's original casing.
    await expect(
      broadBlock.getByText("running shoes", { exact: true }),
    ).toBeVisible();
    await expect(
      broadBlock.getByText("Running Shoes", { exact: true }),
    ).toHaveCount(0);
    await expect(exactBlock.getByText("[hiking boots]")).toBeVisible();

    await broadBlock.getByRole("button", { name: "Copy" }).click();
    await expect(
      broadBlock.getByRole("button", { name: "Copied!" }),
    ).toBeVisible();

    if (browserName === "chromium") {
      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      // Windows normalizes clipboard line endings to CRLF on write - not an
      // app bug, so normalize before comparing.
      expect(clipboardText.replace(/\r\n/g, "\n")).toBe(
        "running shoes\nhiking boots",
      );
    }
  });

  test("has no critical or serious accessibility violations once results render", async ({
    page,
  }) => {
    await page.goto("/keyword-match-type");
    await page.getByLabel("Keywords").fill("running shoes\nhiking boots");
    await page.getByRole("button", { name: "Process" }).click();
    await expect(page.getByTestId("output-block-broad")).toBeVisible();

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

    await page.goto("/keyword-match-type");
    const canaryKeyword = "zzzunlikely-canary-keyword-zzz";
    await page.getByLabel("Keywords").fill(canaryKeyword);
    await page.getByRole("button", { name: "Process" }).click();
    await expect(page.getByTestId("output-block-broad")).toBeVisible();

    for (const entry of observedTraffic) {
      expect(entry).not.toContain(canaryKeyword);
    }
  });
});

test.describe("Keyword Match Type - limit exceeded", () => {
  test("blocks processing above the 5,000-line cap with an explanatory message", async ({
    page,
  }) => {
    await page.goto("/keyword-match-type");

    const tooMany = Array.from({ length: 5001 }, (_, i) => `kw ${i}`).join(
      "\n",
    );
    // Playwright's .fill() actionability polling gets stuck re-measuring a
    // textarea this large in this environment (confirmed via manual repro
    // that the app itself handles a 5,001-line paste in ~25ms) - set the
    // value the way a real paste does instead: one native value set + one
    // input event.
    await page.locator("#match-type-input").evaluate((element, value) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )!.set!;
      nativeSetter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }, tooMany);

    await expect(
      page.getByText(/max 5,000 lines - you have 5,001/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Process" })).toBeDisabled();
  });
});
