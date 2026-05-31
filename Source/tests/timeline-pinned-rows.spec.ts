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

test("bulk pins visible timeline rows and clears pinned rows", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("geometry-studio-timeline-pinned-rows");
    window.localStorage.removeItem("geometry-studio-timeline-row-filter");
    window.localStorage.removeItem("geometry-studio-timeline-row-search");
  });
  await page.goto("/");

  await page.locator("#timeline-row-filter").selectOption("all");
  await page.locator("#timeline-row-search").fill("rotation");
  await page.locator("#timeline-pin-visible-rows").click();
  await expect(page.locator('#timeline-row-filter option[value="pinned"]')).toHaveText(/Pinned Rows \([1-9]\d*\)/);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("show pinned timeline rows");
  await page.keyboard.press("Enter");
  await page.locator("#timeline-row-search").fill("");

  await expect(page.locator("#timeline-row-filter")).toHaveValue("pinned");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toBeVisible();
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).toHaveClass(/pinned-track/);
  await expect(page.locator('.timeline-track-label[data-track-kind="scale"]').first()).toBeHidden();

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("clear pinned timeline rows");
  await page.keyboard.press("Enter");

  await expect(page.locator('#timeline-row-filter option[value="pinned"]')).toHaveText("Pinned Rows");
  await page.locator("#timeline-row-filter").selectOption("all");
  await expect(page.locator('.timeline-track-label[data-track-kind="rotation"]').first()).not.toHaveClass(/pinned-track/);
});

test("jumps directly to timeline row filters from the command palette", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("geometry-studio-timeline-pinned-rows");
    window.localStorage.removeItem("geometry-studio-timeline-row-filter");
    window.localStorage.removeItem("geometry-studio-timeline-row-search");
  });
  await page.goto("/");

  const runCommand = async (query: string) => {
    await page.keyboard.press("Control+K");
    await page.locator("#command-palette-search").fill(query);
    await page.keyboard.press("Enter");
  };

  await runCommand("show all timeline rows");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("all");

  await runCommand("show focus timeline rows");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("focus");

  await runCommand("show keyed timeline rows");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("keyed");

  await runCommand("show pinned timeline rows");
  await expect(page.locator("#timeline-row-filter")).toHaveValue("pinned");
});
