import { expect, test, type Locator, type Page } from "@playwright/test";

test("shows editable speed graph for active keyed track", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
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
  await expect(page.locator(".timeline-graph-key.graph-x.speed-key:not(.locked)")).toHaveCount(2);

  await page.keyboard.press("Control+A");
  await page.locator("#timeline-ease-in").click();
  await page.locator(".timeline-graph-key.graph-x.speed-key").first().focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("#timeline-key-ease")).toHaveValue("105");
  await expect(page.locator("#timeline-graph-range")).toContainText("Ease 105%");

  const scene = await saveScene(page);
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.interpolation)).toEqual(["easeIn", "easeIn"]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeStrength)).toEqual([1.05, 1.05]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeInStrength)).toEqual([1.05, 1.05]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeOutStrength)).toEqual([1.05, 1.05]);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Escape");
  await expect(page.locator("#timeline-selection")).toContainText("keyframe active");

  await dragGraphKey(page, page.locator(".timeline-graph-key.graph-x.speed-key:not(.locked)").first(), 0, -30);
  await expect(page.locator("#timeline-key-ease")).toBeEnabled();

  await dragGraphKey(page, page.locator(".timeline-graph-key.graph-x.speed-key:not(.locked)").first(), 80, 0);
  const draggedScene = await saveScene(page);
  const draggedPositionTrack = draggedScene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === draggedScene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  expect(draggedPositionTrack?.keyframes[0].time).toBeGreaterThan(0.2);
  expect(draggedPositionTrack?.keyframes[0].easeStrength).toBeGreaterThan(1.2);
  expect(draggedPositionTrack?.keyframes[0].easeInStrength).toBeGreaterThan(1.2);
  expect(draggedPositionTrack?.keyframes[0].easeOutStrength).toBeGreaterThan(1.2);
  expect(draggedPositionTrack?.keyframes[1].time).toBeCloseTo(2, 2);
  expect(draggedPositionTrack?.keyframes[1].easeStrength).toBeCloseTo(1.05, 2);

  await page.locator("#timeline-graph-mode-value").click();
  await expect(page.locator("#timeline-graph-mode-value")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".timeline-graph-key.graph-x.locked")).toHaveCount(0);
  expect(errors).toEqual([]);
});

async function installSceneDownloadCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const downloads: string[] = [];
    (window as unknown as { __sceneDownloads: string[] }).__sceneDownloads = downloads;
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object: Blob | MediaSource) => {
      if (object instanceof Blob) void object.text().then((text) => downloads.push(text));
      return createObjectURL(object);
    };
  });
}

async function setTimelineTime(page: Page, time: number): Promise<void> {
  await page.locator("#timeline-current-time").evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, time);
}

async function setTransformValue(
  page: Page,
  prop: "position" | "rotation" | "scale",
  axis: "x" | "y" | "z",
  value: number
): Promise<void> {
  await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function dragGraphKey(page: Page, locator: Locator, dx: number, dy: number): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("Graph key is not visible");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function saveScene(page: Page): Promise<{
  selectedId: string;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{ kind: string; keyframes: Array<{ time: number; interpolation: string; easeStrength: number; easeInStrength: number; easeOutStrength: number }> }>;
    }>;
  };
}> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string);
}
