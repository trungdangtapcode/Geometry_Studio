import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  objects: Array<{ id: string; name: string }>;
  timeline: {
    hideShyObjects: boolean;
    shyObjectIds: string[];
  };
};

test("marks object layers shy and hides them from timeline rows", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  await installSceneDownloadCapture(page);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator("#timeline-row-filter")).toBeVisible();
  await page.locator("#timeline-row-filter").selectOption("all");
  const cubeGroup = page.locator('.timeline-track-group[data-group-target-id="object-1"]');
  const sphereGroup = page.locator('.timeline-track-group[data-group-target-id="object-3"]');
  await expect(cubeGroup).toHaveCount(1, { timeout: 30_000 });
  await expect(sphereGroup).toHaveCount(1, { timeout: 30_000 });

  await page.locator("#timeline-shy-selected").click();
  await expect(page.locator("#timeline-shy-selected")).toContainText("Unshy");

  await sphereGroup.click();
  await expect(page.locator("#selection-summary")).toContainText("Sphere");

  await page.locator("#timeline-hide-shy").click();
  await expect(page.locator("#timeline-hide-shy")).toContainText("Show Shy");
  await expect(sphereGroup).toHaveCount(1);
  await expect(cubeGroup).toHaveCount(0);

  const scene = await saveScene(page);
  const cube = scene.objects.find((object) => object.id === "object-1");
  expect(cube).toBeTruthy();
  expect(scene.timeline.hideShyObjects).toBe(true);
  expect(scene.timeline.shyObjectIds).toContain(cube!.id);
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

async function saveScene(page: Page): Promise<SceneExport> {
  const previousCount = await page.evaluate(() => (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads?.length ?? 0);
  await page.locator("#save-scene").click();
  const sceneText = await page.waitForFunction((count) => {
    const downloads = (window as unknown as { __sceneDownloads?: string[] }).__sceneDownloads;
    return downloads && downloads.length > count ? downloads.at(-1) : null;
  }, previousCount);
  return JSON.parse((await sceneText.jsonValue()) as string) as SceneExport;
}
