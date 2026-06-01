import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: Array<{
          interpolation: string;
          easeStrength: number;
          easeInStrength: number;
          easeOutStrength: number;
        }>;
      }>;
    }>;
  };
};

test("copies and pastes keyframe ease settings through the command palette", async ({ page }) => {
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
  await setTransformValue(page, "position", "x", 0);
  await page.locator("#timeline-add-keyframe").click();
  await setTimelineTime(page, 2);
  await setTransformValue(page, "position", "x", 4);
  await page.locator("#timeline-add-keyframe").click();

  await page.keyboard.press("Control+A");
  await page.locator("#timeline-ease-back-out").click();
  await setEaseInput(page, "#timeline-key-ease-in", 60);
  await setEaseInput(page, "#timeline-key-ease-out", 140);
  await runCommand(page, "copy keyframe ease");

  await page.locator("#timeline-ease-linear").click();
  await setEaseInput(page, "#timeline-key-ease", 100);
  await expect(page.locator("#timeline-interpolation")).toHaveValue("linear");

  await runCommand(page, "paste keyframe ease");

  const scene = await saveScene(page);
  const positionTrack = scene.timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === scene.selectedId)
    ?.tracks.find((track) => track.kind === "position");
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.interpolation)).toEqual(["backOut", "backOut"]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeStrength)).toEqual([1, 1]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeInStrength)).toEqual([0.6, 0.6]);
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.easeOutStrength)).toEqual([1.4, 1.4]);
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

async function runCommand(page: Page, query: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await expect(page.locator("#command-palette-search")).toBeVisible();
  await page.locator("#command-palette-search").fill(query);
  await page.keyboard.press("Enter");
  await expect(page.locator("#command-palette")).toHaveAttribute("aria-hidden", "true");
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

async function setEaseInput(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((input, nextValue) => {
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
