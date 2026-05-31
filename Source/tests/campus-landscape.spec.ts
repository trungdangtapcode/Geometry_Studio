import { expect, test, type Page } from "@playwright/test";

type SceneExport = {
  objects: Array<{ name: string; assetSource?: { providerLabel: string; assetId: string } }>;
  rendering: { postProcessing: { dof: boolean; ssao: boolean; bloom: boolean } };
};

test("loads the copied campus landscape as a complete scene", async ({ page }) => {
  test.setTimeout(120_000);
  await installSceneDownloadCapture(page);
  await page.route("**/assets/campus/e-hall.glb", async (route) => {
    const body = createMinimalGlb();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "model/gltf-binary",
      headers: { "access-control-allow-origin": "*", "content-length": String(body.length) },
      body
    });
  });
  await page.goto("/");

  await page.locator("#post-dof-toggle").check();
  await expect(page.locator("#post-dof-toggle")).toBeChecked();

  await page.locator("#asset-browser-toggle").click();
  await page.locator('[data-asset-tab="campus"]').click();
  const loadButton = page.locator("#load-campus-landscape");
  await expect(loadButton).toContainText("Load Campus");
  await loadButton.click();
  await expect(loadButton.locator("[data-campus-scene-button-label]")).toHaveText(/Load Campus|Loaded|Retry Campus/);

  await expect(page.locator("#selection-summary")).toContainText("Campus Landscape - E Hall", { timeout: 20_000 });
  await expect(page.locator("#selection-summary")).toContainText("Local Campus Project");
  await expect(page.locator("#load-progress")).toContainText("Campus landscape ready");
  await expect(page.locator("#post-dof-toggle")).not.toBeChecked();

  const scene = await saveScene(page);
  expect(scene.objects).toHaveLength(1);
  expect(scene.objects[0]?.name).toBe("Campus Landscape - E Hall");
  expect(scene.objects[0]?.assetSource?.providerLabel).toBe("Local Campus Project");
  expect(scene.objects[0]?.assetSource?.assetId).toBe("campus-e-hall");
  expect(scene.rendering.postProcessing.dof).toBe(false);
  expect(scene.rendering.postProcessing.ssao).toBe(false);
  expect(scene.rendering.postProcessing.bloom).toBe(false);
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

function createMinimalGlb(): Buffer {
  const positions = Buffer.alloc(36);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => positions.writeFloatLE(value, index * 4));
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, mode: 4 }] }],
    buffers: [{ byteLength: positions.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0]
      }
    ]
  });
  const jsonChunk = padToFourBytes(Buffer.from(json, "utf8"), 0x20);
  const binaryChunk = padToFourBytes(positions, 0x00);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binaryChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binaryChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binaryChunk]);
}

function padToFourBytes(buffer: Buffer, fill: number): Buffer {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(padding, fill)]);
}
