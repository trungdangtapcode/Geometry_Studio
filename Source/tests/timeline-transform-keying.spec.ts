import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: Array<{ time: number; value: number[] }>;
      }>;
    }>;
  };
};

test("preserves live rotation and scale while setting transform row keys one by one", async ({ page }) => {
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
  await setTransformValue(page, "rotation", "y", 0);
  await setTransformValue(page, "scale", "x", 1);
  await setPoseShortcut(page);

  await setTimelineTime(page, 2);
  await setTransformValue(page, "position", "x", 3);
  await setTransformValue(page, "rotation", "y", 90);
  await setTransformValue(page, "scale", "x", 2);

  await setTransformKey(page, "position");
  await expectTransformValue(page, "rotation", "y", 90);
  await expectTransformValue(page, "scale", "x", 2);

  await setTransformKey(page, "rotation");
  await expectTransformValue(page, "scale", "x", 2);
  await setTransformKey(page, "scale");

  await setTimelineTime(page, 1);
  await expectTransformValue(page, "position", "x", 1.5);
  await expectTransformValue(page, "rotation", "y", 45);
  await expectTransformValue(page, "scale", "x", 1.5);

  const scene = await saveScene(page);
  const cubeTimeline = scene.timeline.objects.find((object) => object.objectId === "object-1");
  expect(cubeTimeline?.tracks.find((track) => track.kind === "position")?.keyframes.map((keyframe) => keyframe.value[0])).toEqual([0, 3]);
  expect(cubeTimeline?.tracks.find((track) => track.kind === "rotation")?.keyframes.map((keyframe) => keyframe.value[1])).toEqual([0, 90]);
  expect(cubeTimeline?.tracks.find((track) => track.kind === "scale")?.keyframes.map((keyframe) => keyframe.value[0])).toEqual([1, 2]);
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

async function setTransformKey(page: Page, prop: "position" | "rotation" | "scale"): Promise<void> {
  await page.locator(`.transform-key-button[data-prop="${prop}"]`).click();
}

async function setPoseShortcut(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Shift+K");
  await expect(page.locator("#timeline-selection")).toContainText("3 keyframes selected");
}

async function expectTransformValue(page: Page, prop: "position" | "rotation" | "scale", axis: "x" | "y" | "z", expected: number): Promise<void> {
  await expect.poll(async () => Number(await page.locator(`.transform-input[data-prop="${prop}"][data-axis="${axis}"]`).inputValue())).toBeCloseTo(expected, 2);
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
