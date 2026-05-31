import { expect, test, type Page } from "@playwright/test";

test("copies and pastes transform poses with optional Auto-Key", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  const copyPose = page.locator("#copy-transform-pose");
  const pastePose = page.locator("#paste-transform-pose");
  await expect(copyPose).toBeVisible();
  await expect(pastePose).toBeDisabled();

  await setTransformValue(page, "position", "x", 1.25);
  await setTransformValue(page, "rotation", "y", 35);
  await setTransformValue(page, "scale", "z", 1.5);
  await copyPose.click();
  await expect(pastePose).toBeEnabled();

  await page.locator('.outliner-item[data-id="object-3"]').click();
  await pastePose.click();
  await expectTransformValue(page, "position", "x", "1.25");
  await expectTransformValue(page, "rotation", "y", "35");
  await expectTransformValue(page, "scale", "z", "1.5");

  await page.locator("#timeline-current-time").evaluate((input) => {
    (input as HTMLInputElement).value = "2";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await setTransformValue(page, "position", "x", -2);
  await setTransformValue(page, "rotation", "y", 0);
  await setTransformValue(page, "scale", "z", 1);
  await page.locator("#timeline-auto-key").check();
  await pastePose.click();

  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
  await expect(page.locator('.timeline-track-label[data-object-id="object-3"][data-track-kind="position"]').first()).toHaveClass(/has-keyframes/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-3"][data-track-kind="rotation"]').first()).toHaveClass(/has-keyframes/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-3"][data-track-kind="scale"]').first()).toHaveClass(/has-keyframes/);
});

async function setTransformValue(page: Page, prop: string, axis: string, value: number): Promise<void> {
  await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function expectTransformValue(page: Page, prop: string, axis: string, value: string): Promise<void> {
  await expect(page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`)).toHaveValue(value);
}
