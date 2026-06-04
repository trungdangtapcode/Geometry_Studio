import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string }>;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: Array<{ time: number }>;
      }>;
    }>;
  };
};

test("duplicates the selected layer and shifts copied transform keys to the playhead", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await setTimelineTime(page, 0);
  await page.locator("#timeline-set-transform").click();
  await setTimelineTime(page, 2);
  await runCommand(page, "duplicate layer at playhead", "timeline.duplicate-layer-at-playhead");

  await expect(page.locator("#selection-summary")).toContainText("Cube Playhead Copy");
  await expect(page.locator("#object-name")).toHaveValue("Cube Playhead Copy");

  const scene = await saveScene(page);
  const duplicate = scene.objects.find((object) => object.id === scene.selectedId);
  const source = scene.objects.find((object) => object.name === "Cube");
  expect(duplicate?.name).toBe("Cube Playhead Copy");
  expect(source).toBeTruthy();
  expect(duplicate?.id).not.toBe(source!.id);

  expect(transformTrackTimes(scene, source!.id)).toEqual([
    ["position", [0]],
    ["rotation", [0]],
    ["scale", [0]]
  ]);
  expect(transformTrackTimes(scene, duplicate!.id)).toEqual([
    ["position", [2]],
    ["rotation", [2]],
    ["scale", [2]]
  ]);
  expect(errors).toEqual([]);
});

async function runCommand(page: Page, query: string, commandId: string): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("#command-palette-search").fill(query);
  await expect(page.locator(`[data-command-id="${commandId}"]`)).toBeEnabled();
  await page.locator(`[data-command-id="${commandId}"]`).click({ force: true });
}

async function setTimelineTime(page: Page, time: number): Promise<void> {
  await page.locator("#timeline-current-time").evaluate((input, nextTime) => {
    (input as HTMLInputElement).value = String(nextTime);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, time);
}

function transformTrackTimes(scene: SceneExport, objectId: string): Array<[string, number[]]> {
  const objectTimeline = scene.timeline.objects.find((object) => object.objectId === objectId);
  return objectTimeline?.tracks
    .filter((track) => ["position", "rotation", "scale"].includes(track.kind))
    .map((track) => [track.kind, track.keyframes.map((keyframe) => keyframe.time)] as [string, number[]])
    .sort((left, right) => ["position", "rotation", "scale"].indexOf(left[0]) - ["position", "rotation", "scale"].indexOf(right[0])) ?? [];
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

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
