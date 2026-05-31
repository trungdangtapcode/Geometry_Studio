import { expect, test } from "@playwright/test";

test("opens and searches the in-app quick help", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  const help = page.locator("#quick-help");
  await expect(help).not.toHaveClass(/open/);

  await page.locator("#quick-help-btn").click();
  await expect(help).toHaveClass(/open/);
  await expect(page.getByRole("dialog", { name: "Geometry Studio quick help" })).toBeVisible();
  await expect(page.locator(".quick-help-item", { hasText: "Set TRS" })).toBeVisible();

  await page.locator("#quick-help-search").fill("Set TRS");
  await expect(page.locator(".quick-help-item", { hasText: "Set TRS" })).toBeVisible();
  await expect(page.locator(".quick-help-item", { hasText: "Orbit" })).toBeHidden();

  await page.locator("#quick-help-search").fill("not-a-real-command");
  await expect(page.locator("#quick-help-empty")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(help).not.toHaveClass(/open/);

  await page.keyboard.press("Shift+/");
  await expect(help).toHaveClass(/open/);
  await page.locator("#quick-help-close").click();
  await expect(help).not.toHaveClass(/open/);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("quick help");
  await page.locator('[data-command-id="help.quick"]').click({ force: true });
  await expect(help).toHaveClass(/open/);
});
