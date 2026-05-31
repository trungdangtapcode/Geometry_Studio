import { expect, test } from "@playwright/test";

test("pins command palette actions above recents and persists them", async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__command_palette_pins_test_ready")) {
      window.localStorage.removeItem("geometry-studio-pinned-commands");
      window.localStorage.removeItem("geometry-studio-recent-commands");
      window.sessionStorage.setItem("__command_palette_pins_test_ready", "true");
    }
  });
  await page.goto("/");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("Frame All Objects");
  await page.keyboard.press("Enter");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("Set Key On Active Track");
  await page.locator('[data-pin-command-id="timeline.set-key"]').click();
  await expect(page.locator('[data-command-id="timeline.set-key"]')).toHaveAttribute("data-pinned", "true");
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+K");
  const firstCommand = page.locator(".command-palette-item").first();
  await expect(firstCommand).toHaveAttribute("data-command-id", "timeline.set-key");
  await expect(firstCommand.locator(".command-palette-text span")).toContainText("Pinned");
  await expect(page.locator(".command-palette-item").nth(1)).toHaveAttribute("data-command-id", "view.frame-all");

  await page.reload();
  await page.keyboard.press("Control+K");
  await expect(page.locator(".command-palette-item").first()).toHaveAttribute("data-command-id", "timeline.set-key");
  await expect(page.locator(".command-palette-item").first().locator(".command-palette-text span")).toContainText("Pinned");

  await page.locator('[data-pin-command-id="timeline.set-key"]').first().click();
  await expect(page.locator('[data-command-id="timeline.set-key"]').first()).toHaveAttribute("data-pinned", "false");
});
