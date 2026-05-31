import { expect, test, type Page } from "@playwright/test";

test("collapses only the timeline range strip", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");

  await expect(page.locator("#timeline-layer-strip-toggle")).toBeVisible();
  await expect(page.locator("#timeline-overview")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip")).toBeVisible();
  await expect(page.locator("#timeline-range-minibar")).toBeHidden();

  const beforeHeight = await timelineCanvasHeight(page);
  await clickButton(page, "#timeline-layer-strip-inline-toggle");

  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
  await expect(page.locator("#timeline-overview")).toBeHidden();
  await expect(page.locator("#timeline-layer-strip")).toBeHidden();
  await expect(page.locator("#timeline-range-minibar")).toBeVisible();
  await expect(page.locator("#timeline-canvas")).toBeVisible();
  await expect.poll(() => timelineCanvasHeight(page)).toBeGreaterThan(beforeHeight);

  await clickButton(page, "#timeline-layer-strip-restore");
  await expect(page.locator("#keyframe-dock")).not.toHaveClass(/layer-strip-collapsed/);
  await expect(page.locator("#timeline-range-minibar")).toBeHidden();
  await expect(page.locator("#timeline-overview")).toBeVisible();
  await expect(page.locator("#timeline-layer-strip")).toBeVisible();

  await clickButton(page, "#timeline-layer-strip-inline-toggle");
  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
  await page.reload();
  await expect(page.locator("#keyframe-dock")).toHaveClass(/layer-strip-collapsed/);
  await expect(page.locator("#timeline-range-minibar")).toBeVisible();
});

test("timeline toolbar exposes off-screen commands through horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 760 });
  await page.goto("/");

  const toolbar = page.locator("#timeline-toolbar");
  await expect(toolbar).toBeVisible();
  await expect.poll(() => toolbar.evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(true);
  await expect(toolbar).toHaveAttribute("data-overflow-right", "true");

  await toolbar.evaluate((element) => {
    element.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 420 }));
  });

  await expect.poll(() => toolbar.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(toolbar).toHaveAttribute("data-overflow-left", "true");

  await toolbar.focus();
  await page.keyboard.press("End");
  await expect.poll(() => toolbar.evaluate((element) => element.scrollLeft + element.clientWidth >= element.scrollWidth - 2)).toBe(true);
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

async function clickButton(page: Page, selector: string): Promise<void> {
  await page.locator(selector).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
}
