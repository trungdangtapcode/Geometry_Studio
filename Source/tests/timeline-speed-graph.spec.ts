import { expect, test } from "@playwright/test";

test("shows read-only speed graph for active keyed track", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await setTimelineTime(page, 0);
  await setTransformValue(page, "position", "x", 0);
  await page.locator("#timeline-add-keyframe").click();
  await setTimelineTime(page, 2);
  await setTransformValue(page, "position", "x", 4);
  await page.locator("#timeline-add-keyframe").click();

  await page.locator("#timeline-track-kind").selectOption("position");
  if (!(await page.locator("#timeline-graph-panel").isVisible())) await page.locator("#timeline-graph-toggle").click();
  await expect(page.locator("#timeline-graph-mode-value")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#timeline-graph-x")).not.toHaveAttribute("d", "");

  await page.locator("#timeline-graph-mode-speed").click();
  await expect(page.locator("#timeline-graph-mode-speed")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position Speed");
  await expect(page.locator("#timeline-graph-range")).toContainText("Speed");
  await expect(page.locator("#timeline-graph-x")).not.toHaveAttribute("d", "");
  await expect(page.locator(".timeline-graph-key.graph-x.locked")).toHaveCount(2);

  await page.locator("#timeline-graph-mode-value").click();
  await expect(page.locator("#timeline-graph-mode-value")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".timeline-graph-key.graph-x.locked")).toHaveCount(0);
  expect(errors).toEqual([]);
});

async function setTimelineTime(page: import("@playwright/test").Page, time: number): Promise<void> {
  await page.locator("#timeline-current-time").evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, time);
}

async function setTransformValue(
  page: import("@playwright/test").Page,
  prop: "position" | "rotation" | "scale",
  axis: "x" | "y" | "z",
  value: number
): Promise<void> {
  await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
