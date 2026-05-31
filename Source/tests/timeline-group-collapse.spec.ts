import { expect, test } from "@playwright/test";

test("collapses timeline layer groups while preserving search reveal", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__timeline_group_collapse_test_ready")) {
      window.localStorage.removeItem("geometry-studio-timeline-collapsed-groups");
      window.sessionStorage.setItem("__timeline_group_collapse_test_ready", "true");
    }
  });
  await page.goto("/");

  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const cubeRows = page.locator('.timeline-track-label[data-object-id="object-1"]');
  await expect(cubeGroup).toBeVisible();
  await expect(cubeGroup).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => cubeRows.count(), { timeout: 10_000 }).toBeGreaterThan(0);

  await cubeGroup.click();
  await expect(cubeGroup).toHaveAttribute("aria-expanded", "false");
  await expect(cubeRows).toHaveCount(0);

  await page.locator("#timeline-row-search").fill("position");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"]')).toBeVisible();

  await page.locator("#timeline-row-search").press("Escape");
  await expect(cubeGroup).toHaveAttribute("aria-expanded", "false");
  await expect(cubeRows).toHaveCount(0);

  await page.reload();
  await expect(page.locator('.timeline-track-group[data-group-target-id="object-1"]')).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"]')).toHaveCount(0);
});
