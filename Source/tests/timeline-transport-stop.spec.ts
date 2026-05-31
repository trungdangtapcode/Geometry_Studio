import { expect, test } from "@playwright/test";

test("play and stop buttons stay stopped after pointer release", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");

  await page.locator("#timeline-play-toggle").click();
  await expect(page.locator("#timeline-play-toggle")).toContainText("Stop");
  await page.locator("#timeline-play-toggle").click();
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await page.waitForTimeout(250);
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");

  await page.locator("#play-toggle").click();
  await expect(page.locator("#play-toggle")).toContainText("Stop");
  await page.locator("#play-toggle").click();
  await expect(page.locator("#play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await page.waitForTimeout(250);
  await expect(page.locator("#play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  expect(errors).toEqual([]);
});
