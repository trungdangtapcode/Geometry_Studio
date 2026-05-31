import { expect, test } from "@playwright/test";

test("promotes recently used commands when the command palette opens", async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("__command_palette_recents_test_ready")) {
      window.localStorage.removeItem("geometry-studio-recent-commands");
      window.sessionStorage.setItem("__command_palette_recents_test_ready", "true");
    }
  });
  await page.goto("/");

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("Frame All Objects");
  await page.keyboard.press("Enter");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");

  await page.keyboard.press("Control+K");
  const firstCommand = page.locator(".command-palette-item").first();
  await expect(firstCommand).toHaveAttribute("data-command-id", "view.frame-all");
  await expect(firstCommand.locator(".command-palette-text span")).toContainText("Recent");

  await page.reload();
  await page.keyboard.press("Control+K");
  const persistedFirstCommand = page.locator(".command-palette-item").first();
  await expect(persistedFirstCommand).toHaveAttribute("data-command-id", "view.frame-all");
  await expect(persistedFirstCommand.locator(".command-palette-text span")).toContainText("Recent");
});
