import { expect, test, type Page } from "@playwright/test";

test("hold K with J or L steps frames without starting playback", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();
  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await dispatchWindowKey(page, "keydown", "k");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");
  await dispatchWindowKey(page, "keydown", "l");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1.03, 2);

  await dispatchWindowKey(page, "keydown", "j");
  await expect(page.locator("#timeline-play-toggle")).toContainText("Play");
  await expect(page.locator("#status-line")).toContainText("Ready");
  await expect.poll(async () => Number(await page.locator("#timeline-current-time").inputValue())).toBeCloseTo(1, 2);
  await dispatchWindowKey(page, "keyup", "k");

  expect(errors).toEqual([]);
});

async function dispatchWindowKey(page: Page, type: "keydown" | "keyup", key: string): Promise<void> {
  await page.evaluate(({ eventType, eventKey }) => {
    window.dispatchEvent(new KeyboardEvent(eventType, {
      key: eventKey,
      code: `Key${eventKey.toUpperCase()}`,
      bubbles: true,
      cancelable: true
    }));
  }, { eventType: type, eventKey: key });
}
