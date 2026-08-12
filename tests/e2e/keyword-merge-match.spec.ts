import { test, expect } from "@playwright/test";

test.describe("Keyword Merge & Match — golden path", () => {
  test("merges two groups in on-screen order and formats the result", async ({
    page,
  }) => {
    await page.goto("/keyword-merge-match");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Keyword Merge & Match Tool",
      }),
    ).toBeVisible();

    await page.getByLabel("Group 1 terms").fill("best\ncheap");
    await page.getByLabel("Group 2 terms").fill("running shoes");

    await expect(page.getByText("Will generate 2 keywords.")).toBeVisible();

    await page.getByRole("button", { name: "Merge & Process" }).click();

    const broadBlock = page.getByTestId("output-block-broad");
    await expect(broadBlock.getByText("Broad (2)")).toBeVisible();
    await expect(broadBlock.getByText("best running shoes")).toBeVisible();
    await expect(broadBlock.getByText("cheap running shoes")).toBeVisible();
  });

  test("shows inline guidance instead of an error when only one group has content", async ({
    page,
  }) => {
    await page.goto("/keyword-merge-match");
    await page.getByLabel("Group 1 terms").fill("best");

    await expect(
      page.getByText("Add at least one more group to merge."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Merge & Process" }),
    ).toBeDisabled();
  });

  test("never sends keyword content over the network", async ({ page }) => {
    const observedTraffic: string[] = [];
    page.on("request", (request) => {
      observedTraffic.push(request.url());
      const postData = request.postData();
      if (postData) observedTraffic.push(postData);
    });

    await page.goto("/keyword-merge-match");
    const canaryA = "zzzunlikely-canary-modifier-zzz";
    const canaryB = "zzzunlikely-canary-core-zzz";
    await page.getByLabel("Group 1 terms").fill(canaryA);
    await page.getByLabel("Group 2 terms").fill(canaryB);
    await page.getByRole("button", { name: "Merge & Process" }).click();
    await expect(page.getByTestId("output-block-broad")).toBeVisible();

    for (const entry of observedTraffic) {
      expect(entry).not.toContain(canaryA);
      expect(entry).not.toContain(canaryB);
    }
  });
});

test.describe("Keyword Merge & Match — cap exceeded", () => {
  test("blocks processing above the 20,000-combination cap", async ({
    page,
  }) => {
    await page.goto("/keyword-merge-match");

    const bigList = Array.from({ length: 200 }, (_, i) => `a${i}`).join("\n");
    await page.getByLabel("Group 1 terms").fill(bigList);
    await page.getByLabel("Group 2 terms").fill(bigList);

    await expect(page.getByText(/reduce group sizes.*40,000/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Merge & Process" }),
    ).toBeDisabled();
  });
});

test.describe("Keyword Merge & Match — reorder interaction", () => {
  test("reordering groups via the up/down buttons changes the merge order", async ({
    page,
  }) => {
    await page.goto("/keyword-merge-match");
    await page.setViewportSize({ width: 375, height: 900 });

    await page.getByLabel("Group 1 terms").fill("best");
    await page.getByLabel("Group 2 terms").fill("running shoes");

    await page.getByRole("button", { name: "Move Group 2 up" }).click();

    const labelInputs = page.getByRole("textbox", { name: "Group name" });
    await expect(labelInputs.nth(0)).toHaveValue("Group 2");
    await expect(labelInputs.nth(1)).toHaveValue("Group 1");

    await expect(page.getByText("Will generate 1 keyword.")).toBeVisible();
    await page.getByRole("button", { name: "Merge & Process" }).click();

    const broadBlock = page.getByTestId("output-block-broad");
    await expect(broadBlock.getByText("running shoes best")).toBeVisible();
  });
});
