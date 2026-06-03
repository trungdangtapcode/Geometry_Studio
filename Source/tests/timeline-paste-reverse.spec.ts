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

test("pastes copied keyframes with reversed timing through the toolbar button", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await page.locator("#timeline-track-kind").selectOption("position");
  await setTimelineTime(page, 0);
  await setTransformValue(page, "position", "x", 1);
  await page.locator("#timeline-add-keyframe").click();
  await setTimelineTime(page, 2);
  await setTransformValue(page, "position", "x", 5);
  await page.locator("#timeline-add-keyframe").click();

  await page.keyboard.press("Control+A");
  await page.keyboard.press("Control+C");
  await setTimelineTime(page, 4);
  await expect(page.locator("#timeline-paste-reverse-keyframes")).toBeEnabled();
  await page.locator("#timeline-paste-reverse-keyframes").click();

  const scene = await saveScene(page);
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");

  const pastedKeys = positionTrack?.keyframes
    .filter((keyframe) => keyframe.time >= 4)
    .map((keyframe) => ({ time: keyframe.time, x: keyframe.value[0] }));
  expect(pastedKeys).toEqual([
    { time: 4, x: 5 },
    { time: 6, x: 1 }
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
