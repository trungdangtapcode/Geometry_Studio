import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  objects: Array<{ name: string; textureName: string; renderMode: string }>;
  rendering: {
    exposure: number;
    shadowQuality: string;
    postProcessing: { ssao: boolean; bloom: boolean; vignette: boolean; halftone: boolean };
  };
};

test("applies built-in asset store looks, textures, and models", async ({ page }) => {
  test.setTimeout(180_000);
  await installSceneDownloadCapture(page);
  await page.goto("/");

  await expect(page.locator("#asset-store")).toBeVisible();
  await page.locator('[data-asset-id="texture-bricks"]').click();
  await expect(page.locator("#texture-input")).toBeAttached();

  await page.locator('[data-asset-id="look-product"]').click();
  await expect(page.locator("#renderer-mode")).toContainText("Shadows Ultra");
  await expect(page.locator("#renderer-mode")).toContainText(/SSAO On.*Bloom On.*Vignette On/);

  await page.locator('[data-asset-id="primitive-teapot"]').click();
  await expect(page.locator("#selection-summary")).toContainText("Teapot");
  await page.locator('[data-asset-id="model-drone"]').click();
  await expect(page.locator("#selection-summary")).toContainText("Sample Drone");

  const scene = await saveScene(page);
  expect(scene.objects.some((object) => object.textureName === "bricks")).toBe(true);
  expect(scene.objects.some((object) => object.name === "Teapot")).toBe(true);
  expect(scene.objects.some((object) => object.name === "Sample Drone")).toBe(true);
  expect(scene.rendering.shadowQuality).toBe("ultra");
  expect(scene.rendering.postProcessing.ssao).toBe(true);
  expect(scene.rendering.postProcessing.bloom).toBe(true);
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
