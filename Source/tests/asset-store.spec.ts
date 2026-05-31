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
  await page.route("**/Avocado.glb", (route) => {
    const body = createMinimalGlb();
    void route.fulfill({
      status: 200,
      contentType: "model/gltf-binary",
      headers: { "access-control-allow-origin": "*", "content-length": String(body.length) },
      body
    });
  });
  await page.goto("/");

  await page.locator("#asset-browser-toggle").click();
  await expect(page.locator("#asset-store")).toBeVisible();
  await expect(page.locator("#asset-browser")).toBeVisible();

  await page.locator('[data-remote-asset-id="khronos-avocado"]').click();
  await expect(page.locator("#selection-summary")).toContainText("Avocado");

  await page.locator('[data-asset-tab="built-in"]').click();
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
  expect(scene.objects.some((object) => object.name === "Avocado")).toBe(true);
  expect(scene.objects.some((object) => object.name === "Teapot")).toBe(true);
  expect(scene.objects.some((object) => object.name === "Sample Drone")).toBe(true);
  expect(scene.rendering.shadowQuality).toBe("ultra");
  expect(scene.rendering.postProcessing.ssao).toBe(true);
  expect(scene.rendering.postProcessing.bloom).toBe(true);

  await page.locator("#asset-browser-minimize").click();
  await expect(page.locator("#asset-browser")).toHaveClass(/is-minimized/);
  await page.locator("#asset-browser-restore").click();
  await expect(page.locator("#asset-browser")).not.toHaveClass(/is-minimized/);
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
