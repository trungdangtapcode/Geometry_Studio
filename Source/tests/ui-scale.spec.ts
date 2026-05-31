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
  await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("geometry-studio-ui-scale"))).toBe("0.75");

  const context = page.context();
  await page.close();
  const secondPage = await context.newPage();
  await secondPage.goto("/");
  await expect(secondPage.locator("#ui-scale")).toHaveValue("0.75");
  await expect(secondPage.locator(".studio-shell")).toHaveAttribute("data-scale", "0.75");
  await secondPage.close();
});
