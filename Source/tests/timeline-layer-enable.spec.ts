import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  selectedId: string;
  timeline: {
    objects: Array<{
      objectId: string;
      tracks: Array<{
        kind: string;
        enabled: boolean;
        keyframes: unknown[];
      }>;
    }>;
  };
};

test("enables and disables all keyed tracks on an object layer", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-set-transform")).toBeVisible();
  await page.locator("#timeline-set-transform").click();
  await page.locator("#timeline-row-filter").selectOption("all");

  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const layerEnable = cubeGroup.locator(".timeline-group-enable");
  await expect(layerEnable).toBeEnabled();
  await layerEnable.click();
  await expect(layerEnable).toHaveClass(/active/);
  await expect(cubeGroup).toHaveClass(/disabled-layer/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"]').first()).toHaveClass(/disabled-track/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="rotation"]').first()).toHaveClass(/disabled-track/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="scale"]').first()).toHaveClass(/disabled-track/);

  const disabledScene = await saveScene(page);
  const disabledTracks = selectedTransformTracks(disabledScene);
  expect(disabledTracks.map((track) => [track.kind, track.enabled])).toEqual([
    ["position", false],
    ["rotation", false],
    ["scale", false]
  ]);

  await layerEnable.click();
  await expect(layerEnable).not.toHaveClass(/active/);
  await expect(cubeGroup).not.toHaveClass(/disabled-layer/);
  await expect(page.locator('.timeline-track-label[data-object-id="object-1"][data-track-kind="position"]').first()).not.toHaveClass(/disabled-track/);
  expect(errors).toEqual([]);
});

function selectedTransformTracks(scene: SceneExport): Array<{ kind: string; enabled: boolean }> {
  const objectTimeline = scene.timeline.objects.find((object) => object.objectId === scene.selectedId);
  return objectTimeline?.tracks
    .filter((track) => ["position", "rotation", "scale"].includes(track.kind) && track.keyframes.length > 0)
    .map((track) => ({ kind: track.kind, enabled: track.enabled }))
    .sort((left, right) => ["position", "rotation", "scale"].indexOf(left.kind) - ["position", "rotation", "scale"].indexOf(right.kind)) ?? [];
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
