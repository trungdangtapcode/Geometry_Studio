import { expect, test, type Page } from "@playwright/test";

test("collapses only the timeline range strip", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("geometry-studio-timeline-layer-strip-collapsed"));
  await page.reload();

  await expect(page.locator("#timeline-layer-strip-toggle")).toBeVisible();
  await expect(page.locator("#timeline-overview")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip")).toBeVisible();

  const beforeHeight = await timelineCanvasHeight(page);
  await page.locator("#timeline-layer-strip-toggle").click();

  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
  await expect(page.locator("#timeline-overview")).toBeHidden();
  await expect(page.locator("#timeline-layer-strip")).toBeHidden();
  await expect.poll(() => timelineCanvasHeight(page)).toBeGreaterThan(beforeHeight);

  await page.reload();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
});

test("exposes stylized rendering controls without enabling path tracing in headless WebGL", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#path-trace-button")).toBeVisible();
  await expect(page.locator("#path-trace-status")).toContainText(/Optional still|unavailable/);
  await expect(page.getByRole("button", { name: "Anime Toon", exact: true })).toBeVisible();
  await expect(page.locator("#post-halftone-toggle")).not.toBeChecked();

  await page.getByRole("button", { name: "Anime Toon", exact: true }).click();
  await expect(page.locator("#material-mode")).toHaveValue("toon");

  await page.locator("#post-halftone-toggle").check();
  await expect(page.locator("#renderer-mode")).toContainText("Comic Halftone On");
});

async function timelineCanvasHeight(page: Page): Promise<number> {
  return page.locator("#timeline-canvas").evaluate((element) => element.getBoundingClientRect().height);
}
