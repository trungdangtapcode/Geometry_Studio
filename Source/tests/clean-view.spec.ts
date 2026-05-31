import { expect, test } from "@playwright/test";

test("clean view toggles grid, axes, transform gizmo, helpers, overlays, and blur effects", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");

  await setCheckboxes(page, [
    "post-bloom-toggle",
    "post-ssao-toggle",
    "post-dof-toggle",
    "post-vignette-toggle",
    "post-halftone-toggle",
    "helper-toggle",
    "frustum-toggle",
    "onion-skin-toggle"
  ], true);

  await expect(page.locator("#grid-toggle")).toBeChecked();
  await expect(page.locator("#axes-toggle")).toBeChecked();
  await expect(page.locator("#stats-toggle")).toBeChecked();
  await expect(page.locator("#motion-path-toggle")).toBeChecked();
  await expect(page.locator("#post-dof-toggle")).toBeChecked();

  await page.locator("#clean-view-button").click();

  await expect(page.locator("#clean-view-button")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#clean-view-button")).toContainText("Restore View");
  await expect(page.locator("#grid-toggle")).not.toBeChecked();
  await expect(page.locator("#axes-toggle")).not.toBeChecked();
  await expect(page.locator("#stats-toggle")).not.toBeChecked();
  await expect(page.locator("#fps")).toHaveClass(/hidden/);
  await expect(page.locator("#telemetry-grid")).toHaveClass(/hidden/);
  await expect(page.locator("#helper-toggle")).not.toBeChecked();
  await expect(page.locator("#frustum-toggle")).not.toBeChecked();
  await expect(page.locator("#motion-path-toggle")).not.toBeChecked();
  await expect(page.locator("#onion-skin-toggle")).not.toBeChecked();
  await expect(page.locator("#post-bloom-toggle")).not.toBeChecked();
  await expect(page.locator("#post-ssao-toggle")).not.toBeChecked();
  await expect(page.locator("#post-dof-toggle")).not.toBeChecked();
  await expect(page.locator("#post-vignette-toggle")).not.toBeChecked();
  await expect(page.locator("#post-halftone-toggle")).not.toBeChecked();
  await expect(page.locator("#renderer-mode")).toContainText("Post Off");

  await page.locator("#clean-view-button").click();

  await expect(page.locator("#clean-view-button")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#clean-view-button")).toContainText("Clean View");
  await expect(page.locator("#grid-toggle")).toBeChecked();
  await expect(page.locator("#axes-toggle")).toBeChecked();
  await expect(page.locator("#stats-toggle")).toBeChecked();
  await expect(page.locator("#helper-toggle")).toBeChecked();
  await expect(page.locator("#frustum-toggle")).toBeChecked();
  await expect(page.locator("#motion-path-toggle")).toBeChecked();
  await expect(page.locator("#onion-skin-toggle")).toBeChecked();
  await expect(page.locator("#post-bloom-toggle")).toBeChecked();
  await expect(page.locator("#post-ssao-toggle")).toBeChecked();
  await expect(page.locator("#post-dof-toggle")).toBeChecked();
  await expect(page.locator("#post-vignette-toggle")).toBeChecked();
  await expect(page.locator("#post-halftone-toggle")).toBeChecked();
});

test("clean view exposes shortcut-aware hover help and Alt+G shortcut", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");

  await expect(page.locator("#clean-view-button")).toHaveAttribute("aria-keyshortcuts", "Alt+G");
  await page.locator("#clean-view-button").hover();
  await expect(page.locator("#shortcut-tooltip")).toContainText("Clean View");
  await expect(page.locator("#shortcut-tooltip")).toContainText("Alt+G");

  await expect(page.locator("#grid-toggle")).toBeChecked();
  await page.keyboard.press("Alt+G");
  await expect(page.locator("#clean-view-button")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#grid-toggle")).not.toBeChecked();
  await expect(page.locator("#axes-toggle")).not.toBeChecked();
  await page.keyboard.press("Alt+G");
  await expect(page.locator("#clean-view-button")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#grid-toggle")).toBeChecked();
  await expect(page.locator("#axes-toggle")).toBeChecked();
});

async function setCheckboxes(page: import("@playwright/test").Page, ids: string[], checked: boolean): Promise<void> {
  await page.evaluate(({ ids: checkboxIds, checked: nextChecked }) => {
    checkboxIds.forEach((id) => {
      const input = document.getElementById(id);
      if (!(input instanceof HTMLInputElement)) throw new Error(`Missing checkbox: ${id}`);
      if (input.checked === nextChecked) return;
      input.checked = nextChecked;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, { ids, checked });
}
