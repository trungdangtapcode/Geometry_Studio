import { expect, test, type Page } from "@playwright/test";

test("zooms and pans the timeline with editor wheel gestures", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.locator("#timeline-duration").evaluate((input) => {
    (input as HTMLInputElement).value = "30";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const timelineZoom = async () => page.locator("#keyframe-dock").evaluate((element) => Number((element as HTMLElement).dataset.zoomLevel));
  const timelineOverflow = async () => page.locator("#timeline-canvas .scroll-container").evaluate((element) => element.scrollWidth - element.clientWidth);
  const timelineScrollLeft = async () => page.locator("#timeline-canvas .scroll-container").evaluate((element) => element.scrollLeft);

  const initialZoom = await timelineZoom();
  const zoomPrevented = await dispatchTimelineWheel(page, { deltaY: -420, altKey: true });
  expect(zoomPrevented).toBe(true);
  await expect.poll(timelineZoom, { timeout: 10_000 }).toBeGreaterThan(initialZoom);
  await expect.poll(timelineOverflow, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.locator("#timeline-canvas .scroll-container").evaluate((element) => {
    element.scrollLeft = 0;
  });
  const shiftPanPrevented = await dispatchTimelineWheel(page, { deltaY: 420, shiftKey: true });
  expect(shiftPanPrevented).toBe(true);
  await expect.poll(timelineScrollLeft, { timeout: 10_000 }).toBeGreaterThan(0);

  await page.locator("#timeline-canvas .scroll-container").evaluate((element) => {
    element.scrollLeft = 0;
  });
  await expect.poll(timelineScrollLeft, { timeout: 10_000 }).toBe(0);
  const trackpadPanPrevented = await dispatchTimelineWheel(page, { deltaX: 220 });
  expect(trackpadPanPrevented).toBe(true);
  await expect.poll(timelineScrollLeft, { timeout: 10_000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

async function dispatchTimelineWheel(
  page: Page,
  init: { deltaX?: number; deltaY?: number; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
): Promise<boolean> {
  return page.locator("#timeline-canvas .scroll-container").evaluate((element, wheelInit) => {
    const rect = element.getBoundingClientRect();
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width * 0.52,
      clientY: rect.top + rect.height * 0.45,
      deltaX: wheelInit.deltaX ?? 0,
      deltaY: wheelInit.deltaY ?? 0,
      altKey: wheelInit.altKey ?? false,
      ctrlKey: wheelInit.ctrlKey ?? false,
      metaKey: wheelInit.metaKey ?? false,
      shiftKey: wheelInit.shiftKey ?? false
    });
    return !element.dispatchEvent(event);
  }, init);
}
