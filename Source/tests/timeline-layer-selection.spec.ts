import { expect, test, type Page } from "@playwright/test";

test("selects previous and next layers from the timeline stack", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator('.outliner-item[data-id="object-1"]')).toHaveClass(/active/);

  await runCommand(page, "select next layer", "timeline.select-next-layer");
  await expect(page.locator("#selection-summary")).toContainText("Wheel Torus");
  await expect(page.locator('.outliner-item[data-id="object-2"]')).toHaveClass(/active/);

  await page.keyboard.press("Alt+ArrowDown");
  await expect(page.locator("#selection-summary")).toContainText("Sphere");
  await expect(page.locator('.outliner-item[data-id="object-3"]')).toHaveClass(/active/);

  await page.keyboard.press("Alt+ArrowUp");
  await expect(page.locator("#selection-summary")).toContainText("Wheel Torus");
  await expect(page.locator('.outliner-item[data-id="object-2"]')).toHaveClass(/active/);

  await runCommand(page, "select previous layer", "timeline.select-previous-layer");
  await expect(page.locator("#selection-summary")).toContainText("Cube");
  await expect(page.locator('.outliner-item[data-id="object-1"]')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeEnabled();
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
}
