import { expect, test, type Page } from "@playwright/test";

test("collapses timeline layer groups while preserving search reveal", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__timeline_group_collapse_test_ready")) {
      window.localStorage.removeItem("geometry-studio-timeline-collapsed-groups");
      window.sessionStorage.setItem("__timeline_group_collapse_test_ready", "true");
    }
  });
  await page.goto("/");
  await page.locator("#timeline-row-filter").selectOption("all");

  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const cubeToggle = cubeGroup.locator(".timeline-group-toggle");
  const cubeRows = page.locator('.timeline-track-label[data-object-id="object-1"]');
  const sphereGroup = page.locator('.timeline-track-group[data-group-target-id="object-3"]');
  await expect(cubeGroup).toBeVisible();
  await expect(cubeToggle).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => cubeRows.count(), { timeout: 10_000 }).toBeGreaterThan(0);
  await expect.poll(async () => page.locator(".timeline-track-group").count(), { timeout: 10_000 }).toBeGreaterThan(2);

  await sphereGroup.click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");
  await expect(sphereGroup.locator(".timeline-group-toggle")).toHaveAttribute("aria-expanded", "true");

  await cubeGroup.dblclick();
  const renameInput = cubeGroup.locator(".timeline-group-rename");
  await expect(renameInput).toBeVisible();
  await renameInput.fill("Hero Cube");
  await renameInput.press("Enter");
  await expect(page.locator("#selection-summary")).toContainText("Hero Cube");
  await expect(page.locator("#object-name")).toHaveValue("Hero Cube");
  await expect(page.locator('.timeline-track-group[data-group-target-id="object-1"]')).toContainText("Hero Cube");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "1";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await setTransformValue(page, "position", "x", 1.5);
  await setTransformValue(page, "rotation", "y", 45);
  await setTransformValue(page, "scale", "z", 1.4);
  await cubeGroup.locator(".timeline-group-pose-key").click();
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await expect(cubeGroup).toContainText("3 keys");

  await cubeToggle.click({ modifiers: ["Alt"] });
  await expect(page.locator('.timeline-group-toggle[aria-expanded="true"]')).toHaveCount(0);
  await expect(cubeRows).toHaveCount(0);

  await page.locator("#command-palette-btn").click();
  await page.locator("#command-palette-search").fill("expand timeline groups");
  await page.locator('[data-command-id="timeline.expand-groups"]').click();
  await expect(page.locator('.timeline-group-toggle[aria-expanded="false"]')).toHaveCount(0);
  await expect.poll(async () => cubeRows.count(), { timeout: 10_000 }).toBeGreaterThan(0);

  await cubeToggle.click();
  await expect(cubeToggle).toHaveAttribute("aria-expanded", "false");
  await expect(cubeRows).toHaveCount(0);

  await page.locator("#timeline-row-search").fill("position");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"][data-track-axis="x"]')).toBeVisible();

  await page.locator("#timeline-row-search").press("Escape");
  await expect(cubeToggle).toHaveAttribute("aria-expanded", "false");
  await expect(cubeRows).toHaveCount(0);

  await page.reload();
  await expect(page.locator('.timeline-track-group[data-group-target-id="object-1"] .timeline-group-toggle')).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"]')).toHaveCount(0);
});

async function setTransformValue(page: Page, prop: string, axis: string, value: number): Promise<void> {
  await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
