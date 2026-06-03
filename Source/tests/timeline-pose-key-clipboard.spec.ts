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
          interpolation: string;
        }>;
      }>;
    }>;
  };
};

test("copies complete pose keys and pastes them onto another object", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-current-time")).toBeVisible();

  await setTimelineTime(page, 0);
  await setTransformValue(page, "position", "x", 2);
  await setTransformValue(page, "position", "y", 0);
  await setTransformValue(page, "position", "z", 0);
  await setTransformValue(page, "rotation", "x", 0);
  await setTransformValue(page, "rotation", "y", 45);
  await setTransformValue(page, "rotation", "z", 0);
  await setTransformValue(page, "scale", "x", 1.5);
  await setTransformValue(page, "scale", "y", 1);
  await setTransformValue(page, "scale", "z", 1);
  await page.locator("#timeline-set-transform").click();

  await runCommand(page, "copy pose keys at playhead", "timeline.copy-pose-keys");

  await page.locator('.primitive-btn[data-primitive="sphere"]').click();
  await setTimelineTime(page, 3);
  await runCommand(page, "paste pose keys at playhead", "timeline.paste-pose-keys");

  const scene = await saveScene(page);
  const selectedTimeline = scene.timeline.objects.find((objectTimeline) => objectTimeline.objectId === scene.selectedId);
  expect(trackValuesAt(selectedTimeline, "position", 3)).toEqual([2, 0, 0]);
  expect(trackValuesAt(selectedTimeline, "rotation", 3)).toEqual([0, 45, 0]);
  expect(trackValuesAt(selectedTimeline, "scale", 3)).toEqual([1.5, 1, 1]);
  expect(trackInterpolationAt(selectedTimeline, "position", 3)).toBe("linear");
  expect(errors).toEqual([]);
});

function trackValuesAt(
  objectTimeline: SceneExport["timeline"]["objects"][number] | undefined,
  kind: string,
  time: number
): [number, number, number] | undefined {
  return objectTimeline
    ?.tracks.find((track) => track.kind === kind)
    ?.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001)
    ?.value;
}

function trackInterpolationAt(
  objectTimeline: SceneExport["timeline"]["objects"][number] | undefined,
  kind: string,
  time: number
): string | undefined {
  return objectTimeline
    ?.tracks.find((track) => track.kind === kind)
    ?.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001)
    ?.interpolation;
}

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

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await expect(page.locator("#command-palette-search")).toBeVisible();
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeVisible();
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

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
