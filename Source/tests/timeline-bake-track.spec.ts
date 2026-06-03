import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: Array<{
          time: number;
          value: [number, number, number];
        }>;
      }>;
    }>;
  };
};

test("bakes the active track over Work In/Out to frame keys", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await setTimelineNumberInput(page, "#timeline-fps", 4);
  await setTimelineNumberInput(page, "#timeline-work-start", 0);
  await setTimelineNumberInput(page, "#timeline-work-end", 1);
  await page.locator("#timeline-track-kind").selectOption("position");
  await setPositionKey(page, 0, 0);
  await setPositionKey(page, 1, 4);

  await expect(page.locator("#timeline-bake-track")).toBeEnabled();
  await page.locator("#timeline-bake-track").click();

  const scene = await saveScene(page);
  expect(positionTimesAndValues(scene)).toEqual([
    { time: 0, x: 0 },
    { time: 0.25, x: 1 },
    { time: 0.5, x: 2 },
    { time: 0.75, x: 3 },
    { time: 1, x: 4 }
  ]);
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

async function setPositionKey(page: Page, time: number, x: number): Promise<void> {
  await setTimelineNumberInput(page, "#timeline-current-time", time);
  await setTransformValue(page, "position", "x", x);
  await page.locator("#timeline-add-keyframe").click();
}

async function setTimelineNumberInput(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((input, nextValue) => {
    (input as HTMLInputElement).value = String(nextValue);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
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

function positionTimesAndValues(scene: SceneExport): Array<{ time: number; x: number }> {
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  return positionTrack?.keyframes.map((keyframe) => ({ time: keyframe.time, x: keyframe.value[0] })) ?? [];
}
