import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: Array<{ value: number[] }>;
      }>;
    }>;
  };
};

test("nudges selected value graph key values from the keyboard", async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await setTimelineTime(page, 0);
  await setTransformValue(page, "position", "x", 1);
  await page.locator("#timeline-add-keyframe").click();
  await setTimelineTime(page, 1);
  await setTransformValue(page, "position", "x", 3);
  await page.locator("#timeline-add-keyframe").click();
  await page.locator("#timeline-track-kind").selectOption("position");
  if (!(await page.locator("#timeline-graph-panel").isVisible())) await page.locator("#timeline-graph-toggle").click();
  await expect(page.locator("#timeline-graph-title")).toContainText("Cube | Position");

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Control+A");
  await expect(page.locator("#timeline-selection")).toContainText("2 keyframes selected");

  const firstGraphKey = page.locator('.timeline-graph-key.graph-x[data-key-time="0"]').first();
  await expect(firstGraphKey).toBeVisible();
  await firstGraphKey.evaluate((element) => (element as SVGElement).focus());
  await page.keyboard.press("ArrowUp");

  const scene = await saveScene(page);
  const positionTrack = scene.timeline.objects
    .find((object) => object.objectId === "object-1")
    ?.tracks.find((track) => track.kind === "position");
  const values = positionTrack?.keyframes.map((keyframe) => keyframe.value[0]) ?? [];
  expect(values[0]).toBeGreaterThan(1);
  expect(values[1]).toBeGreaterThan(3);
  expect(values[1] - values[0]).toBeCloseTo(2, 3);
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

async function setTransformValue(page: Page, prop: "position" | "rotation" | "scale", axis: "x" | "y" | "z", value: number): Promise<void> {
  await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
