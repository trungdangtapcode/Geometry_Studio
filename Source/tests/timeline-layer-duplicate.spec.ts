import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  objects: Array<{ id: string; name: string; position: [number, number, number] }>;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        keyframes: unknown[];
      }>;
    }>;
  };
};

test("duplicates the selected layer with its copied animation tracks", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-duplicate-layer").click();

  await expect(page.locator("#selection-summary")).toContainText("Cube Copy");
  await expect(page.locator("#object-name")).toHaveValue("Cube Copy");

  const scene = await saveScene(page);
  const duplicate = scene.objects.find((object) => object.id === scene.selectedId);
  const source = scene.objects.find((object) => object.name === "Cube");
  expect(duplicate?.name).toBe("Cube Copy");
  expect(source).toBeTruthy();
  expect(duplicate?.id).not.toBe(source!.id);
  expect(duplicate?.position).toEqual(source!.position);

  const duplicateTracks = transformTrackSummary(scene, duplicate!.id);
  const sourceTracks = transformTrackSummary(scene, source!.id);
  expect(duplicateTracks).toEqual([
    ["position", 1],
    ["rotation", 1],
    ["scale", 1]
  ]);
  expect(sourceTracks).toEqual(duplicateTracks);
  expect(errors).toEqual([]);
});

function transformTrackSummary(scene: SceneExport, objectId: string): Array<[string, number]> {
  const objectTimeline = scene.timeline.objects.find((object) => object.objectId === objectId);
  return objectTimeline?.tracks
    .filter((track) => ["position", "rotation", "scale"].includes(track.kind))
    .map((track) => [track.kind, track.keyframes.length] as [string, number])
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
