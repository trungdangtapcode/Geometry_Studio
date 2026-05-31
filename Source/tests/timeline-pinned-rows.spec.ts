import { expect, test } from "@playwright/test";

test("pins timeline rows and filters to pinned rows", async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__timeline_pinned_rows_test_ready")) {
      window.localStorage.removeItem("geometry-studio-timeline-pinned-rows");
      window.localStorage.removeItem("geometry-studio-timeline-row-filter");
      window.sessionStorage.setItem("__timeline_pinned_rows_test_ready", "true");
    }
  });
  await page.goto("/");

  await page.locator("#timeline-row-filter").selectOption("all");
  const rotationRow = page.locator('.timeline-track-label[data-track-kind="rotation"]').first();
  await expect(rotationRow).toBeVisible();

  await rotationRow.locator('[data-row-action="pin"]').click();
  await expect(rotationRow).toHaveClass(/pinned-track/);

  await page.locator("#timeline-row-filter").selectOption("pinned");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("pinned");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="scale"]').first()).toBeHidden();

  await page.reload();
  await expect(page.locator("#timeline-row-filter")).toHaveValue("pinned");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toHaveClass(/pinned-track/);
});

test("pins the active timeline row from keyboard and command palette", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("geometry-studio-timeline-pinned-rows");
    window.localStorage.removeItem("geometry-studio-timeline-row-filter");
  });
  await page.goto("/");

  await page.locator("#timeline-track-kind").selectOption("rotation");
  await page.keyboard.press("Shift+P");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toHaveClass(/pinned-track/);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("pin active timeline row");
  await page.keyboard.press("Enter");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).not.toHaveClass(/pinned-track/);
});
