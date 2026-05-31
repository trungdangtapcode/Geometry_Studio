import { expect, test, type Page } from "@playwright/test";

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
}

async function exportedScene(page: Page): Promise<{
  selectedId: string;
  timeline: { objects: Array<{ objectId: string; tracks: Array<{ kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> }> }> };
}> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>("#save-scene")?.click();
  });
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string);
}

function objectTrack(
  scene: Awaited<ReturnType<typeof exportedScene>>,
  objectId: string,
  kind: string
): { kind: string; keyframes: Array<{ time: number; value: number[]; interpolation: string }> } | undefined {
  return scene.timeline.objects.find((objectTimeline) => objectTimeline.objectId === objectId)
    ?.tracks.find((track) => track.kind === kind);
}

test("applies product reveal as editable timeline keys", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneDownloadCapture(page);
  await page.goto("/");

  await runCommand(page, "product reveal motion preset");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("position");
  await expect(page.locator("#timeline-selection")).toContainText("12 keyframes");

  const scene = await exportedScene(page);
  const objectId = scene.selectedId;
  const positionTrack = objectTrack(scene, objectId, "position");
  const rotationTrack = objectTrack(scene, objectId, "rotation");
  const scaleTrack = objectTrack(scene, objectId, "scale");
  const opacityTrack = objectTrack(scene, objectId, "objectOpacity");

  expect(positionTrack).toBeTruthy();
  expect(rotationTrack).toBeTruthy();
  expect(scaleTrack).toBeTruthy();
  expect(opacityTrack).toBeTruthy();
  expect(positionTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 4, 8]);
  expect(rotationTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 4, 8]);
  expect(scaleTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 4, 8]);
  expect(opacityTrack?.keyframes.map((keyframe) => [keyframe.time, keyframe.value[0]])).toEqual([[0, 0], [4, 1], [8, 1]]);
  expect(positionTrack!.keyframes[0].value[0]).toBeLessThan(positionTrack!.keyframes[1].value[0]);
});

test("keeps animation panel presets on the shared baking path", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneDownloadCapture(page);
  await page.goto("/");

  await page.locator('[data-animation="spin"]').click({ force: true });
  await expect(page.locator("#selection-summary")).toContainText("Keyframed");
  await expect(page.locator("#timeline-track-kind")).toHaveValue("rotation");

  const scene = await exportedScene(page);
  const rotationTrack = objectTrack(scene, scene.selectedId, "rotation");
  expect(rotationTrack).toBeTruthy();
  expect(rotationTrack?.keyframes.map((keyframe) => keyframe.time)).toEqual([0, 8]);
  expect(rotationTrack?.keyframes[1].value[1]).toBe(360);
});
