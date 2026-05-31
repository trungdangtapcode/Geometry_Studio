import { expect, test } from "@playwright/test";

test("scales the editor UI like browser zoom and persists the value", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.removeItem("geometry-studio-ui-scale"));
  await page.reload();

  const shell = page.locator(".studio-shell");
  await expect(page.locator("#ui-scale")).toHaveValue("1");
  await expect(shell).toHaveAttribute("data-scale", "1");

  await page.locator("#ui-scale").selectOption("0.75");
  await expect(page.locator("#ui-scale")).toHaveValue("0.75");
  await expect(shell).toHaveAttribute("data-scale", "0.75");
  await expect(shell).toHaveAttribute("style", /--ui-scale:\s*0\.75/);
  await expect(page.locator(".inspector")).toBeVisible();
  const inspectorBounds = await page.locator(".inspector").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
  });
  expect(inspectorBounds.left).toBeGreaterThanOrEqual(0);
  expect(inspectorBounds.right).toBeLessThanOrEqual(inspectorBounds.viewportWidth + 1);
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("geometry-studio-ui-scale"))).toBe("0.75");

  await page.reload();
  await expect(page.locator("#ui-scale")).toHaveValue("0.75");
  await expect(page.locator(".studio-shell")).toHaveAttribute("data-scale", "0.75");
});
