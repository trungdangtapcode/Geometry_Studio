import { expect, test, type Page } from "@playwright/test";

test("shows editable speed graph for active keyed track", async ({ page }) => {
  test.setTimeout(120_000);
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

  const scene = await saveScene(page);
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.interpolation)).toEqual(["easeIn", "easeIn"]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeStrength)).toEqual([1.05, 1.05]);

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

async function saveScene(page: Page): Promise<{
  selectedId: string;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{ kind: string; keyframes: Array<{ interpolation: string; easeStrength: number }> }>;
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
