import { expect, test } from "@playwright/test";

test("resizes and persists the timeline label column", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__timeline_label_resize_test_ready")) {
      window.localStorage.removeItem("geometry-studio-timeline-label-width");
      window.sessionStorage.setItem("__timeline_label_resize_test_ready", "true");
    }
  });
  await page.goto("/");

  const handle = page.locator("#timeline-label-resize-handle");
  const labels = page.locator("#timeline-track-labels");
  await expect(handle).toBeVisible();
  const initialBox = await labels.boundingBox();
  const handleBox = await handle.boundingBox();
  expect(initialBox).toBeTruthy();
  expect(handleBox).toBeTruthy();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 88, handleBox!.y + handleBox!.height / 2, { steps: 6 });
  await page.mouse.up();

  const expandedBox = await labels.boundingBox();
  expect(expandedBox).toBeTruthy();
  expect(expandedBox!.width).toBeGreaterThan(initialBox!.width + 40);
  await expect.poll(async () => page.evaluate(() => Number(window.localStorage.getItem("geometry-studio-timeline-label-width")))).toBeGreaterThan(initialBox!.width + 40);

  await page.reload();
  const persistedBox = await labels.boundingBox();
  expect(persistedBox).toBeTruthy();
  expect(persistedBox!.width).toBeGreaterThan(initialBox!.width + 40);
});
