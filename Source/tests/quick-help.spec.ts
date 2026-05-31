import { expect, test } from "@playwright/test";

test("opens and searches the in-app quick help", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  const help = page.locator("#quick-help");
  const helpItem = (label: string) =>
    page.locator(".quick-help-item").filter({
      has: page.locator("strong", { hasText: new RegExp(`^${label}$`) })
    });
  await expect(help).not.toHaveClass(/open/);

  await page.locator("#quick-help-btn").click();
  await expect(help).toHaveClass(/open/);
  await expect(page.getByRole("dialog", { name: "Geometry Studio quick help" })).toBeVisible();
  await expect(helpItem("Set Pose")).toBeVisible();

  await page.locator('[data-help-filter="shortcuts"]').click();
  await expect(page.locator('[data-help-filter="shortcuts"]')).toHaveAttribute("aria-pressed", "true");
  await expect(helpItem("Orbit")).toBeVisible();
  await expect(helpItem("Frame All")).toBeHidden();

  await page.locator('[data-help-filter="timeline"]').click();
  await expect(helpItem("Set Pose")).toBeVisible();
  await expect(helpItem("Deselect Keys")).toBeVisible();
  await expect(helpItem("Rendering Lab")).toBeHidden();

  await page.locator('[data-help-filter="rendering"]').click();
  await expect(helpItem("Rendering Lab")).toBeVisible();
  await expect(helpItem("Set Pose")).toBeHidden();

  await page.locator('[data-help-filter="all"]').click();
  await page.locator("#quick-help-search").fill("Set Pose");
  await expect(helpItem("Set Pose")).toBeVisible();
  await expect(helpItem("Orbit")).toBeHidden();

  await page.locator("#quick-help-search").fill("not-a-real-command");
  await expect(page.locator("#quick-help-empty")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(help).not.toHaveClass(/open/);

  await page.keyboard.press("Shift+/");
  await expect(help).toHaveClass(/open/);
  await page.locator("#quick-help-close").click();
  await expect(help).not.toHaveClass(/open/);

  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill("shortcut help");
  await page.locator('[data-command-id="help.shortcuts"]').click({ force: true });
  await expect(help).toHaveClass(/open/);
  await expect(page.locator('[data-help-filter="shortcuts"]')).toHaveAttribute("aria-pressed", "true");
  await expect(helpItem("Orbit")).toBeVisible();
  await expect(helpItem("Frame All")).toBeHidden();
});
